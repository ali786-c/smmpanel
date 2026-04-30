<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $tickets = Ticket::where('user_id', $user->id)
            ->withCount('messages')
            ->with(['messages' => fn($q) => $q->latest('created_at')->take(1)])
            ->orderByDesc('updated_at')
            ->paginate($request->get('per_page', 20));

        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject'  => 'required|string|max:255',
            'message'  => 'nullable|string',
            'content'  => 'nullable|string',
            'priority' => 'nullable|in:low,normal,medium,high',
            'category' => 'nullable|string|max:100',
            'order_id' => 'nullable|exists:orders,id',
        ]);

        $body = $validated['message'] ?? $validated['content'] ?? '';
        if (empty($body)) {
            return response()->json(['error' => ['message' => ['The message field is required.']]], 422);
        }

        $user = auth()->user();

        $ticket = Ticket::create([
            'id'          => (string) Str::uuid(),
            'user_id'     => $user->id,
            'order_id'    => $validated['order_id'] ?? null,
            'subject'     => $validated['subject'],
            'priority'    => $validated['priority'] ?? 'normal',
            'ticket_type' => $validated['category'] ?? 'general',
            'status'      => 'open',
        ]);

        TicketMessage::create([
            'id'        => (string) Str::uuid(),
            'ticket_id' => $ticket->id,
            'sender'    => 'user',
            'content'   => $body,
            'created_at'=> now(),
        ]);

        return response()->json($ticket->load('messages'), 201);
    }

    public function show($id)
    {
        $user = auth()->user();
        $ticket = Ticket::where('user_id', $user->id)->findOrFail($id);
        $ticket->load('messages');
        return response()->json($ticket);
    }

    public function reply(Request $request, $id)
    {
        $validated = $request->validate([
            'message' => 'nullable|string',
            'content' => 'nullable|string',
        ]);

        $body = $validated['content'] ?? $validated['message'] ?? '';
        if (empty($body)) {
            return response()->json(['error' => ['message' => ['The message field is required.']]], 422);
        }

        $user = auth()->user();
        $ticket = Ticket::where('user_id', $user->id)
            ->whereNotIn('status', ['closed'])
            ->findOrFail($id);

        $message = TicketMessage::create([
            'id'         => (string) Str::uuid(),
            'ticket_id'  => $ticket->id,
            'sender'     => 'user',
            'content'    => $body,
            'created_at' => now(),
        ]);

        $ticket->touch();

        return response()->json($message, 201);
    }

    public function close($id)
    {
        $user = auth()->user();
        $ticket = Ticket::where('user_id', $user->id)->findOrFail($id);
        $ticket->update(['status' => 'closed']);
        return response()->json(['message' => 'Ticket closed']);
    }
}
