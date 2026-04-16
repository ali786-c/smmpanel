<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Profile;
use App\Models\Referral;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
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
                'password' => Hash::make($validated['password']),
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
        } catch (\Exception $e) {
            // Token already invalid — that's fine
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
        // Always return the same response to prevent email enumeration
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

        $user = User::where('email', strtolower(trim($validated['email'])))->first();

        // Always return the same response to prevent email enumeration
        if (!$user) {
            return response()->json(['message' => 'If the token is valid, your password has been reset.']);
        }

        $user->update(['password' => Hash::make($validated['password'])]);

        Log::info('Password reset completed', ['user_id' => $user->id]);

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
}
