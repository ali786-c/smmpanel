<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Services\JustPanelService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Handles client-initiated order actions:
 *  - Cancel request  → forwarded to JustPanel automatically
 *  - Speedup request → ping JustPanel + open ticket
 *  - Refill request  → ping JustPanel for dropped count recovery
 *
 * Every action opens or updates a support ticket so both the client and admin
 * have a clear audit trail.
 */
class OrderActionController extends Controller
{
    public function __construct(private JustPanelService $justPanel) {}

    // ──────────────────────────────────────────────────────────────────────
    // POST /api/orders/{id}/request-cancel
    // ──────────────────────────────────────────────────────────────────────
    public function requestCancel(Request $request, string $id)
    {
        $user  = auth()->user();
        $order = Order::where('user_id', $user->id)->findOrFail($id);

        if (!in_array($order->status, ['Pending', 'In progress', 'Processing'])) {
            return response()->json(['error' => 'Order cannot be cancelled at this stage (status: ' . $order->status . ')'], 422);
        }

        if ($order->cancel_request_status === 'pending') {
            return response()->json(['error' => 'Cancellation already requested'], 409);
        }

        $reason = $request->input('reason', 'Client requested cancellation');

        // Mark order as cancel-requested; the escalation command will forward it
        $order->update([
            'cancel_requested_at'   => now(),
            'cancel_request_status' => 'pending',
        ]);

        // Try immediate forwarding to JustPanel
        $providerOrderId = $order->provider_order_id ?? $order->external_order_id;
        $immediateResult = ['success' => false, 'deferred' => true];

        if ($providerOrderId && $this->justPanel->isConfigured()) {
            $immediateResult = $this->justPanel->cancelOrder($providerOrderId);

            if ($immediateResult['success']) {
                $order->update([
                    'status'                => 'Cancelled',
                    'cancel_request_status' => 'approved',
                    'refund_status'         => 'none',
                ]);
            }
        }

        // Open a ticket regardless so there is a clear paper trail
        $ticket = Ticket::create([
            'id'               => (string) Str::uuid(),
            'user_id'          => $user->id,
            'order_id'         => $order->id,
            'subject'          => 'Cancel Request – ' . ($order->service->name ?? "Order #{$order->id}"),
            'priority'         => 'high',
            'status'           => $immediateResult['success'] ? 'closed' : 'open',
            'ticket_type'      => 'cancellation',
            'provider_escalated' => $immediateResult['success'],
            'escalated_at'     => now(),
            'auto_opened'      => false,
        ]);

        $ticketMsg = $immediateResult['success']
            ? "Your cancellation request has been accepted and forwarded to our provider. Your order has been marked as Cancelled and a refund of \${$order->cost} will be processed to your wallet within minutes.\n\nReason: {$reason}"
            : "Your cancellation request has been received and is being processed. We are forwarding this to our provider (JustPanel) now. You will receive a notification once confirmed.\n\nReason: {$reason}";

        TicketMessage::create([
            'id'         => (string) Str::uuid(),
            'ticket_id'  => $ticket->id,
            'sender'     => 'system',
            'content'    => $ticketMsg,
            'created_at' => now(),
        ]);

        Notification::create([
            'id'         => (string) Str::uuid(),
            'user_id'    => $user->id,
            'title'      => $immediateResult['success'] ? 'Order Cancelled' : 'Cancellation Request Submitted',
            'message'    => $immediateResult['success']
                ? "Order cancelled. \${$order->cost} will be refunded to your wallet."
                : "Your cancellation request is being processed. We'll notify you once it's confirmed.",
            'type'       => $immediateResult['success'] ? 'success' : 'info',
            'link'       => "/dashboard/tickets/{$ticket->id}",
            'read'       => false,
            'created_at' => now(),
        ]);

        return response()->json([
            'message'    => $immediateResult['success'] ? 'Order cancelled successfully' : 'Cancellation request submitted and being processed',
            'immediate'  => $immediateResult['success'],
            'ticket_id'  => $ticket->id,
            'order'      => $order->fresh(),
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────
    // POST /api/orders/{id}/request-speedup
    // ──────────────────────────────────────────────────────────────────────
    public function requestSpeedup(Request $request, string $id)
    {
        $user  = auth()->user();
        $order = Order::where('user_id', $user->id)->with('service')->findOrFail($id);

        if (!in_array($order->status, ['Pending', 'In progress', 'Processing'])) {
            return response()->json(['error' => 'Order is not in a pending/processing state'], 422);
        }

        // Rate-limit: one speedup per 24h per order
        if ($order->speedup_requested_at && now()->diffInHours($order->speedup_requested_at) < 24) {
            $nextAllowed = $order->speedup_requested_at->addHours(24)->diffForHumans();
            return response()->json(['error' => "Speedup already requested. Next request allowed: {$nextAllowed}"], 429);
        }

        $providerOrderId = $order->provider_order_id ?? $order->external_order_id;
        $serviceName     = $order->service->name ?? "Order #{$order->id}";
        $speedupResult   = ['success' => false, 'error' => 'No provider order ID'];

        if ($providerOrderId && $this->justPanel->isConfigured()) {
            $speedupResult = $this->justPanel->requestSpeedup($providerOrderId);
        }

        $order->update(['speedup_requested_at' => now()]);

        // Open or update ticket
        $existingTicket = Ticket::where('order_id', $order->id)
            ->where('ticket_type', 'speedup')
            ->latest()
            ->first();

        $msgContent = $speedupResult['success']
            ? "Your speedup request for **{$serviceName}** has been submitted to our provider (JustPanel). Orders typically start processing faster within 1-6 hours after a speedup request. We'll update this ticket when we see progress."
            : "We attempted to request a speedup from our provider but encountered an issue: " . ($speedupResult['error'] ?? 'unknown') . ". Our team has been notified and will manually escalate this order.";

        if ($existingTicket && $existingTicket->status !== 'closed') {
            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $existingTicket->id,
                'sender'     => 'user',
                'content'    => "**Client speedup request:** " . ($request->input('message', 'Please speed up this order.')),
                'created_at' => now(),
            ]);
            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $existingTicket->id,
                'sender'     => 'system',
                'content'    => $msgContent,
                'created_at' => now(),
            ]);
            $ticketId = $existingTicket->id;
        } else {
            $ticket = Ticket::create([
                'id'               => (string) Str::uuid(),
                'user_id'          => $user->id,
                'order_id'         => $order->id,
                'subject'          => "Speedup Request – {$serviceName}",
                'priority'         => 'normal',
                'status'           => 'open',
                'ticket_type'      => 'speedup',
                'provider_escalated' => $speedupResult['success'],
                'escalated_at'     => $speedupResult['success'] ? now() : null,
                'auto_opened'      => false,
            ]);

            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $ticket->id,
                'sender'     => 'user',
                'content'    => $request->input('message', 'Please speed up this order.'),
                'created_at' => now(),
            ]);
            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $ticket->id,
                'sender'     => 'system',
                'content'    => $msgContent,
                'created_at' => now(),
            ]);

            $ticketId = $ticket->id;
        }

        Notification::create([
            'id'         => (string) Str::uuid(),
            'user_id'    => $user->id,
            'title'      => 'Speedup Request Submitted',
            'message'    => $speedupResult['success']
                ? "Speedup request for {$serviceName} confirmed by provider."
                : "Speedup request received. Our team will escalate manually.",
            'type'       => $speedupResult['success'] ? 'success' : 'info',
            'link'       => "/dashboard/tickets/{$ticketId}",
            'read'       => false,
            'created_at' => now(),
        ]);

        return response()->json([
            'message'        => $speedupResult['success'] ? 'Speedup request sent to provider' : 'Speedup request received – manual escalation triggered',
            'provider_pinged' => $speedupResult['success'],
            'ticket_id'      => $ticketId,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────
    // POST /api/orders/{id}/request-refill
    // For orders that completed but count dropped (e.g. followers lost)
    // ──────────────────────────────────────────────────────────────────────
    public function requestRefill(Request $request, string $id)
    {
        $user  = auth()->user();
        $order = Order::where('user_id', $user->id)->with('service')->findOrFail($id);

        if ($order->status !== 'Completed') {
            return response()->json(['error' => 'Refill requests are only for completed orders that experienced a drop'], 422);
        }

        $providerOrderId = $order->provider_order_id ?? $order->external_order_id;
        $serviceName     = $order->service->name ?? "Order #{$order->id}";

        $refillResult = ['success' => false, 'error' => 'No provider order ID'];
        if ($providerOrderId && $this->justPanel->isConfigured()) {
            $refillResult = $this->justPanel->requestSpeedup($providerOrderId); // refill uses same endpoint
        }

        $ticket = Ticket::create([
            'id'               => (string) Str::uuid(),
            'user_id'          => $user->id,
            'order_id'         => $order->id,
            'subject'          => "Refill Request – {$serviceName} (Count Dropped)",
            'priority'         => 'normal',
            'status'           => 'open',
            'ticket_type'      => 'refill',
            'provider_escalated' => $refillResult['success'],
            'escalated_at'     => $refillResult['success'] ? now() : null,
            'auto_opened'      => false,
        ]);

        $msgContent = "**Client Report:** I noticed a drop in count after order completion for {$serviceName}.\n\n" . ($request->input('message', ''));
        TicketMessage::create([
            'id'         => (string) Str::uuid(),
            'ticket_id'  => $ticket->id,
            'sender'     => 'user',
            'content'    => $msgContent,
            'created_at' => now(),
        ]);

        $systemMsg = $refillResult['success']
            ? "A refill request has been submitted to our provider for this order. Refills typically take 24-72 hours to process."
            : "Refill request received. Our team will review and escalate to our provider manually. Provider response: " . ($refillResult['error'] ?? 'N/A');

        TicketMessage::create([
            'id'         => (string) Str::uuid(),
            'ticket_id'  => $ticket->id,
            'sender'     => 'system',
            'content'    => $systemMsg,
            'created_at' => now(),
        ]);

        return response()->json([
            'message'        => $refillResult['success'] ? 'Refill request sent to provider' : 'Refill request logged for manual review',
            'provider_pinged' => $refillResult['success'],
            'ticket_id'      => $ticket->id,
        ]);
    }
}
