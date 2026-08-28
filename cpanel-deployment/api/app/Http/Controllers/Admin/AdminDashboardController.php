<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function overview()
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $last30Days = now()->subDays(30);

        $recentOrders = Order::with(['user:id,email', 'service:id,name'])
            ->orderByDesc('created_at')
            ->take(10)
            ->get()
            ->map(fn($o) => array_merge($o->toArray(), [
                'user_email' => $o->user?->email,
                'service_name' => $o->service?->name,
            ]));

        return response()->json([
            'stats' => [
                'total_users' => User::count(),
                'new_users_today' => User::whereDate('created_at', $today)->count(),
                'total_orders' => Order::count(),
                'active_orders' => Order::whereIn('status', ['Pending', 'In progress', 'Processing'])->count(),
                'orders_today' => Order::whereDate('created_at', $today)->count(),
                'total_revenue' => Order::where('status', '!=', 'Cancelled')->selectRaw("COALESCE(SUM(CASE WHEN status = 'Refunded' THEN cost * 0.3 ELSE cost END), 0) as total_rev")->value('total_rev'),
                'total_profit' => DB::table('orders')->where('status', '!=', 'Cancelled')->selectRaw("COALESCE(SUM(CASE WHEN status = 'Refunded' THEN cost * 0.3 ELSE cost - COALESCE(provider_cost, 0) END), 0) as profit")->value('profit'),
                'revenue_today' => Order::whereDate('created_at', $today)->where('status', '!=', 'Cancelled')->selectRaw("COALESCE(SUM(CASE WHEN status = 'Refunded' THEN cost * 0.3 ELSE cost END), 0) as rev")->value('rev'),
                'revenue_month' => Order::where('created_at', '>=', $last30Days)->where('status', '!=', 'Cancelled')->selectRaw("COALESCE(SUM(CASE WHEN status = 'Refunded' THEN cost * 0.3 ELSE cost END), 0) as rev")->value('rev'),
                'total_services' => Service::count(),
                'active_services' => Service::where('is_active', true)->count(),
                'pending_tickets' => Ticket::where('status', '!=', 'closed')->count(),
                'open_tickets' => Ticket::where('status', 'open')->count(),
                'deposits_today' => WalletTransaction::whereDate('created_at', $today)->where('type', 'deposit')->sum('amount'),
            ],
            'recent_orders' => $recentOrders,
            'recent_users' => User::with('profile:user_id,display_name')
                ->orderByDesc('created_at')
                ->take(5)
                ->get(['id', 'email', 'created_at']),
        ]);
    }

    public function charts()
    {
        $days = 30;
        $dailyRevenue = DB::table('orders')
            ->selectRaw("DATE(created_at) as date,
                         COALESCE(SUM(CASE WHEN status = 'Refunded' THEN cost * 0.3 ELSE cost END), 0) as revenue,
                         COALESCE(SUM(CASE WHEN status = 'Refunded' THEN cost * 0.3 ELSE cost - COALESCE(provider_cost, 0) END), 0) as profit,
                         COUNT(*) as orders")
            ->where('created_at', '>=', now()->subDays($days))
            ->where('status', '!=', 'Cancelled')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($r) => [
                'date' => $r->date,
                'revenue' => (float) $r->revenue,
                'profit' => (float) $r->profit,
                'orders' => (int) $r->orders,
            ]);

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
