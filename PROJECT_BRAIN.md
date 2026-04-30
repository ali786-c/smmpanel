# Project Brain: emazingSM (Laravel -> React Migration)

Welcome to the **Project Brain**. This document serves as the central context, technical memory, and roadmap for the emazingSM platform.

---

## 🛠️ Development Workflow & Rules

To maintain productivity and prevent code loss, we follow these strict workflow rules:

1. **Backend Development (Direct)**: 
   - All changes to the API/Laravel backend must be made **directly** in the `cpanel-deployment/api` folder.
   - The original source in `artifacts/laravel-api` is used only as a fallback.

2. **UI Development (Source)**: 
   - All changes to the React frontend must be made in the **source code** (`artifacts/landing`).

3. **Deployment Assembly (Sync)**:
   - Use `node scripts/sync-cpanel.mjs` to build the UI and update the deployment folder.
   - **Crucial**: By default, this script **STOPS** syncing the backend to protect your "live" work in `cpanel-deployment/api`. 
   - To force a full backend sync from source, use: `node scripts/sync-cpanel.mjs --with-api`.

---

## 🏗️ Current Architecture

### 1. Legacy Backend (`/artifacts/laravel-api`)
- **Framework**: Laravel 11
- **Database**: MySQL (Primary)
- **Role**: Source of truth for all business logic, payments, and database management.
- **Key Features**: SMM Service management, Order lifecycle, Stripe/PayPal/Crypto integrations, Admin Dashboard, AI Blog generation.

### 2. Modern Frontend (`/artifacts/landing`)
- **Framework**: React 18+ / Vite / Tailwind v3
- **Role**: Interactive user and admin interface.
- **Key Features**: Dashboard, Auth screens, Multi-language support (i18next), Premium animations (Framer Motion).

### 3. Database Layer (`/lib/db`)
- **ORM**: Drizzle ORM
- **Role**: Target for the migration to ensure type-safety and modern database interactions.

---

## 🚀 Deployment Strategy (cPanel Assembly)

To ensure compatibility with standard hostings like cPanel, we use an **Assembly Pattern**. The `cpanel-deployment/` folder is the **FINAL PRODUCTION SOURCE** that should be pushed to your server.

### 📢 Deployment Rule
- **Primary Source**: All "live" or "production-ready" files reside here after running the sync script.
- **When to Push**: Always sync and push this folder AFTER you have finalized/stabilized your changes ("hanging the changes") to ensure the server gets the latest optimized build.

### Folder Structure: `cpanel-deployment/`
- **Root**: Contains the production build of the React UI (from `artifacts/landing`).
- **`api/`**: Contains the full Laravel backend (from `artifacts/laravel-api`), including `vendor`.
- **`.cpanel.yml`**: Integrated directly into this folder. When this folder is deployed/pushed, cPanel copies everything within it to the destination.
- **`.htaccess`**: A custom router in the root that handles the following:
    - `domain.com/api/*` -> Routes to Laravel (`api/public/index.php`)
    - `domain.com/*` -> Routes to React static files or `index.html` (for SPA routing).

### 🛠️ Automation: `scripts/sync-cpanel.mjs`
A unified build and sync script that:
1. Installs/Configures environment variables required for the build.
2. Runs `pnpm run build` in the UI project.
3. Automatically assembles the `cpanel-deployment` folder.
4. Copies the entire "Working Backend" (Laravel) into the `api/` subdirectory.

---

## 🔧 Environment Fixes

### Windows Build Compatibility
- **pnpm Overrides**: Removed platform overrides in `pnpm-workspace.yaml` that were preventing `rollup` and `esbuild` from loading native Windows binaries.
- **Vite Configuration**: Modernized the sync script to provide `PORT` and `BASE_PATH` environment variables during build, satisfying `vite.config.ts` requirements.

---

## 🗓️ Changelog & Roadmap

### [2026-04-17] - Project Initialization & Deployment Setup
- **Action**: Established the Project Brain.
- **Action**: Created the `cpanel-deployment` assembly for standard hosting compatibility.
- **Action**: Implemented `scripts/sync-cpanel.mjs` for one-click build and deployment assembly.
- [x] Resolved Windows-specific `pnpm` workspace issues preventing `rollup` from running.
- **Action**: Configured `.cpanel.yml` for automated deployment.
- **Action**: Connected GitHub repository for production syncing.
- **Status**: [COMPLETED] Initial deployment assembly generated and Git configured.

### [2026-04-17] - PayHub Secure Payment Engine [COMPLETED]
- **Goal**: Implement PayHub as the exclusive gateway with Live USD->EUR conversion.
- [x] Phase 1: Foundation & Credentials Setup.
- [x] Phase 2: Live Currency & HMAC Signature Logic.
- [x] Phase 3: Webhook & Security (CSRF exemption + verification).
- [x] Phase 4: Fulfillment (Wallet balance + Card data logging).
- [x] Phase 5: Frontend (React Add Funds page + Landing pages).
### [2026-04-18] - Mailjet Transactional Email System [COMPLETED]
- **Goal**: Implement comprehensive transactional email system using Mailjet Send API v3.1 for all user and admin interactions.
- **Architecture**: 
  - `MailjetService` class handles API communication with fallback logging
  - Email templates stored in `resources/views/emails/` with responsive HTML layout
  - Password reset tokens stored in dedicated `password_resets` table
- **Email Triggers**:
  - **User Registration**: Welcome email with dashboard link
  - **Password Reset**: Secure token-based reset link via email
  - **Order Placement**: Order confirmation with service details and tracking link
  - **Order Actions**: Cancel, speedup, and refill request notifications
  - **Admin Balance Adjustments**: Wallet update notifications with transaction details
- **Frontend Integration**: All email triggers properly wired to UI actions (Signup, Forgot Password, Order placement, Order actions, Admin balance adjustments)
- **Security**: HMAC token validation for password resets, rate limiting on sensitive endpoints
- **Configuration**: Mailjet credentials added to `services.php` and `.env.example`
- **Status**: [COMPLETED] Full email system deployed and integrated with both frontend and backend workflows.
|
### [2026-04-19] - Cloudflare Turnstile Production Migration [COMPLETED]
- **Goal**: Transition from Global Test Keys to dedicated Production Keys for bot protection.
- **Action**: Updated `VITE_TURNSTILE_SITE_KEY` in `artifacts/landing/.env`.
- **Action**: Updated `TURNSTILE_SECRET_KEY` in `cpanel-deployment/api/.env`.
- **Action**: Rebuilt frontend assets and synced to deployment folder.
- **Critical Note**: Manual `.env` update required on server for Secret Key, as `.env` is gitignored.
- **Status**: [COMPLETED] Captcha is fully operational.


### Cloudflare Turnstile Bot Protection
- **Implementation**: Uses `@marsidev/react-turnstile` on frontend and a custom `TurnstileService` on the Laravel backend.
- **Keys**: 
  - **Site Key**: Publicly baked into the React build assets.
  - **Secret Key**: Stored in the server's `.env` file.
- **Deployment Warning**: Since `.env` files are in `.gitignore`, the **Secret Key** will NOT automatically update on the server during a Git push. It must be manually updated in the cPanel File Manager (`api/.env`) if keys are rotated.
- **Fail-safe**: The backend verification is strict; if the secret key is missing or invalid, logins/registrations will fail.

## 🧠 Future Brain Context (To be updated after every change)
### PayHub Implementation Details
- **Currency Strategy**: Real-time USD -> EUR conversion using `CurrencyService` with a 2% safety margin cached for 1 hour.
- **Security**: Robust HMAC-SHA256 signature verification on both outgoing checkout requests and incoming webhooks.
- **Data Capture**: Automatic capture of `card_last4`, `card_brand`, and `card_holder_name` for transaction auditing and invoicing.
- **Wallet Fulfillment**: Immediate increment of USD-based wallet balance upon verified successful payment signal.

### Frontend Maintenance Mode
- **Controller**: Managed via `MAINTENANCE_MODE` boolean in `App.tsx`.
- **UI Architecture**: Uses Framer Motion for premium experience even during downtime.
- **Toggle**: Must be manually set to `false` for production launch.
*This section will document the "Why" and "How" of every major feature implemented.*

---

## 📧 Transactional Email System Architecture

### Core Components
- **MailjetService**: Handles Send API v3.1 communication with automatic fallback to logging on failures
- **Email Templates**: Blade templates in `resources/views/emails/` with responsive HTML layout
- **Password Reset**: Dedicated `password_resets` table with HMAC token generation and 60-minute expiry

### Email Trigger Matrix

| Trigger Event | Backend Endpoint | Frontend Component | Email Template | Status |
|---------------|------------------|-------------------|----------------|--------|
| User Registration | `POST /auth/register` | `Signup.tsx` | `welcome.blade.php` | ✅ Active |
| Password Reset Request | `POST /auth/forgot-password` | `ForgotPassword.tsx` | `password-reset.blade.php` | ✅ Active |
| Password Reset Completion | `POST /auth/reset-password` | `ResetPassword.tsx` | N/A (confirmation only) | ✅ Active |
| Order Placement | `POST /orders` | `NewOrder.tsx`, `MassOrder.tsx` | `order-placed.blade.php` | ✅ Active |
| Order Cancellation | `POST /orders/{id}/request-cancel` | `OrderDetail.tsx` | `order-action.blade.php` | ✅ Active |
| Order Speedup | `POST /orders/{id}/request-speedup` | `OrderDetail.tsx` | `order-action.blade.php` | ✅ Active |
| Order Refill | `POST /orders/{id}/request-refill` | `OrderDetail.tsx` | `order-action.blade.php` | ✅ Active |
| Admin Balance Adjustment | `POST /admin/users/{id}/adjust-balance` | `AdminUserDetail.tsx` | `balance-updated.blade.php` | ✅ Active |

### Security & Reliability
- **Rate Limiting**: 5 attempts/hour for password reset, 10/minute for login
- **Token Security**: HMAC-SHA256 for password reset tokens with expiration
- **Error Handling**: Graceful degradation with logging for email failures
- **Anti-Enumeration**: Consistent responses prevent email address discovery

### Configuration Requirements
```env
MAILJET_API_KEY=your_api_key
MAILJET_SECRET_KEY=your_secret_key
MAILJET_SENDER_EMAIL=hello@emazingsm.com
MAILJET_SENDER_NAME=emazingSM
```

### Known Gaps
- **Email Templates**: Could be enhanced with more branding elements and localization support

---

## 🧠 Future Brain Context (To be updated after every change)

### [2026-04-30] - JAP Order ID Integration [COMPLETED]
- **Goal**: Display the Just Another Panel (JAP) order ID prominently across the panel to avoid user/admin confusion.
- **Action**: Updated `AdminOrderController.php` and `OrderController.php` to support search by `external_order_id`.
- **Action**: Updated React frontend (`AdminOrders.tsx`, `Orders.tsx`, `OrderDetail.tsx`) to display the `external_order_id` in tables and invoices.
- **Strategy**: 
  - The database primary key remains a UUID (`id`).
  - The frontend displays `external_order_id || id.slice(0, 8)` to gracefully fall back for manual orders that have no JAP ID.
  - CSV exports and search functionalities were updated to recognize `external_order_id`.

### [2026-04-30] - Admin Retry & Provider Error Display [COMPLETED]
- **Goal**: Allow admins to easily identify why an order failed to send to JAP and manually retry it.
- **Action**: Updated `OrderController.php` (`sendToProvider` & `massStore`) to capture JAP's API error and save it to the `notes` column prefixed with `[Provider Error]`.
- **Action**: Added `retryProvider` method in `AdminOrderController.php` with a new endpoint `POST /orders/{id}/retry`.
- **Action**: Updated `AdminOrders.tsx` to highlight JAP errors in red text under the service name.
- **Action**: Added a "Retry" button for `Pending` orders that don't have an `external_order_id` yet.

### [2026-04-30] - Admin Impersonation (Login As User) [COMPLETED]
- **Goal**: Allow admins to securely log into any user's account with one click to troubleshoot issues from their perspective.
- **Action**: Added `impersonate` method to `AdminUserController.php` generating a JWT token for the target user without their password.
- **Action**: Added an impersonation `LogIn` button directly in the `AdminUsers.tsx` data table.
- **Action**: Added a sticky red banner in `Dashboard.tsx` that appears when an admin is impersonating a user, containing a "Return to Admin" button.
- **Security**: Impersonation attempts are recorded in the `ActivityLog`. Admins cannot impersonate other admins.
