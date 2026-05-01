<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Services\JustPanelService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Automated provider escalation for stale orders.
 *
 * Runs on a schedule and does two things:
 *  1. Detects orders stuck in Pending/Processing for 2+ days → opens internal
 *     ticket AND pings JustPanel with a speedup/refill request.
 *  2. Detects orders at 4+ days still unresolved → escalates urgently,
 *     re-pings and flags for manual admin review.
 */
class ProviderEscalation extends Command
{
    protected $signature = 'automation:provider-escalation {--dry-run : Simulate without saving}';
    protected $description = 'Auto-escalate stale orders to JustPanel and open internal tickets';

    // Escalation thresholds
    private const HOURS_FIRST_PING  = 48;  // 2 days → first ping + ticket
    private const HOURS_URGENT_PING = 72;  // 3 days → second ping + urgent flag
    private const HOURS_CRITICAL    = 96;  // 4 days → critical, auto-refund candidate

    public function handle(JustPanelService $justPanel): int
    {
        $this->info('Running provider escalation check...');
        $dryRun = $this->option('dry-run');

        $stats = ['first_ping' => 0, 'urgent_ping' => 0, 'critical' => 0, 'cancel_forwarded' => 0];

        // ── 1. Stale orders (2–3 days) ────────────────────────────────────
        $staleOrders = Order::with(['user.profile', 'service'])
            ->whereIn('status', ['Pending', 'In progress', 'Processing'])
            ->where('created_at', '<=', now()->subHours(self::HOURS_FIRST_PING))
            ->where('escalation_stage', 0)
            ->get();

        foreach ($staleOrders as $order) {
            $svcName = $order->service->name ?? 'unknown service';
            $this->line("[FIRST PING] Order {$order->id} – {$svcName}");

            if (!$dryRun) {
                $this->firstPing($order, $justPanel);
            }
            $stats['first_ping']++;
        }

        // ── 2. Urgent orders (3–4 days) ───────────────────────────────────
        $urgentOrders = Order::with(['user.profile', 'service'])
            ->whereIn('status', ['Pending', 'In progress', 'Processing'])
            ->where('created_at', '<=', now()->subHours(self::HOURS_URGENT_PING))
            ->where('escalation_stage', 1)
            ->get();

        foreach ($urgentOrders as $order) {
            $this->line("[URGENT PING] Order {$order->id}");

            if (!$dryRun) {
                $this->urgentPing($order, $justPanel);
            }
            $stats['urgent_ping']++;
        }

        // ── 3. Critical orders (4+ days) ──────────────────────────────────
        $criticalOrders = Order::with(['user.profile', 'service'])
            ->whereIn('status', ['Pending', 'In progress', 'Processing'])
            ->where('created_at', '<=', now()->subHours(self::HOURS_CRITICAL))
            ->where('escalation_stage', 2)
            ->get();

        foreach ($criticalOrders as $order) {
            $this->line("[CRITICAL] Order {$order->id} – flagging for admin review");

            if (!$dryRun) {
                $this->criticalEscalation($order);
            }
            $stats['critical']++;
        }

        // ── 4. Pending cancellation requests ─────────────────────────────
        $cancelRequests = Order::with(['user.profile', 'service'])
            ->where('cancel_request_status', 'pending')
            ->whereNotNull('cancel_requested_at')
            ->where('cancel_requested_at', '<=', now()->subMinutes(15)) // slight delay
            ->whereNotNull('provider_order_id')
            ->get();

        foreach ($cancelRequests as $order) {
            $this->line("[CANCEL FORWARD] Order {$order->id}");

            if (!$dryRun) {
                $this->forwardCancellation($order, $justPanel);
            }
            $stats['cancel_forwarded']++;
        }

        $this->info('Done. ' . json_encode($stats));
        return Command::SUCCESS;
    }

    // ──────────────────────────────────────────────────────────────────────
    // FIRST PING (2 days stale)
    // ──────────────────────────────────────────────────────────────────────
    private function firstPing(Order $order, JustPanelService $justPanel): void
    {
        $daysOld = now()->diffInDays($order->created_at);
        $serviceName = $order->service->name ?? 'Unknown Service';
        $providerOrderId = $order->provider_order_id ?? $order->external_order_id;

        // Ping provider for speedup
        $speedupResult = ['success' => false, 'error' => 'No provider order ID'];
        if ($providerOrderId && $justPanel->isConfigured()) {
            $speedupResult = $justPanel->requestSpeedup($providerOrderId);
        }

        // Open an internal ticket (auto)
        $ticket = Ticket::create([
            'id'               => (string) Str::uuid(),
            'user_id'          => $order->user_id,
            'order_id'         => $order->id,
            'subject'          => "Order Delayed – {$serviceName} (Order #{$order->id})",
            'priority'         => 'high',
            'status'           => 'open',
            'ticket_type'      => 'speedup',
            'provider_escalated' => $speedupResult['success'],
            'escalated_at'     => now(),
            'auto_opened'      => true,
        ]);

        $message = $this->buildDelayMessage($order, $daysOld, $speedupResult, 'first');
        TicketMessage::create([
            'id'        => (string) Str::uuid(),
            'ticket_id' => $ticket->id,
            'sender'    => 'system',
            'content'   => $message,
            'created_at' => now(),
        ]);

        // Notify the client
        Notification::create([
            'id'         => (string) Str::uuid(),
            'user_id'    => $order->user_id,
            'title'      => 'Order Update – Processing Delay',
            'message'    => "Your order for {$serviceName} is taking longer than expected. We have escalated this to our provider and a support ticket has been opened automatically. We'll update you shortly.",
            'type'       => 'warning',
            'link'       => "/dashboard/tickets/{$ticket->id}",
            'read'       => false,
            'created_at' => now(),
        ]);

        // Mark order as pinged
        $order->update(['stale_pinged_at' => now(), 'escalation_stage' => 1]);
    }

    // ──────────────────────────────────────────────────────────────────────
    // URGENT PING (3 days stale)
    // ──────────────────────────────────────────────────────────────────────
    private function urgentPing(Order $order, JustPanelService $justPanel): void
    {
        $serviceName = $order->service->name ?? 'Unknown Service';
        $providerOrderId = $order->provider_order_id ?? $order->external_order_id;

        // Second speedup ping to provider
        $speedupResult = ['success' => false];
        if ($providerOrderId && $justPanel->isConfigured()) {
            $speedupResult = $justPanel->requestSpeedup($providerOrderId);
        }

        // Find existing auto-ticket or create a new one
        $ticket = Ticket::where('order_id', $order->id)
            ->where('auto_opened', true)
            ->where('ticket_type', 'speedup')
            ->first();

        $urgentNote = "**Urgent Update (Day 3):** We have sent a second escalation request to our provider for your delayed order. Your order for {$serviceName} has been waiting " . now()->diffInHours($order->created_at) . " hours. Our team is now monitoring this order closely for cancellation eligibility.";

        if ($ticket) {
            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $ticket->id,
                'sender'     => 'system',
                'content'    => $urgentNote,
                'created_at' => now(),
            ]);
            $ticket->update(['priority' => 'urgent', 'provider_escalated' => true]);
        } else {
            $ticket = Ticket::create([
                'id'               => (string) Str::uuid(),
                'user_id'          => $order->user_id,
                'order_id'         => $order->id,
                'subject'          => "URGENT – Order Still Pending ({$serviceName})",
                'priority'         => 'urgent',
                'status'           => 'open',
                'ticket_type'      => 'speedup',
                'provider_escalated' => true,
                'escalated_at'     => now(),
                'auto_opened'      => true,
            ]);
            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $ticket->id,
                'sender'     => 'system',
                'content'    => $urgentNote,
                'created_at' => now(),
            ]);
        }

        Notification::create([
            'id'         => (string) Str::uuid(),
            'user_id'    => $order->user_id,
            'title'      => 'Urgent: Order Still Pending',
            'message'    => "Your order for {$serviceName} is now 3+ days old. We have urgently escalated to our provider. We are monitoring it for possible cancellation and refund.",
            'type'       => 'error',
            'link'       => "/dashboard/tickets/{$ticket->id}",
            'read'       => false,
            'created_at' => now(),
        ]);

        $order->update(['stale_pinged_at' => now(), 'escalation_stage' => 2]);
    }

    // ──────────────────────────────────────────────────────────────────────
    // CRITICAL (4+ days)
    // ──────────────────────────────────────────────────────────────────────
    private function criticalEscalation(Order $order): void
    {
        $ticket = Ticket::where('order_id', $order->id)->where('auto_opened', true)->first();
 
        $criticalNote = "**CRITICAL – Day 4+:** This order has been stuck for " . now()->diffInDays($order->created_at) . " days. We are now attempting an automatic cancellation via our provider API. If successful, you will receive an immediate refund.";
 
        if ($ticket) {
            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $ticket->id,
                'sender'     => 'system',
                'content'    => $criticalNote,
                'created_at' => now(),
            ]);
            $ticket->update(['priority' => 'urgent', 'status' => 'open']);
        }
 
        // Attempt API cancellation
        $justPanel = app(JustPanelService::class);
        $providerOrderId = $order->provider_order_id ?? $order->external_order_id;
        
        if ($providerOrderId && $justPanel->isConfigured()) {
            $cancelResult = $justPanel->cancelOrder($providerOrderId);
            
            if ($cancelResult['success']) {
                // Refund will be picked up by RefundMonitor since status becomes Cancelled
                $order->update([
                    'status' => 'Cancelled',
                    'escalation_stage' => 3,
                    'stale_pinged_at' => now()
                ]);
                
                TicketMessage::create([
                    'id'         => (string) Str::uuid(),
                    'ticket_id'  => $ticket->id,
                    'sender'     => 'system',
                    'content'    => "**AUTO-CANCELLED:** Our provider has accepted the cancellation request. A refund will be credited to your wallet shortly.",
                    'created_at' => now(),
                ]);
                
                return;
            } else {
                TicketMessage::create([
                    'id'         => (string) Str::uuid(),
                    'ticket_id'  => $ticket->id,
                    'sender'     => 'system',
                    'content'    => "**CANCELLATION FAILED:** We attempted to cancel this order via API, but the provider responded: \"" . ($cancelResult['error'] ?? 'Order cannot be cancelled at this stage') . "\". This ticket has been flagged for manual admin intervention.",
                    'created_at' => now(),
                ]);
            }
        }
 
        Notification::create([
            'id'         => (string) Str::uuid(),
            'user_id'    => $order->user_id,
            'title'      => 'Critical Delay – Manual Review',
            'message'    => "Your order for {$serviceName} is critically delayed. Automatic cancellation was attempted and failed. Our admin team will now review this manually.",
            'type'       => 'error',
            'link'       => '/dashboard/tickets',
            'read'       => false,
            'created_at' => now(),
        ]);

        $order->update(['escalation_stage' => 3, 'stale_pinged_at' => now()]);
    }

    // ──────────────────────────────────────────────────────────────────────
    // FORWARD CLIENT CANCELLATION REQUEST TO PROVIDER
    // ──────────────────────────────────────────────────────────────────────
    private function forwardCancellation(Order $order, JustPanelService $justPanel): void
    {
        $providerOrderId = $order->provider_order_id ?? $order->external_order_id;
        $serviceName = $order->service->name ?? 'Unknown Service';

        if (!$providerOrderId) {
            $order->update(['cancel_request_status' => 'rejected']);
            return;
        }

        $result = $justPanel->cancelOrder($providerOrderId);

        if ($result['success']) {
            $order->update([
                'status'                => 'Cancelled',
                'cancel_request_status' => 'approved',
                'refund_status'         => 'none', // refund-monitor will handle wallet credit
            ]);

            // Open a confirmation ticket
            $ticket = Ticket::create([
                'id'          => (string) Str::uuid(),
                'user_id'     => $order->user_id,
                'order_id'    => $order->id,
                'subject'     => "Cancellation Confirmed – {$serviceName}",
                'priority'    => 'normal',
                'status'      => 'closed',
                'ticket_type' => 'cancellation',
                'auto_opened' => true,
            ]);

            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $ticket->id,
                'sender'     => 'system',
                'content'    => "Your cancellation request for order #{$order->id} ({$serviceName}) has been confirmed by our provider. A refund of \${$order->cost} will be credited to your wallet within minutes.",
                'created_at' => now(),
            ]);

            Notification::create([
                'id'         => (string) Str::uuid(),
                'user_id'    => $order->user_id,
                'title'      => 'Order Cancelled & Refund Issued',
                'message'    => "Your order for {$serviceName} has been cancelled. \${$order->cost} will be refunded to your wallet.",
                'type'       => 'success',
                'link'       => "/dashboard/tickets/{$ticket->id}",
                'read'       => false,
                'created_at' => now(),
            ]);
        } else {
            // Provider rejected the cancellation (e.g. order already complete)
            $order->update(['cancel_request_status' => 'rejected']);

            $ticket = Ticket::create([
                'id'          => (string) Str::uuid(),
                'user_id'     => $order->user_id,
                'order_id'    => $order->id,
                'subject'     => "Cancellation Request – Unable to Cancel",
                'priority'    => 'normal',
                'status'      => 'open',
                'ticket_type' => 'cancellation',
                'auto_opened' => true,
            ]);

            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $ticket->id,
                'sender'     => 'system',
                'content'    => "Unfortunately, your cancellation request for order #{$order->id} could not be processed automatically. Provider response: " . ($result['error'] ?? 'Order may already be in progress or completed') . ". A support agent will review this within a few hours.",
                'created_at' => now(),
            ]);

            Notification::create([
                'id'         => (string) Str::uuid(),
                'user_id'    => $order->user_id,
                'title'      => 'Cancellation Under Review',
                'message'    => "Your cancellation request for {$serviceName} could not be auto-processed. A support agent will review it shortly.",
                'type'       => 'warning',
                'link'       => "/dashboard/tickets/{$ticket->id}",
                'read'       => false,
                'created_at' => now(),
            ]);
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────────────
    private function buildDelayMessage(Order $order, int $daysOld, array $speedupResult, string $stage): string
    {
        $providerNote = $speedupResult['success']
            ? "A speedup request has been submitted to our provider (JustPanel) and they have acknowledged it."
            : "We attempted to request a speedup from our provider but received: " . ($speedupResult['error'] ?? 'no response') . ". Our admin team has been alerted.";

        return <<<MSG
        **Automated Escalation Notice (Stage: {$stage})**

        Your order #{$order->id} for **{$order->service->name}** has been in **{$order->status}** status for **{$daysOld} days**, which exceeds our expected delivery window.

        **Action taken by our system:**
        - {$providerNote}
        - This ticket has been automatically opened to track your issue.
        - Our support team has been notified.

        **What happens next:**
        - If the order does not progress within 24 hours, we will escalate again with higher priority.
        - If still unresolved after 4 days, we will attempt to automatically cancel and refund the order via our provider API.
 
        You do not need to take any action, but you may reply here if you have specific concerns or would prefer an immediate cancellation check.
        MSG;
    }
}
