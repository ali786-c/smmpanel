<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Profile;
use App\Models\Referral;
use App\Models\User;
use App\Models\UserRole;
use App\Models\Wallet;
use App\Services\TurnstileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use App\Services\MailjetService;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    private TurnstileService $turnstile;

    public function __construct(TurnstileService $turnstile)
    {
        $this->turnstile = $turnstile;
    }

    public function register(Request $request)
    {
        // Honeypot: bots often fill hidden fields
        if (!empty($request->input('website')) || !empty($request->input('phone_confirm'))) {
            Log::warning('Honeypot triggered on register', ['ip' => $request->ip()]);
            // Silently delay and fake success to confuse bots
            sleep(2);
            return response()->json(['message' => 'Account created! Please log in.'], 201);
        }

        // Cloudflare Turnstile bot check
        $cfToken = $request->input('cf_turnstile_response');
        if (!$this->turnstile->verify($cfToken, $request->ip())) {
            return response()->json(['error' => 'Bot verification failed. Please complete the CAPTCHA and try again.'], 422);
        }

        $validated = $request->validate([
            'email'         => 'required|email|max:254|unique:users,email',
            'password'      => ['required', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*[0-9]).+$/'],
            'full_name'     => 'nullable|string|max:100',
            'referral_code' => 'nullable|string|max:20',
        ], [
            'password.regex' => 'Password must contain at least one letter and one number.',
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'email'    => strtolower(trim($validated['email'])),
                'password' => $validated['password'],
            ]);

            $referralCode = strtolower(substr(md5($user->id . now()), 0, 8));

            Profile::create([
                'id'           => (string) Str::uuid(),
                'user_id'      => $user->id,
                'display_name' => $validated['full_name'] ?? $validated['email'],
                'api_key'      => bin2hex(random_bytes(32)),
                'referral_code'=> $referralCode,
            ]);

            Wallet::create([
                'id'      => (string) Str::uuid(),
                'user_id' => $user->id,
                'balance' => 0,
            ]);

            UserRole::create([
                'user_id' => $user->id,
                'role'    => 'user',
            ]);

            // Handle referral
            if (!empty($validated['referral_code'])) {
                $referrerProfile = Profile::where('referral_code', $validated['referral_code'])->first();
                if ($referrerProfile) {
                    Referral::create([
                        'id'             => (string) Str::uuid(),
                        'referrer_id'    => $referrerProfile->user_id,
                        'referred_id'    => $user->id,
                        'commission_rate'=> 0.015,
                    ]);
                }
            }

            DB::commit();

            $token = JWTAuth::fromUser($user);
            $this->sendWelcomeEmail($user);

            return response()->json([
                'token' => $token,
                'user'  => $this->formatUser($user),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Registration failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Registration failed. Please try again.'], 500);
        }
    }

    public function login(Request $request)
    {
        // Honeypot: bots often fill hidden fields
        if (!empty($request->input('website')) || !empty($request->input('phone_confirm'))) {
            Log::warning('Honeypot triggered on login', ['ip' => $request->ip()]);
            sleep(2);
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        // Cloudflare Turnstile bot check
        $cfToken = $request->input('cf_turnstile_response');
        if (!$this->turnstile->verify($cfToken, $request->ip())) {
            return response()->json(['error' => 'Bot verification failed. Please complete the CAPTCHA and try again.'], 422);
        }

        $validated = $request->validate([
            'email'    => 'required|email|max:254',
            'password' => 'required|string',
        ]);

        $credentials = [
            'email'    => strtolower(trim($validated['email'])),
            'password' => $validated['password'],
        ];

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $user = auth()->user();

        if ($user->isBanned()) {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['error' => 'Your account has been suspended. Please contact support.'], 403);
        }

        // Log successful login
        try {
            ActivityLog::create([
                'id'          => (string) Str::uuid(),
                'actor_id'    => $user->id,
                'action'      => 'login',
                'target_type' => 'user',
                'target_id'   => $user->id,
                'ip_address'  => $request->ip(),
                'created_at'  => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to log login activity', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user),
        ]);
    }

    public function me()
    {
        $user = auth()->user()->load(['profile', 'roles', 'wallet']);
        return response()->json([
            'user' => [
                'id'      => $user->id,
                'email'   => $user->email,
                'profile' => $user->profile,
                'roles'   => $user->roles->pluck('role'),
                'wallet'  => $user->wallet,
            ],
        ]);
    }

    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Throwable $e) {
            // Token already invalid or driver issue — that's fine
        }
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function refresh()
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json(['token' => $token]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Token refresh failed'], 401);
        }
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email|max:254']);

        $email = strtolower(trim($request->input('email')));
        $user = User::where('email', $email)->first();

        if ($user) {
            $token = hash_hmac('sha256', Str::random(64), config('app.key'));
            DB::table('password_resets')->updateOrInsert(
                ['email' => $email],
                ['token' => $token, 'created_at' => now()]
            );

            try {
                app(MailjetService::class)->sendTemplate(
                    $email,
                    $user->profile?->display_name ?? $user->email,
                    'Reset your password',
                    'emails.password-reset',
                    [
                        'name' => $user->profile?->display_name ?? 'Customer',
                        'resetUrl' => env('FRONTEND_URL', config('app.url')) . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($email),
                    ]
                );
            } catch (\Throwable $e) {
                Log::warning('Mailjet forgot password send failed', ['error' => $e->getMessage(), 'email' => $email]);
            }
        }

        return response()->json(['message' => 'If this email exists, a password reset link has been sent.']);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email|max:254',
            'password' => ['required', 'min:8', 'regex:/^(?=.*[a-zA-Z])(?=.*[0-9]).+$/'],
        ], [
            'password.regex' => 'Password must contain at least one letter and one number.',
        ]);

        $email = strtolower(trim($validated['email']));
        $record = DB::table('password_resets')
            ->where('email', $email)
            ->where('token', $validated['token'])
            ->first();

        if ($record === null || Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            return response()->json(['message' => 'If the token is valid, your password has been reset.']);
        }

        $user = User::where('email', $email)->first();
        if ($user) {
            $user->update(['password' => $validated['password']]);
            DB::table('password_resets')->where('email', $email)->delete();
            Log::info('Password reset completed', ['user_id' => $user->id]);
        }

        return response()->json(['message' => 'Password reset successfully. You can now log in.']);
    }

    private function formatUser(User $user): array
    {
        $user->load(['profile', 'roles']);
        $data = $user->toArray();
        unset($data['password']); // never expose password hash
        return array_merge($data, [
            'profile' => $user->profile,
            'roles'   => $user->roles->pluck('role'),
        ]);
    }

    private function sendWelcomeEmail(User $user): void
    {
        try {
            app(MailjetService::class)->sendTemplate(
                $user->email,
                $user->profile?->display_name ?? $user->email,
                'Welcome to ' . config('app.name', 'emazingSM'),
                'emails.welcome',
                [
                    'name' => $user->profile?->display_name ?? 'Customer',
                    'loginUrl' => env('FRONTEND_URL', config('app.url')), 
                ]
            );
        } catch (\Throwable $e) {
            Log::warning('Mailjet welcome email failed', ['error' => $e->getMessage(), 'email' => $user->email]);
        }
    }
}
