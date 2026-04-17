# Project Brain: UpgraderCX (Laravel -> React Migration)

Welcome to the **Project Brain**. This document serves as the central context, technical memory, and roadmap for the UpgraderCX platform.

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

To ensure compatibility with standard hostings like cPanel, we use an **Assembly Pattern**.

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

## 🧠 Future Brain Context (To be updated after every change)
### PayHub Implementation Details
- **Currency Strategy**: Real-time USD -> EUR conversion using `CurrencyService` with a 2% safety margin cached for 1 hour.
- **Security**: Robust HMAC-SHA256 signature verification on both outgoing checkout requests and incoming webhooks.
- **Data Capture**: Automatic capture of `card_last4`, `card_brand`, and `card_holder_name` for transaction auditing and invoicing.
- **Wallet Fulfillment**: Immediate increment of USD-based wallet balance upon verified successful payment signal.
*This section will document the "Why" and "How" of every major feature implemented.*
