<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RefundLog;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;

class AdminFinanceController extends Controller
{
    public function overview(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->subDays(30)->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        $totalRevenue = Order::whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->where('status', '!=', 'Cancelled')
            ->selectRaw("COALESCE(SUM(CASE WHEN status = 'Refunded' THEN cost * 0.3 ELSE cost END), 0) as total_rev")
            ->value('total_rev') ?? 0;

        $totalProviderCost = Order::whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->whereNotIn('status', ['Cancelled', 'Refunded'])
            ->sum('provider_cost');

        $totalDeposits = WalletTransaction::whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->where('type', 'deposit')
            ->sum('amount');

        $totalRefunds = WalletTransaction::whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->where('type', 'refund')
            ->sum('amount');

        $totalWalletBalance = Wallet::sum('balance');

        $dailyRevenue = \Illuminate\Support\Facades\DB::table('orders')
            ->selectRaw("DATE(created_at) as date,
                         COALESCE(SUM(CASE WHEN status = 'Refunded' THEN cost * 0.3 ELSE cost END), 0) as revenue,
                         COALESCE(SUM(CASE WHEN status = 'Refunded' THEN cost * 0.3 ELSE cost - COALESCE(provider_cost, 0) END), 0) as profit,
                         COUNT(*) as orders")
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
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

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_provider_cost' => $totalProviderCost,
            'gross_profit' => $totalRevenue - $totalProviderCost,
            'total_deposits' => $totalDeposits,
            'total_refunds' => $totalRefunds,
            'total_wallet_balance' => $totalWalletBalance,
            'daily_revenue' => $dailyRevenue,
        ]);
    }

    public function transactions(Request $request)
    {
        $query = WalletTransaction::with(['user:id,email', 'payhubDetails'])
            ->orderByDesc('created_at');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('email', 'LIKE', '%' . $search . '%');
            });
        }

        return response()->json($query->paginate($request->get('per_page', 25)));
    }

    public function refunds(Request $request)
    {
        $query = RefundLog::with(['user:id,email', 'order:id,link,status,external_order_id'])
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate($request->get('per_page', 25)));
    }
}
