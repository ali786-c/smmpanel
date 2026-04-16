# emazingSM — Laravel API Backend

## Overview

This project is the **emazingSM social media marketing SaaS platform** backend, fully implemented in Laravel PHP, replacing the original Supabase/Deno edge functions. The React frontend remains unchanged and connects to this Laravel API.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24 (for frontend/tooling)
- **PHP version**: 8.2 (Laravel 11)
- **API framework**: Laravel 11 (PHP)
- **Database**: PostgreSQL (helium:5432, heliumdb)
- **Auth**: JWT via tymon/jwt-auth
- **Laravel API dir**: `artifacts/laravel-api/`
- **Legacy Node API dir**: `artifacts/api-server/` (deprecated, replaced by Laravel)

## Laravel API

### Base URL
`http://localhost:8000/api`

### Authentication
JWT Bearer tokens. Obtain via `POST /api/auth/login` or `POST /api/auth/register`.

### Key Routes
- `GET  /api/healthz` — health check
- `POST /api/v2` — Public SMM reseller API (key, action)
- `POST /api/auth/register|login|logout|refresh`
- `GET  /api/services` — all services (public)
- `GET  /api/profile` — user profile (auth)
- `GET  /api/orders` — user orders (auth)
- `GET  /api/wallet` — wallet + transactions (auth)
- `GET  /api/tickets` — support tickets (auth)
- `GET  /api/admin/dashboard` — admin dashboard (admin)
- See `routes/api.php` for the full route list (~80 routes)

### Admin Routes (require JWT + admin role)
- `/api/admin/users` — user management (ban, balance, roles)
- `/api/admin/services` — service CRUD, sync from provider, resanitize names
- `/api/admin/orders` — order management, manual orders, bulk sync, refunds
- `/api/admin/finance` — revenue overview, transactions, refund log
- `/api/admin/tickets` — support ticket management + AI triage
- `/api/admin/blog` — blog CRUD + AI generation (OpenAI)
- `/api/admin/announcements` — announcements CRUD
- `/api/admin/coupons` — coupon management
- `/api/admin/settings` — system settings key/value store
- `/api/admin/notifications/mass-send` — bulk notifications
- `/api/admin/affiliates` — affiliate/referral program
- `/api/admin/growth/run|stats` — growth automation (re-engagement, promos, abandoned recovery)
- `/api/admin/activity-log` — admin activity audit log

### Automation Commands (Artisan)
All automation runs as scheduled Artisan commands:

| Command | Schedule | Description |
|---|---|---|
| `automation:sync-orders` | Every 5 min | Sync order statuses from provider API |
| `automation:refund-monitor` | Hourly | Auto-refund cancelled orders |
| `automation:ai-support` | Every 30 min | AI triage + auto-reply open tickets |
| `automation:growth all` | Daily 9am | Re-engagement, promos, abandoned recovery |
| `automation:growth auto-promo` | Friday 8am | Weekend promotional coupon |

Run the scheduler with: `php artisan schedule:work`

### Models
User, Profile, Wallet, WalletTransaction, Service, Order, UserRole, Ticket, TicketMessage, Notification, BlogPost, Announcement, Coupon, Referral, RefundLog, ActivityLog, SystemSetting, FavoriteService, NotificationPreference

### Environment Variables Required
```
PROVIDER_API_URL=   # SMM provider API endpoint
PROVIDER_API_KEY=   # SMM provider API key
OPENAI_API_KEY=     # For AI blog generation + AI support triage
SESSION_SECRET=     # Already set
JWT_SECRET=         # Already set
```

## Key Commands

- `cd artifacts/laravel-api && php artisan serve --host=0.0.0.0 --port=8000` — start Laravel API
- `php artisan migrate --force` — run migrations
- `php artisan schedule:work` — run the task scheduler
- `php artisan automation:sync-orders` — manual order sync
- `php artisan automation:refund-monitor --dry-run` — dry-run refunds
- `php artisan automation:ai-support --dry-run` — dry-run AI support
- `php artisan automation:growth all` — manual growth run
- `php artisan route:list --path=api` — list all API routes
