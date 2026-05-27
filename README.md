# Real Estate Brokerage CRM & Project Management System

A comprehensive **CRM + Project Management** platform tailored for the **Philippine real estate industry**. Empowers brokers, property developers, and freelance agents to capture leads, manage listings, track commissions, organize agent hierarchies, and schedule property viewings — all in one place.

Built with a **Firebase-only architecture** (no Cloud Functions) — security rules act as the backend, keeping operational costs minimal while maintaining robust access control.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + ShadCN/ui
- **Backend:** Firebase-only (no Cloud Functions)
- **Database:** Firestore (real-time sync)
- **Auth:** Firebase Auth (email/password + Google OAuth)
- **Storage:** Firebase Storage (property images, receipts, viewing photos)
- **Hosting:** Firebase Hosting
- **Notifications:** Firebase Cloud Messaging (push notifications)
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
- "Download as Image" support (coming in v2)
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
- Export to CSV (coming in v2)

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
- Notification triggers:
  - New lead assigned
  - Viewing reminder (24h / 1h)
  - Commission approved / paid
  - Deal status change
  - New task assigned
  - @mention in notes
  - Reschedule request from client portal
- Mark individual or all notifications as read

### Broker Command Center
- KPI cards: Total leads, Active listings, Upcoming viewings, Commission earned
- Lead pipeline funnel chart (by status)
- Lead source analytics (Facebook, Referral, Walk-in, Manual conversion)
- Upcoming viewings list
- Pending tasks widget
- Agent leaderboard (coming in v2)
- Team performance report (coming in v2)

## Getting Started

### Prerequisites

- Node.js 20+
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
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage |

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── auth/           # Auth guard (ProtectedRoute)
│   ├── layout/         # Sidebar + main layout (AppLayout)
│   ├── notifications/  # Notification bell dropdown
│   ├── ui/             # Generic UI components (planned)
│   └── ErrorBoundary   # React error boundary
├── context/            # React context providers (Auth, Theme)
├── hooks/              # Custom React hooks (useFirestore)
├── lib/                # Utilities, Firebase config, commission engine
├── pages/              # Route pages (14+ pages)
├── services/           # Business logic (notifications, FCM)
├── styles/             # Global styles
└── types/              # TypeScript definitions (14+ entities)
```

## Architecture

- **Firebase-only** — no Cloud Functions. Firestore security rules act as the backend.
- **Client-side commission calculation** — raw deal data is source of truth; calc is for display/reference.
- **Manual FB lead entry** (v1) — leads captured via form entry; Facebook auto-import planned for v2.
- **Push notifications** via Firebase Cloud Messaging with in-app notification system.
- **Real-time sync** — Firestore listeners keep all views up-to-date across sessions.

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
