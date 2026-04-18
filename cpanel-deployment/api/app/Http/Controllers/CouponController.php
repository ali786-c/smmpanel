<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * Validate a coupon code and return its discount value.
     */
    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'amount' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($request->code))->first();

        if (!$coupon) {
            return response()->json(['error' => 'Coupon code not found.'], 404);
        }

        if (!$coupon->is_active) {
            return response()->json(['error' => 'This coupon is no longer active.'], 422);
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            return response()->json(['error' => 'This coupon has expired.'], 422);
        }

        if ($coupon->max_uses !== null && $coupon->used_count >= $coupon->max_uses) {
            return response()->json(['error' => 'This coupon has reached its maximum usage limit.'], 422);
        }

        if ($request->amount < $coupon->min_order_amount) {
            return response()->json(['error' => 'Minimum order amount of $' . number_format($coupon->min_order_amount, 2) . ' is required to use this coupon.'], 422);
        }

        $discount = $coupon->calculateDiscount($request->amount);

        return response()->json([
            'code' => $coupon->code,
            'discount' => $discount,
            'discount_type' => $coupon->discount_type,
            'discount_value' => $coupon->discount_value,
        ]);
    }
}
