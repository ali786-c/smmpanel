<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\Referral;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'full_name' => 'nullable|string|max:100',
            'referral_code' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            $referralCode = strtolower(substr(md5($user->id . now()), 0, 8));

            Profile::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'display_name' => $validated['full_name'] ?? $validated['email'],
                'api_key' => bin2hex(random_bytes(32)),
                'referral_code' => $referralCode,
            ]);

            Wallet::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'balance' => 0,
            ]);

            // Handle referral
            if (!empty($validated['referral_code'])) {
                $referrerProfile = Profile::where('referral_code', $validated['referral_code'])->first();
                if ($referrerProfile) {
                    Referral::create([
                        'id' => (string) Str::uuid(),
                        'referrer_id' => $referrerProfile->user_id,
                        'referred_id' => $user->id,
                        'commission_rate' => 0.015,
                    ]);
                }
            }

            DB::commit();

            $token = JWTAuth::fromUser($user);
            return response()->json([
                'token' => $token,
                'user' => array_merge($user->toArray(), [
                    'profile' => $user->profile,
                    'roles' => $user->roles->pluck('role'),
                ]),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!$token = JWTAuth::attempt(['email' => $validated['email'], 'password' => $validated['password']])) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $user = auth()->user();
        if ($user->isBanned()) {
            return response()->json(['error' => 'Your account has been suspended. Contact support.'], 403);
        }

        return response()->json([
            'token' => $token,
            'user' => array_merge($user->toArray(), [
                'profile' => $user->profile,
                'roles' => $user->roles->pluck('role'),
            ]),
        ]);
    }

    public function me()
    {
        $user = auth()->user()->load(['profile', 'roles', 'wallet']);
        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'profile' => $user->profile,
            'roles' => $user->roles->pluck('role'),
            'wallet' => $user->wallet,
        ]);
    }

    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Logged out']);
    }

    public function refresh()
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());
        return response()->json(['token' => $token]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        // In a real app, send password reset email via mailer
        return response()->json(['message' => 'If this email exists, a reset link has been sent.']);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $user->update(['password' => Hash::make($validated['password'])]);
        return response()->json(['message' => 'Password reset successful']);
    }
}
