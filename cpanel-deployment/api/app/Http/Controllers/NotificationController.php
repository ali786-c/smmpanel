<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Notification::where('user_id', $user->id)->orderByDesc('created_at');

        if ($request->has('unread_only') && $request->unread_only) {
            $query->where('read', false);
        }

        $notifications = $query->paginate($request->get('per_page', 20));
        return response()->json($notifications);
    }

    public function unreadCount()
    {
        $user = auth()->user();
        $count = Notification::where('user_id', $user->id)->where('read', false)->count();
        return response()->json(['count' => $count]);
    }

    public function markRead($id)
    {
        $user = auth()->user();
        Notification::where('user_id', $user->id)->where('id', $id)->update(['read' => true]);
        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllRead()
    {
        $user = auth()->user();
        Notification::where('user_id', $user->id)->where('read', false)->update(['read' => true]);
        return response()->json(['message' => 'All notifications marked as read']);
    }
}
