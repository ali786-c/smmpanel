<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminNotificationController extends Controller
{
    public function sendMass(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|in:info,success,warning,error,promo',
            'link' => 'nullable|string',
            'filter' => 'nullable|in:all,active,inactive',
        ]);

        $users = User::query();

        if (($validated['filter'] ?? 'all') === 'active') {
            $users->whereHas('orders', fn($q) => $q->where('created_at', '>=', now()->subDays(30)));
        } elseif (($validated['filter'] ?? 'all') === 'inactive') {
            $users->whereDoesntHave('orders', fn($q) => $q->where('created_at', '>=', now()->subDays(30)));
        }

        $userIds = $users->pluck('id');
        $sent = 0;

        foreach ($userIds->chunk(100) as $chunk) {
            $notifications = $chunk->map(fn($userId) => [
                'id' => (string) Str::uuid(),
                'user_id' => $userId,
                'title' => $validated['title'],
                'message' => $validated['message'],
                'type' => $validated['type'] ?? 'info',
                'link' => $validated['link'] ?? null,
                'read' => false,
                'created_at' => now(),
            ])->toArray();

            Notification::insert($notifications);
            $sent += count($notifications);
        }

        return response()->json(['sent' => $sent, 'total_users' => $userIds->count()]);
    }
}
