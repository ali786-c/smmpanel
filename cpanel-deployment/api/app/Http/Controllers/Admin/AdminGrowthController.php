<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Profile;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminGrowthController extends Controller
{
    public function run(Request $request)
    {
        $action = $request->input('action', 'all');
        $results = [];

        if (in_array($action, ['all', 're-engagement'])) {
            $results['reEngagement'] = $this->reEngagement();
        }
        if (in_array($action, ['all', 'auto-promo'])) {
            $results['autoPromo'] = $this->autoPromo();
        }
        if (in_array($action, ['all', 'abandoned-recovery'])) {
            $results['abandonedRecovery'] = $this->abandonedRecovery();
        }
        if (in_array($action, ['all', 'loyalty-check'])) {
            $results['loyaltyCheck'] = ['note' => 'Handled by database triggers on order insert'];
        }

        return response()->json(['success' => true, 'results' => $results]);
    }

    private function reEngagement(): array
    {
        $thirtyDaysAgo = now()->subDays(30);
        $sevenDaysAgo = now()->subDays(7);

        $allProfiles = Profile::where('is_banned', false)->pluck('user_id');
        $activeOrderUserIds = Order::where('created_at', '>=', $thirtyDaysAgo)->pluck('user_id')->unique();
        $recentlyNotified = Notification::where('type', 'promo')
            ->where('title', 'like', '%miss you%')
            ->where('created_at', '>=', $sevenDaysAgo)
            ->pluck('user_id')
            ->unique();

        $inactiveUsers = $allProfiles->filter(
            fn($uid) => !$activeOrderUserIds->contains($uid) && !$recentlyNotified->contains($uid)
        )->take(200);

        if ($inactiveUsers->isEmpty()) {
            return ['inactiveUsers' => 0, 'notified' => 0];
        }

        $couponCode = 'COMEBACK' . now()->format('Ymd');
        Coupon::firstOrCreate(
            ['code' => $couponCode],
            [
                'discount_type' => 'percentage',
                'discount_value' => 10,
                'is_active' => true,
                'expires_at' => now()->addDays(7),
                'min_order_amount' => 0,
            ]
        );

        $notifications = $inactiveUsers->map(fn($uid) => [
            'id' => (string) Str::uuid(),
            'user_id' => $uid,
            'title' => 'We miss you!',
            'message' => "It's been a while! Use code {$couponCode} for 10% off your next order.",
            'type' => 'promo',
            'link' => '/dashboard/new-order',
            'read' => false,
            'created_at' => now(),
        ])->values()->toArray();

        Notification::insert($notifications);

        return ['inactiveUsers' => $inactiveUsers->count(), 'notified' => count($notifications), 'coupon' => $couponCode];
    }

    private function autoPromo(): array
    {
        // Deactivate expired coupons
        $expired = Coupon::where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->count();

        Coupon::where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['is_active' => false]);

        // Friday weekend promo
        $results = ['expired_coupons' => $expired];

        if (now()->dayOfWeek === 5) { // Friday
            $weekendCode = 'WEEKEND' . now()->format('Ymd');
            $existing = Coupon::where('code', $weekendCode)->exists();

            if (!$existing) {
                Coupon::create([
                    'code' => $weekendCode,
                    'discount_type' => 'percentage',
                    'discount_value' => 15,
                    'is_active' => true,
                    'expires_at' => now()->next('Monday'),
                    'min_order_amount' => 0,
                ]);

                $userIds = Profile::where('is_banned', false)->pluck('user_id');
                $notifications = $userIds->take(500)->map(fn($uid) => [
                    'id' => (string) Str::uuid(),
                    'user_id' => $uid,
                    'title' => 'Weekend Special!',
                    'message' => "Use code {$weekendCode} for 15% off all weekend!",
                    'type' => 'promo',
                    'link' => '/dashboard/new-order',
                    'read' => false,
                    'created_at' => now(),
                ])->values()->toArray();

                Notification::insert($notifications);
                $results['weekend_promo'] = ['code' => $weekendCode, 'notified' => count($notifications)];
            }
        }

        return $results;
    }

    private function abandonedRecovery(): array
    {
        $threeDaysAgo = now()->subDays(3);
        $sevenDaysAgo = now()->subDays(7);

        $usersWithBalance = Wallet::where('balance', '>', 0)->pluck('user_id');
        $recentOrderUsers = Order::where('created_at', '>=', $threeDaysAgo)->pluck('user_id')->unique();
        $alreadyNudged = Notification::where('type', 'promo')
            ->where('title', 'like', '%Finish your order%')
            ->where('created_at', '>=', $sevenDaysAgo)
            ->pluck('user_id')
            ->unique();

        $abandonedUsers = $usersWithBalance->filter(
            fn($uid) => !$recentOrderUsers->contains($uid) && !$alreadyNudged->contains($uid)
        )->take(200);

        if ($abandonedUsers->isEmpty()) {
            return ['abandonedUsers' => 0, 'notified' => 0];
        }

        $couponCode = 'FINISH5';
        Coupon::firstOrCreate(
            ['code' => $couponCode],
            [
                'discount_type' => 'percentage',
                'discount_value' => 5,
                'is_active' => true,
                'expires_at' => now()->addDays(14),
                'min_order_amount' => 0,
            ]
        );

        $notifications = $abandonedUsers->map(fn($uid) => [
            'id' => (string) Str::uuid(),
            'user_id' => $uid,
            'title' => 'Finish your order!',
            'message' => "You have balance in your wallet. Use code {$couponCode} for 5% off your next order!",
            'type' => 'promo',
            'link' => '/dashboard/new-order',
            'read' => false,
            'created_at' => now(),
        ])->values()->toArray();

        Notification::insert($notifications);

        return ['abandonedUsers' => $abandonedUsers->count(), 'notified' => count($notifications)];
    }

    public function stats()
    {
        $thirtyDaysAgo = now()->subDays(30);

        return response()->json([
            'active_users' => User::whereHas('orders', fn($q) => $q->where('created_at', '>=', $thirtyDaysAgo))->count(),
            'inactive_users' => User::whereDoesntHave('orders', fn($q) => $q->where('created_at', '>=', $thirtyDaysAgo))->count(),
            'users_with_balance' => Wallet::where('balance', '>', 0)->count(),
            'total_notifications_sent' => Notification::where('type', 'promo')->count(),
            'active_coupons' => Coupon::where('is_active', true)->count(),
            'revenue_last_30_days' => Order::where('created_at', '>=', $thirtyDaysAgo)->sum('cost'),
        ]);
    }
}
