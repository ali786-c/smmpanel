<?php

use App\Http\Controllers\Admin\AdminActivityController;
use App\Http\Controllers\Admin\AdminAffiliateController;
use App\Http\Controllers\Admin\AdminAnnouncementController;
use App\Http\Controllers\Admin\AdminBlogController;
use App\Http\Controllers\Admin\AdminCouponController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminFinanceController;
use App\Http\Controllers\Admin\AdminGrowthController;
use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminServiceController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\AdminTicketController;
use App\Http\Controllers\Admin\AdminUserController;
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
use Illuminate\Support\Facades\Route;

// ─── Health Check ─────────────────────────────────
Route::get('/healthz', fn() => response()->json(['status' => 'ok']));

// ─── Public API (SMM Panel v2) ─────────────────────
Route::post('/v2', [PublicApiController::class, 'handle']);

// ─── Auth Routes ───────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});

// ─── Public Endpoints ──────────────────────────────
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/categories', [ServiceController::class, 'categories']);
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

    // Services (auth needed for favorites)
    Route::get('/services/{serviceId}/favorite', [ServiceController::class, 'toggleFavorite']);
    Route::get('/services/favorites', [ServiceController::class, 'favorites']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/analytics', [OrderController::class, 'analytics']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // Wallet
    Route::get('/wallet', [WalletController::class, 'index']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
    Route::post('/wallet/deposit', [WalletController::class, 'deposit']);

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

    // Orders
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::patch('/orders/{id}', [AdminOrderController::class, 'update']);
    Route::post('/orders/{id}/refund', [AdminOrderController::class, 'refund']);
    Route::post('/orders/{id}/sync-status', [AdminOrderController::class, 'syncStatus']);
    Route::post('/orders/bulk-sync', [AdminOrderController::class, 'bulkSyncStatus']);
    Route::post('/orders/manual', [AdminOrderController::class, 'createManualOrder']);
    Route::get('/orders/revenue-export', [AdminOrderController::class, 'revenueExport']);

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

    // Blog
    Route::get('/blog', [AdminBlogController::class, 'index']);
    Route::post('/blog', [AdminBlogController::class, 'store']);
    Route::patch('/blog/{id}', [AdminBlogController::class, 'update']);
    Route::delete('/blog/{id}', [AdminBlogController::class, 'destroy']);
    Route::post('/blog/generate-ai', [AdminBlogController::class, 'generateAI']);

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
});
