<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\Referral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show()
    {
        $user = auth()->user()->load(['profile', 'wallet', 'roles']);

        $totalSpent = $user->orders()->sum('cost');
        $totalOrders = $user->orders()->count();

        $tier = $this->getLoyaltyTier($totalSpent);

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'profile' => $user->profile,
            'wallet' => $user->wallet,
            'roles' => $user->roles->pluck('role'),
            'stats' => [
                'total_spent' => $totalSpent,
                'total_orders' => $totalOrders,
                'tier' => $tier,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'display_name' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'avatar_url' => 'nullable|url',
        ]);

        $user = auth()->user();
        $profile = Profile::where('user_id', $user->id)->firstOrFail();
        $profile->update(array_filter($validated, fn($v) => $v !== null));

        return response()->json($profile);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6',
        ]);

        $user = auth()->user();
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['error' => 'Current password is incorrect'], 422);
        }

        $user->update(['password' => Hash::make($validated['new_password'])]);
        return response()->json(['message' => 'Password changed successfully']);
    }

    public function regenerateApiKey()
    {
        $user = auth()->user();
        $profile = Profile::where('user_id', $user->id)->firstOrFail();
        $newKey = bin2hex(random_bytes(32));
        $profile->update(['api_key' => $newKey]);

        return response()->json(['api_key' => $newKey]);
    }

    public function referrals()
    {
        $user = auth()->user();
        $referrals = Referral::where('referrer_id', $user->id)
            ->with(['referred' => fn($q) => $q->with('profile:user_id,display_name,created_at')])
            ->get();

        $totalEarnings = $referrals->sum('total_earnings');
        $profile = Profile::where('user_id', $user->id)->first();

        return response()->json([
            'referral_code' => $profile?->referral_code,
            'referrals' => $referrals,
            'total_earnings' => $totalEarnings,
            'total_referrals' => $referrals->count(),
        ]);
    }

    public function notificationPreferences()
    {
        $user = auth()->user();
        $prefs = \App\Models\NotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'order_updates' => true,
                'promotions' => true,
                'announcements' => true,
                'ticket_replies' => true,
            ]
        );
        return response()->json($prefs);
    }

    public function updateNotificationPreferences(Request $request)
    {
        $validated = $request->validate([
            'order_updates' => 'nullable|boolean',
            'promotions' => 'nullable|boolean',
            'announcements' => 'nullable|boolean',
            'ticket_replies' => 'nullable|boolean',
        ]);

        $user = auth()->user();
        $prefs = \App\Models\NotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            ['id' => (string) \Illuminate\Support\Str::uuid()]
        );
        $prefs->update($validated);

        return response()->json($prefs->fresh());
    }

    private function getLoyaltyTier(float $totalSpent): string
    {
        if ($totalSpent >= 10000) return 'Master';
        if ($totalSpent >= 5000) return 'VIP';
        if ($totalSpent >= 2000) return 'Elite';
        if ($totalSpent >= 500) return 'Frequent';
        if ($totalSpent >= 100) return 'Junior';
        return 'New';
    }
}
