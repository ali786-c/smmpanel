<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function overview()
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $last30Days = now()->subDays(30);

        return response()->json([
            'stats' => [
                'total_users' => User::count(),
                'new_users_today' => User::whereDate('created_at', $today)->count(),
                'total_orders' => Order::count(),
                'orders_today' => Order::whereDate('created_at', $today)->count(),
                'revenue_today' => Order::whereDate('created_at', $today)->sum('cost'),
                'revenue_month' => Order::where('created_at', '>=', $last30Days)->sum('cost'),
                'active_services' => Service::where('is_active', true)->count(),
                'open_tickets' => Ticket::where('status', 'open')->count(),
                'deposits_today' => WalletTransaction::whereDate('created_at', $today)->where('type', 'deposit')->sum('amount'),
            ],
            'recent_orders' => Order::with(['user:id,email', 'service:id,name'])
                ->orderByDesc('created_at')
                ->take(10)
                ->get(),
            'recent_users' => User::with('profile:user_id,display_name')
                ->orderByDesc('created_at')
                ->take(5)
                ->get(['id', 'email', 'created_at']),
        ]);
    }

    public function charts()
    {
        $days = 30;
        $dailyRevenue = Order::selectRaw("DATE(created_at) as date, SUM(cost) as revenue, COUNT(*) as orders")
            ->where('created_at', '>=', now()->subDays($days))
            ->where('status', '!=', 'Cancelled')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $byPlatform = Order::join('services', 'orders.service_id', '=', 'services.id')
            ->selectRaw('services.platform, COUNT(*) as count, SUM(orders.cost) as revenue')
            ->where('orders.created_at', '>=', now()->subDays($days))
            ->groupBy('services.platform')
            ->orderByDesc('count')
            ->get();

        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        return response()->json([
            'daily_revenue' => $dailyRevenue,
            'by_platform' => $byPlatform,
            'orders_by_status' => $ordersByStatus,
        ]);
    }
}
