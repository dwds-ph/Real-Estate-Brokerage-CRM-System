# Real Estate Brokerage CRM & Project Management System

A comprehensive **CRM + Project Management** platform tailored for the **Philippine real estate industry**. Empowers brokers, property developers, and freelance agents to capture leads, manage listings, track commissions, organize agent hierarchies, and schedule property viewings — all in one place.

Built with a **Firebase-only architecture** (no Cloud Functions) — security rules act as the backend, keeping operational costs minimal while maintaining robust access control.

## Tech Stack

- **Frontend:** React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 3 + ShadCN/ui
- **Backend:** Firebase-only (no Cloud Functions)
- **Database:** Firestore (real-time sync)
- **Auth:** Firebase Auth (email/password + Google OAuth)
- **Storage:** Firebase Storage (property images, receipts, viewing photos)
- **Hosting:** Firebase Hosting
- **Notifications:** Firebase Cloud Messaging (push notifications)
- **Testing:** Vitest + React Testing Library + Playwright
- **Quality:** ESLint + Prettier + Husky + lint-staged
- **CI/CD:** GitHub Actions → Firebase Hosting deploy

## Features

### Lead Management
- Lead CRUD with full details (name, phone, email, source, status, score)
- Status workflow: New → Contacted → Viewed → Negotiating → Closed / Lost
- Lead scoring: Hot / Warm / Cold with visual indicators
- Duplicate detection (phone/email)
- Lead assignment & transfer between agents
- Communication log (call, text, meeting, email with timestamps)
- Auto-generated activity timeline
- Bulk import from CSV and export
- Filters by status, source, search by name/phone/email

### Deal Pipeline (Kanban)
- 6-column Kanban board with drag & drop
- Per-agent view (agents see only their deals)
- Broker overview (all agents' pipelines at a glance)
- Quick actions on cards (navigate to detail)
- Status transition tracking in activity timeline

### Property Listing Management
- Listing CRUD with multi-step form
- Image upload to Firebase Storage (with preview)
- Status tracking: Available → Under Option → Sold / Rented / Off-Market
- Property type tagging (condo, house & lot, lot only, commercial, foreclosed)
- Flood / hazard risk tagging (low, medium, high, unknown) — PH-specific
- Nearby amenities (school, hospital, mall, LRT/MRT)
- Required documents checklist per property type
- Search & filters (price, location, type, status, flood risk)

### Property Brochure Generator
- Auto-generated public shareable page per property
- Hosted at `/b/{listingId}` (no auth required)
- Share buttons: WhatsApp, Viber, Messenger, Copy Link
- Agent QR code on brochure
- View tracking per brochure

### Viewing Schedule Tracker
- Schedule viewings with date, time, property, and lead
- Status management: Scheduled → Done / Cancelled / No-Show
- Upcoming vs past viewings sections
- Post-viewing feedback form (interest level, concerns, next steps)
- Check-in support (photo upload as proof)
- Push notification reminders (24h + 1h before via FCM)

### Client Portal
- Public-facing page per client at `/p/{leadToken}`
- Client sees assigned properties and upcoming viewings
- Request reschedule button (creates notification for agent)
- Post-viewing feedback from client side
- Shareable link via Messenger / Viber / SMS

### Commission Tracking (PH-Specific)
- **Commission structures supported:**
  - Fixed % — standard broker share
  - Tiered split — broker/agent percentage splits
  - Referral fee — fixed amount per referral
  - Co-broking split — two agents share one deal commission
  - Escalating tiers (volume-based)
- Automated gross-to-net calculation including:
  - 12% VAT deduction
  - 1% Creditable Withholding Tax
- Payout tracking: Pending → Approved → Paid
- Commission summary dashboard (earned vs paid by month)
- Payout request/approval flow

### Co-broking / Shared Deals
- Dual-agent deal support (listing agent + buyer's agent)
- Configurable split percentage (50/50 default, custom supported)
- Shared pipeline — both agents see deal progress
- Payout split tracked separately per agent

### Expense Tracking
- Per-agent expense recording
- Categories: Transportation, Meals, Ads & Marketing, Miscellaneous
- Receipt photo upload to Firebase Storage
- Summary by category with totals
- Broker visibility into agent expenses

### BIR Tax Estimator
- **6% Capital Gains Tax** computation
- **1.5% Documentary Stamp Tax**
- **1% Creditable Withholding Tax**
- Total closing cost estimate for buyers
- Built into Title Status Tracker

### PH-Specific Tools
- **Pag-IBIG Loan Calculator** — monthly amortization, max loan tiers
- **Bank Financing Calculator** — BPI, BDO, Metrobank, Security Bank, EastWest rate comparison
- **Title Status Tracker** — 5-stage progress bar (With Seller → BIR CGT → Registry of Deeds → Transfer → Complete)
- Document checklist per title stage with status tracking
- Estimated closing costs breakdown

### Agent Hierarchy System
- Tree structure: Broker → Agents → Sub-agents
- Permission enforcement: broker sees all, agent sees own
- Agent profiles with license number, HLURB/DHSUD accreditation
- Team management under a broker
- Invitation flow — broker invites agent via link

### Task Management
- Task CRUD with title, description, priority (high/medium/low), due date
- Link tasks to leads, listings, or deals
- Filter by priority, due date, related entity
- Broker can assign tasks to agents
- Push notification on new task assignment

### Notes & Mentions
- Internal notes on leads, listings, and deals
- **@mentions** — `@agentName` triggers in-app notification
- Note types: general, reminder, document request

### Notifications
- **In-app notification bell** with unread badge and dropdown
- Full notification history page with filters
- **Push notifications via FCM** — background + foreground messages
- Notification triggers for all major entity changes
- Mark individual or all notifications as read

### Broker Command Center
- KPI cards: Total leads, Active listings, Upcoming viewings, Commission earned
- Lead pipeline funnel chart (by status)
- Lead source analytics (Facebook, Referral, Walk-in, Manual conversion)
- Upcoming viewings list
- Pending tasks widget

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- Firebase project with Auth, Firestore, Storage, and Hosting enabled

### Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/dwds-ph/Real-Estate-Brokerage-CRM-System.git
   cd Real-Estate-Brokerage-CRM-System
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** from the template:
   ```bash
   cp .env.example .env
   ```

4. **Configure Firebase:**
   - Enable Authentication (Email/Password + Google OAuth) in Firebase Console
   - Create a Firestore database in production mode
   - Enable Firebase Storage
   - Enable Firebase Hosting
   - Get your web app config from Project Settings > General > Your apps
   - Fill in the `.env` values

5. **Deploy Firestore rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Deploy Firestore indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

7. **Start the development server:**
   ```bash
   npm run dev
   ```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Vite on port 3000) |
| `npm run dev:emu` | Start Firebase emulators only |
| `npm run dev:full` | Emulators + Vite concurrently |
| `npm run build` | Type-check + Vite build + SW generation |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix lint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run e2e` | Run Playwright E2E tests |

---

## Project Structure

```
src/
├── components/              # Reusable components
│   ├── analytics/           # Analytics dashboards & charts
│   ├── auth/                # Auth guard (ProtectedRoute)
│   ├── automation/          # Checklists, referrals, activity feed
│   ├── calendar/            # Unified calendar, reminders
│   ├── cobrokerage/         # Co-broking management
│   ├── commissions/         # Commission breakdown, plan manager
│   ├── contracts/           # Contract generator
│   ├── deals/               # Deal kanban, cards
│   ├── documents/           # Document vault, upload, metadata
│   ├── import/              # CSV import wizard
│   ├── layout/              # Sidebar + main layout (AppLayout)
│   ├── leads/               # Lead forms, lists, filters
│   ├── licenses/            # License management
│   ├── loans/               # Loan calculators, affordability
│   ├── map/                 # Property map with Leaflet
│   ├── market/              # Market analysis, price trends
│   ├── matching/            # Lead-property matching
│   ├── mortgage/            # Mortgage tracker
│   ├── notifications/       # Notification bell
│   ├── payments/            # Payment forms, summaries
│   ├── payouts/             # Payout dashboard
│   ├── ph-tools/            # PH-specific tools (Pag-IBIG, BIR, title)
│   ├── projects/            # Project management
│   ├── scorecard/           # Agent leaderboard, badges
│   ├── tasks/               # Task cards, kanban, checklists
│   ├── tours/               # Tour builder, stop cards
│   └── ui/                  # Shared UI (EmptyState, LoadingSpinner, Toast)
├── context/                 # React context providers (Auth, Theme)
├── hooks/                   # Custom React hooks
│   ├── useAsync.ts          # Async operation handler
│   ├── useDebounce.ts       # Debounced values
│   ├── useFirestore.ts      # Firestore real-time hooks
│   ├── useKeyboardShortcuts.ts  # Keyboard shortcut system
│   ├── useLocalStorage.ts   # LocalStorage persistence
│   ├── useMediaQuery.ts     # Responsive media query tracking
│   └── useNetworkStatus.ts  # Online/offline detection
├── lib/                     # Core libraries & utilities
│   ├── errors.ts            # Structured error types (AppError)
│   ├── logger.ts            # Structured logging utility
│   ├── validation.ts        # Input validation helpers
│   ├── utils.ts             # General utility functions
│   ├── firebase.ts          # Firebase initialization
│   ├── commission.ts        # Commission calculation engine
│   ├── commissionEngine.ts  # Advanced commission engine
│   ├── cmaEngine.ts         # Comparative Market Analysis
│   ├── csvImport.ts         # CSV parsing & validation
│   ├── loanEngine.ts        # Loan amortization engine
│   ├── mapUtils.ts          # Map coordinate utilities
│   ├── marketReport.ts      # Market report generation
│   ├── matchingEngine.ts    # Lead-property matching algorithm
│   ├── scorecard.ts         # Agent scorecard calculations
│   ├── sourceAnalytics.ts   # Lead source analytics
│   ├── syndication.ts       # Property syndication helpers
│   └── contracts/           # Contract templates & generation
├── pages/                   # Route pages (40+ pages)
├── services/                # Business logic layer
└── types/                   # TypeScript type definitions
```

---

## Architecture

- **Firebase-only** — no Cloud Functions. Firestore security rules act as the backend.
- **Client-side commission calculation** — raw deal data is source of truth; calc is for display/reference.
- **Real-time sync** — Firestore listeners keep all views up-to-date across sessions.
- **Code-split routes** — lazy-loaded pages reduce initial bundle size.
- **Service Worker** — PWA support with offline caching via Workbox.
- **Manual FB lead entry** (v1) — leads captured via form entry; Facebook auto-import planned for v2.

### Error Handling

The app uses a structured error handling system:

- `AppError` — typed error class with code, severity, context, and recoverability metadata
- `ErrorBoundary` — React error boundary with retry support
- `logger` — structured logging with environment-aware log levels
- `createScopedLogger(module)` — module-scoped loggers for debugging

### Validation

Input validation is centralized in `lib/validation.ts`:

- `validateEmail`, `validatePhone`, `validateRequired`
- `validateMinLength`, `validatePositiveNumber`
- `combineResults` — aggregate multiple validation results

---

## Testing

### Test Structure

Tests use Vitest with React Testing Library:

```
src/
├── lib/
│   ├── utils.test.ts         # Utility function tests
│   ├── commission.test.ts    # Commission calculation tests
│   ├── errors.test.ts        # Error type tests
│   ├── logger.test.ts        # Logger tests
│   └── validation.test.ts    # Validation tests
├── hooks/
│   ├── hooks.test.ts         # Hook unit tests
│   └── useKeyboardShortcuts.test.ts  # Keyboard shortcut tests
├── services/
│   └── notifications.test.ts # Notification service tests
e2e/
└── *.spec.ts                 # Playwright E2E tests
```

### Running Tests

```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# E2E tests
npm run e2e

# E2E with debug UI
npm run e2e:ui
```

### Coverage Thresholds

| Metric    | Threshold |
|-----------|-----------|
| Statements| 80%       |
| Branches  | 70%       |
| Functions | 80%       |
| Lines     | 80%       |

---

## Quality Gates

The project enforces quality through:

1. **ESLint** — TypeScript-aware linting with strict rules
2. **Prettier** — Consistent code formatting
3. **TypeScript** — Strict mode type checking
4. **Husky** — Pre-commit hooks (lint-staged + typecheck)
5. **lint-staged** — Run linters only on staged files
6. **Vitest** — Unit/integration tests with coverage thresholds
7. **Playwright** — End-to-end browser tests
8. **GitHub Actions** — CI pipeline (lint → typecheck → test → build → e2e)

---

## PH-Specific Design

| Factor | Implementation |
|--------|---------------|
| **Commission splits** | Fixed %, tiered, co-broking, referral, escalating tiers |
| **VAT (12%) & Withholding Tax** | Auto-deducted in commission calculation |
| **CGT (6%) & DST (1.5%)** | Built into Title Status Tracker & BIR estimator |
| **Pag-IBIG / Bank Financing** | Built-in calculators with PH bank rates |
| **Title transfer** | 5-stage tracker with document checklist |
| **Flood risk tagging** | Low/Medium/High/Unknown on listings |
| **Brochure generator** | Shareable property cards for FB Marketplace |
| **Co-broking culture** | First-class dual-agent deal support |

## License

MIT
