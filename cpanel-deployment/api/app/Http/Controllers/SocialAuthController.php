<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Tymon\JWTAuth\Facades\JWTAuth;

class SocialAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     *
     * @return \Illuminate\Http\Response
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Obtain the user information from Google.
     *
     * @return \Illuminate\Http\Response
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            $user = User::where('google_id', $googleUser->id)
                ->orWhere('email', strtolower(trim($googleUser->email)))
                ->first();

            if ($user) {
                // Link google_id if not already linked
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->id]);
                }
            } else {
                // Create new user
                DB::beginTransaction();
                try {
                    $user = User::create([
                        'id'        => (string) Str::uuid(),
                        'google_id' => $googleUser->id,
                        'email'     => strtolower(trim($googleUser->email)),
                        'password'  => Hash::make(Str::random(24)), // Random password for social users
                    ]);

                    $referralCode = strtolower(substr(md5($user->id . now()), 0, 8));

                    Profile::create([
                        'id'           => (string) Str::uuid(),
                        'user_id'      => $user->id,
                        'display_name' => $googleUser->name ?? $googleUser->email,
                        'avatar_url'   => $googleUser->avatar,
                        'api_key'      => bin2hex(random_bytes(32)),
                        'referral_code'=> $referralCode,
                    ]);

                    Wallet::create([
                        'id'      => (string) Str::uuid(),
                        'user_id' => $user->id,
                        'balance' => 0,
                    ]);

                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error('Google Auth: User creation failed', ['error' => $e->getMessage()]);
                    return redirect(config('app.frontend_url') . '/login?error=auth_failed');
                }
            }

            $user->update(['last_login_at' => now()]);
            $token = JWTAuth::fromUser($user);

            // Redirect back to frontend with token
            $frontendUrl = config('app.frontend_url', 'https://emazingsm.com');
            return redirect($frontendUrl . '/login?token=' . $token);

        } catch (\Exception $e) {
            Log::error('Google Auth Error', ['error' => $e->getMessage()]);
            return redirect(config('app.frontend_url') . '/login?error=auth_failed');
        }
    }
}
