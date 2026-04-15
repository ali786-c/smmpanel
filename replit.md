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

## Landing Page Artifact

**Location:** `artifacts/landing/` — React + Vite, port 18150, preview at `/landing/`

### Design
Dark, electric, premium SaaS landing page for emazingSM. 7 sections:
- Hero with animated gradient background
- Platform icons (Instagram, TikTok, YouTube, Twitter/X) via react-icons/si
- Animated stats ticker (live data from API)
- "Execution Protocol" How-It-Works section
- Featured testimonials grid (18 featured)
- Full testimonials browser with platform/niche filters
- Trust/security section + CTA

### Data (Laravel API public endpoints, no auth required)
- `GET /api/landing/stats` — 8 platform metrics (orders, users, countries, uptime, etc.)
- `GET /api/landing/testimonials` — paginated (520+ testimonials, 2018–2026, filter by platform/niche)
- `GET /api/landing/testimonials/featured` — 18 featured testimonials
- `GET /api/landing/platforms` — list of platforms
- `GET /api/landing/niches` — list of niches

### API connectivity
Vite dev server injects `__LARAVEL_API_URL__` constant at build time pointing to:
- Dev: `https://$REPLIT_DEV_DOMAIN:8000/api` (direct HTTPS to Laravel port 8000)
- Fallback: `http://localhost:8000/api`

### Artisan command
- `php artisan automation:generate-testimonials --count=50 --featured=0` — generate more testimonials

### Models added
`Testimonial`, `LandingStat`

### Migrations added
`2024_01_04_000001_create_testimonials_table.php` — creates `testimonials` and `landing_stats` tables

## Key Commands

- `cd artifacts/laravel-api && php artisan serve --host=0.0.0.0 --port=8000` — start Laravel API
- `php artisan migrate --force` — run migrations
- `php artisan schedule:work` — run the task scheduler
- `php artisan automation:sync-orders` — manual order sync
- `php artisan automation:refund-monitor --dry-run` — dry-run refunds
- `php artisan automation:ai-support --dry-run` — dry-run AI support
- `php artisan automation:growth all` — manual growth run
- `php artisan route:list --path=api` — list all API routes
