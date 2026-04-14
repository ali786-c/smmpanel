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
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'priority' => 'nullable|in:low,normal,high',
        ]);

        $user = auth()->user();

        $ticket = Ticket::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'subject' => $validated['subject'],
            'priority' => $validated['priority'] ?? 'normal',
            'status' => 'open',
        ]);

        TicketMessage::create([
            'id' => (string) Str::uuid(),
            'ticket_id' => $ticket->id,
            'sender' => 'user',
            'content' => $validated['message'],
            'created_at' => now(),
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
            'message' => 'required|string',
        ]);

        $user = auth()->user();
        $ticket = Ticket::where('user_id', $user->id)
            ->whereIn('status', ['open', 'in_progress'])
            ->findOrFail($id);

        $message = TicketMessage::create([
            'id' => (string) Str::uuid(),
            'ticket_id' => $ticket->id,
            'sender' => 'user',
            'content' => $validated['message'],
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
