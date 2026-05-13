<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $wallet = Wallet::where('user_id', $user->id)->firstOrCreate(
            ['user_id' => $user->id],
            ['id' => (string) Str::uuid(), 'balance' => 0]
        );

        $recentTransactions = WalletTransaction::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->take(10)
            ->get();

        return response()->json([
            'balance' => $wallet->balance,
            'recent_transactions' => $recentTransactions,
        ]);
    }

    public function transactions(Request $request)
    {
        $user = auth()->user();
        $query = WalletTransaction::where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->paginate($request->get('per_page', 20));
        return response()->json($transactions);
    }

    public function deposit(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:10',
            'payment_method' => 'required|string|in:stripe,paypal,crypto',
            'payment_reference' => 'nullable|string',
        ]);

        $user = auth()->user();

        DB::beginTransaction();
        try {
            $wallet = Wallet::where('user_id', $user->id)->lockForUpdate()->first();
            if (!$wallet) {
                $wallet = Wallet::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'balance' => 0,
                ]);
            }

            $wallet->increment('balance', $validated['amount']);
            $wallet->touch();

            WalletTransaction::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'type' => 'deposit',
                'amount' => $validated['amount'],
                'description' => 'Wallet deposit via ' . $validated['payment_method'],
                'reference_id' => $validated['payment_reference'] ?? null,
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'created_at' => now(),
            ]);

            DB::commit();
            return response()->json([
                'balance' => $wallet->fresh()->balance,
                'message' => 'Deposit successful',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
