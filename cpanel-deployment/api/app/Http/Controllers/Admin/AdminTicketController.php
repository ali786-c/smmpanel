<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminTicketController extends Controller
{
    public function index(Request $request)
    {
        $query = Ticket::with(['user:id,email', 'user.profile:user_id,display_name'])
            ->withCount('messages')
            ->orderByDesc('updated_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('subject', 'LIKE', '%' . $request->search . '%')
                    ->orWhereHas('user', fn($uq) => $uq->where('email', 'LIKE', '%' . $request->search . '%'));
            });
        }

        return response()->json($query->paginate($request->get('per_page', 25)));
    }

    public function show($id)
    {
        $ticket = Ticket::with(['user.profile', 'messages'])->findOrFail($id);
        // Wrap in {ticket:} so frontend can use (await r.json()).ticket
        return response()->json(['ticket' => $ticket]);
    }

    public function reply(Request $request, $id)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'sender' => 'nullable|in:admin,ai',
        ]);

        $ticket = Ticket::findOrFail($id);

        $message = TicketMessage::create([
            'id' => (string) Str::uuid(),
            'ticket_id' => $ticket->id,
            'sender' => $validated['sender'] ?? 'admin',
            'content' => $validated['message'],
            'created_at' => now(),
        ]);

        $ticket->update(['status' => 'in_progress', 'updated_at' => now()]);

        return response()->json($message, 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $ticket = Ticket::findOrFail($id);
        $ticket->update($validated);

        return response()->json($ticket);
    }

    public function destroy($id)
    {
        Ticket::findOrFail($id)->delete();
        return response()->json(['message' => 'Ticket deleted']);
    }
}
