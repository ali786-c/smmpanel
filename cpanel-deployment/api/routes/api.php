<?php

use App\Http\Controllers\LandingController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminActivityController;
use App\Http\Controllers\Admin\AdminAffiliateController;
use App\Http\Controllers\Admin\AdminBlogAutomationController;
use App\Http\Controllers\Admin\AdminAnnouncementController;
use App\Http\Controllers\Admin\AdminBlogController;
use App\Http\Controllers\Admin\AdminCouponController;
use App\Http\Controllers\Admin\AdminCriticalAlertsController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminFinanceController;
use App\Http\Controllers\Admin\AdminGrowthController;
use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminServiceController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\AdminTicketController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\OrderActionController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicApiController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\Payment\PayHubController;
use Illuminate\Support\Facades\Route;

// ─── Health Check ─────────────────────────────────
Route::get('/healthz', fn() => response()->json(['status' => 'ok']));

// ─── Public API (SMM Panel v2) ─────────────────────
Route::post('/v2', [PublicApiController::class, 'handle']);

// ─── Stripe Webhook (Public — Stripe calls this, no auth) ─────────────────
Route::post('/payment/stripe/webhook', [PaymentController::class, 'stripeWebhook']);

// ─── PayHub Webhook (Public — PayHub calls this, no auth) ─────────────────
Route::post('/webhooks/payhub', [PayHubController::class, 'handleWebhook']);
Route::post('/payment/payhub/webhook', [PayHubController::class, 'handleWebhook']); // Keep alias for safety


// ─── Landing Page (Public) ─────────────────────────
Route::prefix('landing')->group(function () {
    Route::get('/stats',   [LandingController::class, 'stats']);
    Route::get('/reviews', [LandingController::class, 'reviews']);
    Route::post('/reviews', [LandingController::class, 'submitReview'])->middleware('auth:api');
});

// ─── Auth Routes ───────────────────────────────────
Route::prefix('auth')->group(function () {
    // Rate-limited + threat-checked auth endpoints
    // Register: relaxed to 10 attempts per hour for testing stability
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware(['throttle:60,60', 'threat']);
    // Login: max 10 attempts per IP per minute, + brute-force lockout middleware
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware(['throttle:60,1', 'threat', 'login.throttle']);
    // Password reset: max 5 per hour
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:60,60');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:60,60');

    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});

// ─── Public Endpoints ──────────────────────────────
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/categories', [ServiceController::class, 'categories']);
// NOTE: /services/favorites must stay ABOVE /services/{id} to avoid wildcard hijack
Route::get('/services/favorites', [ServiceController::class, 'favorites'])->middleware('auth:api');
Route::get('/services/{id}', [ServiceController::class, 'show']);
Route::get('/blog', [BlogController::class, 'index']);
Route::get('/blog/categories', [BlogController::class, 'categories']);
Route::get('/blog/{slug}', [BlogController::class, 'show']);
Route::get('/announcements', [AnnouncementController::class, 'index']);

// ─── Authenticated User Routes ─────────────────────
Route::middleware('auth:api')->group(function () {
    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/regenerate-api-key', [ProfileController::class, 'regenerateApiKey']);
    Route::get('/profile/referrals', [ProfileController::class, 'referrals']);
    Route::get('/profile/notification-preferences', [ProfileController::class, 'notificationPreferences']);
    Route::patch('/profile/notification-preferences', [ProfileController::class, 'updateNotificationPreferences']);

    // Services (favorites — moved to public section above {id} to avoid wildcard conflict)
    Route::get('/services/{serviceId}/favorite', [ServiceController::class, 'toggleFavorite']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/mass', [OrderController::class, 'massStore']);
    Route::get('/orders/analytics', [OrderController::class, 'analytics']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // Order Actions (cancel / speedup / refill requests → auto-escalate to JustPanel)
    Route::post('/orders/{id}/request-cancel',  [OrderActionController::class, 'requestCancel']);
    Route::post('/orders/{id}/request-speedup', [OrderActionController::class, 'requestSpeedup']);
    Route::post('/orders/{id}/request-refill',  [OrderActionController::class, 'requestRefill']);

    // Coupon validation
    Route::post('/coupons/validate', function (\Illuminate\Http\Request $request) {
        $code   = strtoupper(trim($request->input('code', '')));
        $amount = (float) $request->input('amount', 0);
        if (!$code) return response()->json(['valid' => false, 'error' => 'No coupon code provided'], 422);
        $coupon = \App\Models\Coupon::where('code', $code)->first();
        if (!$coupon || !$coupon->isValid($amount)) {
            return response()->json(['valid' => false, 'error' => 'Invalid or expired coupon'], 422);
        }
        $discount = $coupon->calculateDiscount($amount);
        return response()->json(['valid' => true, 'code' => $coupon->code, 'discount' => $discount,
            'discount_type' => $coupon->discount_type, 'discount_value' => $coupon->discount_value]);
    });

    // Wallet
    Route::get('/wallet', [WalletController::class, 'index']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
    Route::post('/wallet/deposit', [WalletController::class, 'deposit']);

    // Payment — Stripe / PayPal / Crypto
    Route::prefix('payment')->group(function () {
        Route::get('/methods',              [PaymentController::class, 'methods']);
        Route::post('/stripe/checkout',     [PaymentController::class, 'stripeCheckout']);
        Route::get('/crypto/addresses',     [PaymentController::class, 'cryptoAddresses']);
        Route::post('/crypto/confirm',      [PaymentController::class, 'cryptoConfirm']);
        Route::post('/paypal/create-order', [PaymentController::class, 'paypalCreateOrder']);
        Route::post('/paypal/capture',      [PaymentController::class, 'paypalCapture']);
        Route::get('/payhub/rate',          [PayHubController::class, 'getRate']);
        Route::post('/payhub/checkout',     [PayHubController::class, 'checkout']);
    });

    // Tickets
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    Route::post('/tickets/{id}/reply', [TicketController::class, 'reply']);
    Route::patch('/tickets/{id}/close', [TicketController::class, 'close']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
});

// ─── Admin Routes ──────────────────────────────────
Route::middleware(['auth:api', 'admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'overview']);
    Route::get('/dashboard/charts', [AdminDashboardController::class, 'charts']);

    // Users
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{userId}', [AdminUserController::class, 'show']);
    Route::patch('/users/{userId}', [AdminUserController::class, 'update']);
    Route::post('/users/{userId}/adjust-balance', [AdminUserController::class, 'adjustBalance']);
    Route::post('/users/{userId}/assign-role', [AdminUserController::class, 'assignRole']);
    Route::delete('/users/{userId}/roles/{role}', [AdminUserController::class, 'removeRole']);
    Route::delete('/users/{userId}', [AdminUserController::class, 'deleteUser']);
    Route::post('/users/{userId}/notify', [AdminUserController::class, 'sendNotification']);

    // Services
    Route::get('/services', [AdminServiceController::class, 'index']);
    Route::post('/services', [AdminServiceController::class, 'store']);
    Route::patch('/services/{id}', [AdminServiceController::class, 'update']);
    Route::delete('/services/{id}', [AdminServiceController::class, 'destroy']);
    Route::post('/services/sync', [AdminServiceController::class, 'syncFromProvider']);
    Route::post('/services/resanitize', [AdminServiceController::class, 'resanitizeServices']);
    Route::post('/services/markup', [AdminServiceController::class, 'updateMarkup']);

    // Orders — specific static routes MUST come before {id} wildcard
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/revenue-export', [AdminOrderController::class, 'revenueExport']);
    Route::post('/orders/bulk-sync', [AdminOrderController::class, 'bulkSyncStatus']);
    Route::post('/orders/manual', [AdminOrderController::class, 'createManualOrder']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::patch('/orders/{id}', [AdminOrderController::class, 'update']);
    Route::post('/orders/{id}/refund', [AdminOrderController::class, 'refund']);
    Route::post('/orders/{id}/sync-status', [AdminOrderController::class, 'syncStatus']);

    // Finance
    Route::get('/finance', [AdminFinanceController::class, 'overview']);
    Route::get('/finance/transactions', [AdminFinanceController::class, 'transactions']);
    Route::get('/finance/refunds', [AdminFinanceController::class, 'refunds']);

    // Tickets
    Route::get('/tickets', [AdminTicketController::class, 'index']);
    Route::get('/tickets/{id}', [AdminTicketController::class, 'show']);
    Route::post('/tickets/{id}/reply', [AdminTicketController::class, 'reply']);
    Route::patch('/tickets/{id}/status', [AdminTicketController::class, 'updateStatus']);
    Route::delete('/tickets/{id}', [AdminTicketController::class, 'destroy']);

    // Blog & AI Automation
    Route::get('/blog', [AdminBlogController::class, 'index']);
    Route::post('/blog', [AdminBlogController::class, 'store']);
    Route::patch('/blog/{id}', [AdminBlogController::class, 'update']);
    Route::delete('/blog/{id}', [AdminBlogController::class, 'destroy']);
    Route::post('/blog/generate-ai', [AdminBlogController::class, 'generateAI']);

    Route::prefix('blog-automation')->group(function () {
        Route::get('/config', [AdminBlogAutomationController::class, 'getConfig']);
        Route::post('/config', [AdminBlogAutomationController::class, 'updateConfig']);
        Route::get('/keywords', [AdminBlogAutomationController::class, 'keywords']);
        // Use post for add/delete since it's cleaner in some admin panel contexts
        Route::post('/keywords', [AdminBlogAutomationController::class, 'addKeyword']);
        Route::delete('/keywords/{id}', [AdminBlogAutomationController::class, 'deleteKeyword']);
        Route::post('/trigger', [AdminBlogAutomationController::class, 'triggerNow']);
        Route::get('/progress', [AdminBlogAutomationController::class, 'getProgress']);
    });

    // Announcements
    Route::get('/announcements', [AdminAnnouncementController::class, 'index']);
    Route::post('/announcements', [AdminAnnouncementController::class, 'store']);
    Route::patch('/announcements/{id}', [AdminAnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AdminAnnouncementController::class, 'destroy']);

    // Coupons
    Route::get('/coupons', [AdminCouponController::class, 'index']);
    Route::post('/coupons', [AdminCouponController::class, 'store']);
    Route::patch('/coupons/{id}', [AdminCouponController::class, 'update']);
    Route::delete('/coupons/{id}', [AdminCouponController::class, 'destroy']);

    // Settings
    Route::get('/settings', [AdminSettingController::class, 'index']);
    Route::post('/settings', [AdminSettingController::class, 'update']);
    Route::get('/settings/{key}', [AdminSettingController::class, 'get']);

    // Notifications - Mass Send
    Route::post('/notifications/mass-send', [AdminNotificationController::class, 'sendMass']);

    // Activity Log
    Route::get('/activity-log', [AdminActivityController::class, 'index']);

    // Affiliates
    Route::get('/affiliates', [AdminAffiliateController::class, 'index']);
    Route::get('/affiliates/stats', [AdminAffiliateController::class, 'stats']);

    // Growth Automation
    Route::post('/growth/run', [AdminGrowthController::class, 'run']);
    Route::get('/growth/stats', [AdminGrowthController::class, 'stats']);

    // Critical Alerts (stale orders, thin-margin services, pending tickets)
    Route::get('/critical-alerts', [AdminCriticalAlertsController::class, 'index']);
    Route::get('/critical-alerts/stale-orders', [AdminCriticalAlertsController::class, 'staleOrdersCopy']);

    // Payment Gateway Settings
    Route::prefix('payment-settings')->group(function () {
        Route::get('/',                  [AdminPaymentController::class, 'index']);
        Route::get('/status',            [AdminPaymentController::class, 'status']);
        Route::patch('/{id}',            [AdminPaymentController::class, 'update']);
        Route::post('/toggle-provider',  [AdminPaymentController::class, 'toggleProvider']);
    });
});
