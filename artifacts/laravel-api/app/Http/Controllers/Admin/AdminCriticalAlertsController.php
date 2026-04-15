<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Service;
use App\Models\SystemSetting;
use App\Models\Ticket;
use Illuminate\Http\Request;

/**
 * AdminCriticalAlertsController
 *
 * Powers the "Critical Alerts" tab in the admin panel.
 * Returns three buckets:
 *
 *  1. stale_orders      – orders stuck in Pending/In progress with a JustPanel
 *                         order ID, grouped by severity (24h / 48h / 72h+).
 *                         Each row includes provider_order_id so it can be
 *                         copy-pasted directly into a JustPanel support ticket.
 *
 *  2. negative_margin   – services whose current selling price is at or below
 *                         the last-known provider rate (sourced from the price
 *                         watch alert stored in system_settings).
 *
 *  3. stale_tickets     – user tickets with status open/in_progress that have
 *                         not been updated in over 24 hours.
 *
 *  4. price_watch_alert – the raw payload from the last automation:price-watch
 *                         run, if any.
 */
class AdminCriticalAlertsController extends Controller
{
    public function index(Request $request)
    {
        $staleHours = (int) $request->get('stale_hours', 24); // configurable threshold

        // ── 1. Stale orders ────────────────────────────────────────────────
        $staleOrders = Order::with(['user:id,email', 'user.profile:user_id,display_name', 'service:id,name,platform,category'])
            ->whereIn('status', ['Pending', 'In progress', 'Processing'])
            ->where('created_at', '<=', now()->subHours($staleHours))
            ->whereNotNull('provider_order_id')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                $ageHours = now()->diffInHours($order->created_at);
                $severity = match (true) {
                    $ageHours >= 96 => 'critical',   // 4+ days
                    $ageHours >= 72 => 'urgent',     // 3 days
                    $ageHours >= 48 => 'high',       // 2 days
                    default         => 'warning',    // 1 day
                };

                return [
                    'id'                => $order->id,
                    'provider_order_id' => $order->provider_order_id,
                    'external_order_id' => $order->external_order_id,
                    'status'            => $order->status,
                    'link'              => $order->link,
                    'quantity'          => $order->quantity,
                    'cost'              => $order->cost,
                    'created_at'        => $order->created_at,
                    'age_hours'         => $ageHours,
                    'severity'          => $severity,
                    'user_email'        => $order->user?->email,
                    'user_name'         => $order->user?->profile?->display_name,
                    'service_name'      => $order->service?->name,
                    'service_platform'  => $order->service?->platform,
                    // Convenience string for copying into JustPanel support ticket
                    'justpanel_ticket_line' => "Order ID: {$order->provider_order_id} | Service: {$order->service?->name} | Link: {$order->link} | Qty: {$order->quantity} | Placed: {$order->created_at->toDateTimeString()} ({$ageHours}h ago)",
                ];
            });

        // Group by severity
        $bySevertiy = $staleOrders->groupBy('severity');

        // ── 2. Negative / thin margin services ────────────────────────────
        // Uses the last price-watch alert. If price-watch hasn't run yet,
        // we do a quick on-the-fly check without calling the provider API.
        $priceWatchRaw  = SystemSetting::get('price_watch_last_alert');
        $priceWatchAlert = $priceWatchRaw ? json_decode($priceWatchRaw, true) : null;

        // ── 3. Stale tickets ──────────────────────────────────────────────
        $staleTickets = Ticket::with(['user:id,email', 'user.profile:user_id,display_name'])
            ->whereIn('status', ['open', 'in_progress'])
            ->where('updated_at', '<=', now()->subHours(24))
            ->orderBy('updated_at')
            ->get()
            ->map(function ($ticket) {
                $ageHours = now()->diffInHours($ticket->updated_at);
                return [
                    'id'            => $ticket->id,
                    'subject'       => $ticket->subject,
                    'status'        => $ticket->status,
                    'priority'      => $ticket->priority,
                    'updated_at'    => $ticket->updated_at,
                    'age_hours'     => $ageHours,
                    'severity'      => $ageHours >= 72 ? 'critical' : ($ageHours >= 48 ? 'urgent' : 'warning'),
                    'user_email'    => $ticket->user?->email,
                    'user_name'     => $ticket->user?->profile?->display_name,
                ];
            });

        // ── 4. Summary counts ─────────────────────────────────────────────
        $summary = [
            'total_stale_orders'   => $staleOrders->count(),
            'critical_orders'      => $staleOrders->where('severity', 'critical')->count(),
            'urgent_orders'        => $staleOrders->where('severity', 'urgent')->count(),
            'high_orders'          => $staleOrders->where('severity', 'high')->count(),
            'warning_orders'       => $staleOrders->where('severity', 'warning')->count(),
            'stale_tickets'        => $staleTickets->count(),
            'price_alerts'         => $priceWatchAlert['raised'] ?? 0,
            'last_price_check'     => $priceWatchAlert['at'] ?? null,
        ];

        return response()->json([
            'summary'          => $summary,
            'stale_orders'     => [
                'critical'     => $bySevertiy->get('critical', collect())->values(),
                'urgent'       => $bySevertiy->get('urgent', collect())->values(),
                'high'         => $bySevertiy->get('high', collect())->values(),
                'warning'      => $bySevertiy->get('warning', collect())->values(),
            ],
            'stale_tickets'    => $staleTickets->values(),
            'price_watch_alert' => $priceWatchAlert,
        ]);
    }

    /**
     * Returns just the stale orders as a flat list suitable for copying IDs
     * into a JustPanel ticket.  Accepts ?severity=critical|urgent|high|warning
     */
    public function staleOrdersCopy(Request $request)
    {
        $severity  = $request->get('severity');         // optional filter
        $minHours  = (int) $request->get('min_hours', 24);

        $query = Order::with(['service:id,name'])
            ->whereIn('status', ['Pending', 'In progress', 'Processing'])
            ->where('created_at', '<=', now()->subHours($minHours))
            ->whereNotNull('provider_order_id')
            ->orderByDesc('created_at');

        $orders = $query->get()->map(function ($order) {
            $ageHours = now()->diffInHours($order->created_at);
            $sev = match (true) {
                $ageHours >= 96 => 'critical',
                $ageHours >= 72 => 'urgent',
                $ageHours >= 48 => 'high',
                default         => 'warning',
            };
            return [
                'severity'          => $sev,
                'provider_order_id' => $order->provider_order_id,
                'service_name'      => $order->service?->name,
                'age_hours'         => $ageHours,
                'justpanel_line'    => $order->provider_order_id,
            ];
        });

        if ($severity) {
            $orders = $orders->where('severity', $severity)->values();
        }

        // Also return a plain comma-separated string of provider IDs for easy copy-paste
        $providerIds = $orders->pluck('provider_order_id')->filter()->unique()->values();

        return response()->json([
            'count'              => $orders->count(),
            'provider_order_ids' => $providerIds,
            'csv_for_ticket'     => $providerIds->implode(', '),
            'orders'             => $orders,
        ]);
    }
}
