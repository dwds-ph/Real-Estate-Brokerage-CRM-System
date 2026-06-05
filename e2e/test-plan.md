# E2E Test Plan — Real Estate Brokerage CRM

> **Phase 30 — E2E Test Seed Data + Playwright Spec Foundation**
> Last updated: 2025-06-05

---

## 1. Overview

This document defines the critical user flows to test via end-to-end (E2E) Playwright tests against the Firebase emulator suite. The tests validate real-world interactions through the UI with seeded PH-localized data.

**Test Stack:**
- **Framework:** Playwright
- **Runner:** `yarn e2e` or `npx playwright test`
- **Emulators:** Firestore (`:8080`), Auth (`:9099`)
- **Seed Data:** `scripts/seed-e2e-data.cjs`
- **Test Users:** Broker (`broker@test.ph`) and Agent (`agent@test.ph`)

---

## 2. Test Environment

| Service | Emulator URL | Default Port |
|---------|-------------|-------------|
| Firestore | `http://localhost:8080` | 8080 |
| Auth | `http://localhost:9099` | 9099 |
| App (Vite) | `http://localhost:5173` | 5173 |

**Setup Script:** `scripts/run-e2e.sh` — starts emulators + Vite, waits for readiness, runs tests, cleans up.

**CI Pipeline:** `yarn e2e:ci` — uses `concurrently` to orchestrate all services.

---

## 3. User Roles

| Role | Email | Description |
|------|-------|-------------|
| Broker | `broker@test.ph` | Full access — manage agents, listings, deals, commissions, users |
| Agent | `agent@test.ph` | Limited access — manage own leads, listings, viewings, tasks |

---

## 4. Critical User Flows

### 4.1 Authentication & Authorization

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.1.1 | Login with valid broker credentials | Navigate to `/login`, enter `broker@test.ph` / `TestBroker123!`, submit | Redirect to `/dashboard`, dashboard heading visible |
| 4.1.2 | Login with valid agent credentials | Same flow with agent credentials | Redirect to `/dashboard` with agent-appropriate view |
| 4.1.3 | Login with invalid credentials | Enter wrong email/password | Stay on `/login`, show error message |
| 4.1.4 | Access protected route unauthenticated | Navigate directly to `/dashboard` | Redirect to `/login` |
| 4.1.5 | Logout | Click logout button after login | Redirect to `/login`, dashboard inaccessible |
| 4.1.6 | Registration | Fill registration form with new email | Account created, redirect to `/dashboard` |
| 4.1.7 | Password reset | Click "Forgot Password" on login page | Reset email sent (emulator logs it) |

### 4.2 Navigation & Routing

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.2.1 | Sidebar navigation links | Click each nav link (Dashboard, Leads, Listings, Deals, Viewings, Commissions, Calendar, Projects) | Each navigates to correct URL, active link highlighted |
| 4.2.2 | Breadcrumb navigation | Navigate to nested page (e.g., `/leads/lead-001`) | Breadcrumbs visible and clickable |
| 4.2.3 | 404 page | Navigate to nonexistent route | Custom 404 page displayed |

### 4.3 Leads Management

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.3.1 | View leads list | Navigate to `/leads` | Table/card list shows seeded leads (12 total) |
| 4.3.2 | Filter leads by status | Use status filter dropdown | List filtered to matching leads |
| 4.3.3 | Filter leads by source | Use source filter | List filtered by lead source |
| 4.3.4 | Search leads by name | Type partial name in search box | Matching leads appear in real-time |
| 4.3.5 | View lead detail | Click on a lead | Full lead detail page with contact info, notes, activity |
| 4.3.6 | Create new lead | Click "Add Lead", fill form, submit | New lead appears in list, success toast |
| 4.3.7 | Edit existing lead | Click edit on lead, change details, save | Changes persisted and visible |
| 4.3.8 | Change lead status | Use status dropdown on detail page | Status updated, activity logged |
| 4.3.9 | Assign lead to agent | Change assigned agent on lead detail | Lead reassigned, agent notified |
| 4.3.10 | Delete/Cancel lead | Delete action on lead | Confirmation dialog, lead removed from list |
| 4.3.11 | Export leads | Click export button | CSV/Excel file downloaded |

### 4.4 Listings Management

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.4.1 | View listings list | Navigate to `/listings` | Shows seeded listings (8 total, multiple property types) |
| 4.4.2 | Filter by property type | Apply condo/house-lot/lot-only/commercial filter | List filtered to selected type |
| 4.4.3 | Filter by price range | Set min/max price range | Listings filtered within price range |
| 4.4.4 | Filter by status | Filter by available/sold/under-option/draft | Appropriate subset displayed |
| 4.4.5 | Search listings by title/address | Type in search box | Matching listings appear |
| 4.4.6 | View listing detail | Click on listing card/row | Full detail with description, amenities, media, location map |
| 4.4.7 | Create new listing | "Add Listing" flow with all property types | New listing created and visible |
| 4.4.8 | Edit listing | Change price, description, status | Changes saved, audit trail updated |
| 4.4.9 | Upload listing images | Upload photo/virtual tour link | Images appear in gallery |
| 4.4.10 | Change listing status | Move from available → under-option → sold | Status updated, associated deals updated |
| 4.4.11 | Print listing brochure | Click print/brochure button | PDF generated or print dialog opened |

### 4.5 Deals Pipeline

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.5.1 | View deals pipeline | Navigate to `/deals` | Kanban board showing stages (Lead → Negotiation → Documentation → Closing → Closed) |
| 4.5.2 | Drag deal to next stage | Drag card from "Negotiation" to "Documentation" | Deal status updated, activity logged |
| 4.5.3 | View deal detail | Click on a deal card | Full deal detail with client info, listing, commission, timeline |
| 4.5.4 | Create new deal | Initiate from lead detail or deals page | New deal created in "Lead" stage |
| 4.5.5 | Edit deal terms | Modify price, commissions, expected closing date | Terms updated, re-commission calculated |
| 4.5.6 | Close deal (won) | Move to "Closed Won" stage | Status updated, commission recorded, listing marked sold |
| 4.5.7 | Cancel deal | Move to "Lost" / "Cancelled" | Deal closed, lead status updated, listing reverted |
| 4.5.8 | Filter deals by agent | Use agent filter dropdown | Deals filtered to selected agent |
| 4.5.9 | View deal commission breakdown | Open deal detail → Commission section | Shows total, broker share, agent share |

### 4.6 Payments & Financials

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.6.1 | View payment schedule | Navigate to deal detail → Payments tab | Shows scheduled payments with amounts, due dates, status |
| 4.6.2 | Record payment | Click "Record Payment", fill amount/method | Payment recorded, status updated, overdue badge removed |
| 4.6.3 | View overdue payments | Navigate to payments page / dashboard | Overdue payments highlighted (red badge) |
| 4.6.4 | Generate payment receipt | Click receipt button on completed payment | Receipt PDF generated/downloaded |

### 4.7 Commissions

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.7.1 | View commission summary | Navigate to `/commissions` | Summary of earned/pending commissions with breakdown |
| 4.7.2 | Filter commissions by period | Select month/quarter/date range | Commissions filtered to period |
| 4.7.3 | View commission plan details | Navigate to commission plans | Shows seeded plans (Standard Residential, Commercial, Lot Only) |
| 4.7.4 | Create commission plan | Add new plan with rate, type, applicable properties | New plan saved and applicable |

### 4.8 Tours & Viewings

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.8.1 | View tours list | Navigate to `/viewings` | Shows seeded tours (completed, scheduled, upcoming) |
| 4.8.2 | Schedule new tour | Pick lead + listing + date/time | Tour created, notification sent |
| 4.8.3 | Reschedule tour | Edit existing tour date/time | Tour rescheduled, activity logged |
| 4.8.4 | Cancel tour | Cancel a scheduled tour | Tour status updated, lead notified |
| 4.8.5 | Record tour outcome | Add notes/feedback after completed tour | Notes saved, lead score may update |

### 4.9 Tasks

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.9.1 | View task list | Navigate to tasks section | Shows seeded tasks with priority and due dates |
| 4.9.2 | Create task | Add task with title, assignee, due date, priority | Task created, assigned user notified |
| 4.9.3 | Complete task | Mark task as completed | Status updated, removed from active list |
| 4.9.4 | Filter tasks by assignee | Use assignee filter | Tasks filtered to selected user |
| 4.9.5 | Filter by priority | Filter high/medium/low | Tasks filtered by priority level |

### 4.10 Dashboard & Analytics

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.10.1 | View dashboard metrics | Navigate to `/dashboard` | Shows KPIs: total leads, active listings, deals in pipeline, commissions YTD |
| 4.10.2 | View charts | Dashboard chart widgets render | Charts for lead sources, deal stages, revenue trend load without errors |
| 4.10.3 | Recent activity feed | Dashboard activity list | Shows recent activities (new leads, status changes, completed tours) |
| 4.10.4 | Upcoming events | Calendar widget on dashboard | Shows upcoming tours, tasks, deadlines |

### 4.11 Search

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.11.1 | Global search | Type in global search bar | Search results from leads, listings, deals, clients |
| 4.11.2 | Search result navigation | Click on a search result | Navigates to the corresponding detail page |

### 4.12 Calendar

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.12.1 | View calendar | Navigate to `/calendar` | Calendar with tours, tasks, deadlines marked |
| 4.12.2 | Create event from calendar | Click date/time slot | Event creation form prefilled with date |

### 4.13 Document Management

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.13.1 | View documents for a deal | Navigate to deal detail → Documents tab | Shows associated documents with type badges |
| 4.13.2 | Upload document | Upload file with type and description | File uploaded, document entry created |
| 4.13.3 | Download document | Click download link on document | File downloaded |

### 4.14 User Profile & Settings

| # | Flow | Steps | Expected Result |
|---|------|-------|----------------|
| 4.14.1 | View profile | Navigate to profile/settings page | User info displayed correctly |
| 4.14.2 | Update profile | Change name, phone, photo | Changes saved |

---

## 5. Data Dependencies

### 5.1 Seeded Data Summary (`scripts/seed-e2e-data.cjs`)

| Collection | Count | Notable Records |
|-----------|-------|----------------|
| `users` | 4 | 1 broker, 3 agents with PH names |
| `branches` | 1 | Makati Flagship Office |
| `leads` | 12 | PH names, various statuses and sources |
| `listings` | 8 | Condo, house-lot, lot-only, commercial, townhouse |
| `deals` | 3 | Under-review, closed, pending stages |
| `payments` | 5 | Completed, overdue, pending |
| `commissionPlans` | 3 | Residential, Commercial, Lot Only rates |
| `tours` | 4 | Completed and scheduled viewings |
| `tasks` | 5 | Mixed priorities and statuses |
| `documents` | 5 | Deeds, IDs, titles |

### 5.2 Auth Users

| User | Email | Password | Custom Claim |
|------|-------|----------|-------------|
| Test Broker | `broker@test.ph` | `TestBroker123!` | `{ role: "broker" }` |
| Test Agent | `agent@test.ph` | `TestAgent123!` | `{ role: "agent" }` |

### 5.3 Relationship Graph

```
Branch
  └── Broker (manager)
  └── Agent 1 (Maria Santos)
  └── Agent 2 (Juan Dela Cruz)
  └── Agent 3 (Ana Gonzales)

Agent 1
  ├── Leads: Jose Rizal, Maria Clara, Sofia Andres, Bongbong Marcos
  ├── Listings: BGC Condo, BF Homes, Penthouse Makati, Alabang Duplex
  └── Deals: Deal-001 (Jose Rizal)

Agent 2
  ├── Leads: Ramon Magsaysay, Catherine Mercado, Miguel Tan, Antonio Villanueva
  ├── Listings: Nuvali Lot, Makati Commercial, Batangas Beach Lot
  └── Deals: Deal-002 (Catherine Mercado - CLOSED)

Agent 3
  ├── Leads: Dindo Angeles, Grace Valenzuela, Karen Cruz, Leni Robredo
  ├── Listings: Cubao Townhouse
  └── Deals: Deal-003 (Dindo Angeles - PENDING)
```

---

## 6. Test Implementation Notes

### 6.1 Fixture Structure

Tests should leverage the shared fixtures defined in `tests/e2e/setup.ts`:

```typescript
import { test, expect } from "../../tests/e2e/setup";

test("broker can view leads", async ({ brokerPage }) => {
  await brokerPage.goto("/leads");
  await expect(brokerPage.getByText("Jose Rizal")).toBeVisible();
});

test("agent can view assigned leads", async ({ agentPage }) => {
  await agentPage.goto("/leads");
  await expect(agentPage.getByText("Maria Clara")).toBeVisible();
});
```

### 6.2 Data Seeding Strategy

1. **Global setup (once per CI run):**
   - `node scripts/seed-e2e-data.cjs` — seeds Firestore
   - `seedTestUsers()` in worker fixture — seeds Auth

2. **Before each test file:**
   - `seedTestUsers()` in `beforeAll` (ensures users exist)
   - Tests rely on deterministic seeded data IDs

3. **Isolation:**
   - Each Playwright worker gets its own state
   - Tests should not modify seeded data destructively
   - Use `test.describe.serial()` for flows that modify state

### 6.3 Flaky Test Mitigation

| Strategy | Implementation |
|----------|---------------|
| Retries | 2 retries in CI (`retries: 2`) |
| Timeouts | 30s default, 60s for data-heavy operations |
| Waiting | Use `waitForURL`, `waitForSelector` over fixed timeouts |
| Screenshots | On failure only |
| Video | Retain on failure |
| Trace | On first retry |

### 6.4 Test File Organization

```
e2e/
├── auth-flows.spec.ts          # 4.1 Authentication
├── navigation-smoke.spec.ts    # 4.2 Navigation
├── leads.spec.ts               # 4.3 Leads Management
├── listings.spec.ts            # 4.4 Listings Management
├── deal-pipeline.spec.ts       # 4.5 Deals Pipeline
├── payments.spec.ts            # 4.6 Payments
├── commissions.spec.ts         # 4.7 Commissions
├── tours.spec.ts               # 4.8 Tours & Viewings
├── tasks.spec.ts               # 4.9 Tasks
├── dashboard.spec.ts           # 4.10 Dashboard
├── search.spec.ts              # 4.11 Search
├── calendar.spec.ts            # 4.12 Calendar
├── documents.spec.ts           # 4.13 Document Management
├── profile.spec.ts             # 4.14 User Profile
├── helpers/
│   └── auth.ts                 # Auth emulator helpers
└── test-plan.md                # This document

tests/e2e/
└── setup.ts                    # Shared test fixtures
```

---

## 7. Known Limitations & Future Work

1. **Email verification** — Firebase Auth emulator does not send real emails; test password reset flows via emulator logs.
2. **File uploads** — Cloud Storage emulator not included in current setup; mock storage URLs used in seed data.
3. **Real-time updates** — Firestore emulator supports real-time listeners; test with `waitForFunction` if needed.
4. **Concurrent users** — Multi-user flows (broker + agent interactions) require separate browser contexts.
5. **Mobile/responsive** — Add mobile viewport tests in a future phase.
6. **Performance** — Add Lighthouse/performance assertions for critical pages.

---

## 8. Appendix: Quick Reference

### 8.1 Running Tests

```bash
# Full E2E suite (starts services, waits, runs, cleans up)
./scripts/run-e2e.sh

# Run specific test file
npx playwright test e2e/leads.spec.ts

# Run with UI mode
npx playwright test --ui

# Debug mode (stepped execution)
npx playwright test --debug

# CI mode (uses concurrently)
yarn e2e:ci
```

### 8.2 Seed Script

```bash
# Manually seed data (emulators must be running)
node scripts/seed-e2e-data.cjs
```

### 8.3 Emulator Management

```bash
# Start only Firestore
firebase emulators:start --only firestore --project demo-crm

# Start all emulators
yarn dev:emu

# Start emulators + Vite dev server
yarn dev:full
```
