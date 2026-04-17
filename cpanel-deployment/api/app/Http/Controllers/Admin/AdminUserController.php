<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use App\Models\UserRole;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['profile', 'wallet'])
            ->withCount('orders')
            ->orderByDesc('created_at');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('email', 'like', '%' . $request->search . '%')
                    ->orWhereHas('profile', fn($pq) => $pq->where('display_name', 'like', '%' . $request->search . '%'));
            });
        }
        if ($request->has('is_banned')) {
            $query->whereHas('profile', fn($pq) => $pq->where('is_banned', (bool) $request->is_banned));
        }

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function show($userId)
    {
        $user = User::with(['profile', 'wallet', 'roles', 'orders' => fn($q) => $q->latest()->take(10)])->findOrFail($userId);
        $totalSpent = $user->orders()->sum('cost');

        return response()->json(array_merge($user->toArray(), [
            'roles' => $user->roles->pluck('role'),
            'total_spent' => $totalSpent,
        ]));
    }

    public function update(Request $request, $userId)
    {
        $validated = $request->validate([
            'display_name' => 'nullable|string|max:100',
            'is_banned' => 'nullable|boolean',
            'ban_reason' => 'nullable|string',
        ]);

        $profile = Profile::where('user_id', $userId)->firstOrFail();
        $profile->update(array_filter($validated, fn($v) => $v !== null));

        $admin = auth()->user();
        ActivityLog::create([
            'id' => (string) Str::uuid(),
            'actor_id' => $admin->id,
            'action' => 'update_user',
            'target_type' => 'user',
            'target_id' => $userId,
            'details' => $validated,
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json($profile);
    }

    public function adjustBalance(Request $request, $userId)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'reason' => 'required|string',
        ]);

        $wallet = Wallet::where('user_id', $userId)->firstOrFail();
        $newBalance = $wallet->balance + $validated['amount'];

        if ($newBalance < 0) {
            return response()->json(['error' => 'Balance cannot go below 0'], 422);
        }

        $wallet->update(['balance' => $newBalance]);

        WalletTransaction::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'type' => $validated['amount'] > 0 ? 'deposit' : 'withdrawal',
            'amount' => $validated['amount'],
            'description' => 'Admin adjustment: ' . $validated['reason'],
            'payment_method' => 'admin',
            'status' => 'completed',
            'created_at' => now(),
        ]);

        Notification::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'title' => 'Balance Updated',
            'message' => ($validated['amount'] > 0 ? '+' : '') . $validated['amount'] . ' added to your wallet by admin.',
            'type' => $validated['amount'] > 0 ? 'success' : 'warning',
            'link' => '/dashboard/wallet',
            'created_at' => now(),
        ]);

        $admin = auth()->user();
        ActivityLog::create([
            'id' => (string) Str::uuid(),
            'actor_id' => $admin->id,
            'action' => 'adjust_balance',
            'target_type' => 'user',
            'target_id' => $userId,
            'details' => ['amount' => $validated['amount'], 'reason' => $validated['reason']],
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);

        return response()->json(['balance' => $wallet->fresh()->balance]);
    }

    public function assignRole(Request $request, $userId)
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,moderator,user',
        ]);

        UserRole::updateOrCreate(
            ['user_id' => $userId, 'role' => $validated['role']],
            ['id' => (string) Str::uuid()]
        );

        return response()->json(['message' => 'Role assigned']);
    }

    public function removeRole(Request $request, $userId, $role)
    {
        UserRole::where('user_id', $userId)->where('role', $role)->delete();
        return response()->json(['message' => 'Role removed']);
    }

    public function deleteUser($userId)
    {
        $user = User::findOrFail($userId);
        $admin = auth()->user();

        ActivityLog::create([
            'id' => (string) Str::uuid(),
            'actor_id' => $admin->id,
            'action' => 'delete_user',
            'target_type' => 'user',
            'target_id' => $userId,
            'details' => ['email' => $user->email],
            'created_at' => now(),
        ]);

        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function sendNotification(Request $request, $userId)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'message' => 'required|string',
            'type' => 'nullable|in:info,success,warning,error,promo',
        ]);

        Notification::create([
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'] ?? 'info',
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Notification sent']);
    }
}
