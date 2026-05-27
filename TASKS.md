# Implementation Tasks — Client-Only Improvements

All features below are **purely client-side** (React + Firestore + Firebase Storage + browser APIs). No Cloud Functions, no server-side logic, no external API proxies.

**All 4 phases complete ✅**

---

## ✅ Phase 1: 📱 PWA + Offline Support — COMPLETE

**Goal:** Full Progressive Web App with offline access to cached data, home screen install, and improved mobile experience.

### Tasks

- [x] **1.1** Register service worker with workbox precaching for app shell (`vite-plugin-pwa`)
- [x] **1.2** Add `manifest.json` with icons, theme colors, display mode (standalone)
- [x] **1.3** Implement offline cache for Firestore/Storage via runtime caching rules
- [x] **1.4** Show offline indicator banner when network drops (`OfflineIndicator.tsx`)
- [x] **1.5** Queue writes when offline, sync on reconnect (`enableMultiTabIndexedDbPersistence`)
- [x] **1.6** Add "Install App" prompt on supported browsers (PWA install prompt)
- [x] **1.7** Test: typecheck ✓ lint ✓ build ✓ (service worker generated: `dist/sw.js`)

**Files created/modified:**

- `index.html` — manifest link, theme-color, apple-touch-icon meta
- `public/manifest.json` — full PWA manifest
- `public/icons/icon.svg` — app icon
- `src/components/OfflineIndicator.tsx` — network status banner
- `src/hooks/useNetworkStatus.ts` — online/offline detection
- `vite.config.ts` — VitePWA plugin with runtime caching
- `src/main.tsx` — Firestore offline persistence enabled
- `src/App.tsx` — OfflineIndicator integration

## ✅ Phase 2: 🏆 Agent Scorecard & Leaderboard — COMPLETE

**Goal:** Gamified agent performance dashboard with monthly/quarterly rankings, metrics, and achievement badges.

### Tasks

- [x] **2.1** Define `AgentScore` / `AchievementBadge` types
- [x] **2.2** Create `src/lib/scorecard.ts` — client-side computation engine
  - Deals closed, total commission, lead conversion rate, avg deal size
  - Viewing-to-deal ratio, period-over-period trends
  - Overall 0–100 weighted score with per-agent normalization
- [x] **2.3** Create `AgentLeaderboard.tsx` — ranked table with medal positions (#1 🥇, #2 🥈, #3 🥉)
- [x] **2.4** Create `AgentProfileScore.tsx` — individual agent metrics grid
- [x] **2.5** Create `AchievementBadges.tsx` — 8 badges, BadgeGallery, BadgeLibrary (earned/locked view)
- [x] **2.6** Add route `/leaderboard` + sidebar nav entry
- [x] **2.7** LeaderboardPage with period filter (week/month/quarter/all-time)
- [x] **2.8** Client-side only — no new Firestore collection needed (reads existing deals/leads/viewings/users)
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

**Files created:**

- `src/types/index.ts` — AgentScore, AchievementBadge, AchievementBadgeId types
- `src/lib/scorecard.ts`
- `src/components/scorecard/AgentLeaderboard.tsx`
- `src/components/scorecard/AgentProfileScore.tsx`
- `src/components/scorecard/AchievementBadges.tsx`
- `src/components/scorecard/index.ts`
- `src/pages/LeaderboardPage.tsx`
- `src/App.tsx` / `src/components/layout/AppLayout.tsx` — routing + nav

---

## ✅ Phase 3: 💵 Payment / Collection Tracker — COMPLETE

**Goal:** Track reservation fees, earnest money, down payments, equity payments per deal — with status, receipt uploads, and overdue alerts.

### Tasks

- [x] **3.1** Define `Payment` Firestore schema (`types/index.ts`)
- [x] **3.2** Create `paymentService.ts` — CRUD + status calculations + real-time listener
- [x] **3.3** Create `PaymentList.tsx` — per-deal payment timeline with mark-paid/delete
- [x] **3.4** Create `PaymentForm.tsx` — add/edit payment entry with receipt upload
- [x] **3.5** Create `PaymentSummary.tsx` — totals by status, overdue indicator
- [x] **3.6** Add **Payment Schedule** section to DealsPage (`DealPaymentSection.tsx`)
- [x] **3.7** Auto-flag overdue payments (client-side date comparison)
- [x] **3.8** Receipt photo upload to Firebase Storage via `uploadFile`
- [x] **3.9** Firestore rules for `payments` collection
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

**Files created/modified:**

- `src/types/index.ts` — Payment, PaymentType, PaymentStatus types
- `src/services/paymentService.ts`
- `src/components/payments/PaymentForm.tsx`
- `src/components/payments/PaymentList.tsx`
- `src/components/payments/PaymentSummary.tsx`
- `src/components/payments/DealPaymentSection.tsx`
- `src/components/payments/index.ts`
- `src/pages/DealsPage.tsx` — added DealPaymentSection
- `firestore.rules` — payments collection rules

---

## ✅ Phase 4: 📄 Contract & Document Generator — COMPLETE

**Goal:** Generate PH-standard real estate documents as downloadable PDFs — Reservation Agreement, Contract to Sell, Deed of Absolute Sale, Letter of Intent, Broker Engagement Letter.

### Tasks

- [x] **4.1** Add `jspdf` and `jspdf-autotable` dependencies
- [x] **4.2** Create `src/lib/contracts/templates.ts` — 5 PH document template definitions
- [x] **4.3** Create `src/lib/contracts/generator.ts` — PDF generation engine with A4 formatting
- [x] **4.4** Create `src/lib/contracts/fields.ts` — map Firestore fields → document placeholders
- [x] **4.5** Create `ContractGenerator.tsx` — 3-step wizard: pick template → fill fields → preview/download
- [x] **4.6** Add "Generate Contract" button on ListingDetailPage (auto-fills listing data)
- [x] **4.7** PH-standard content: RA 9646 disclosure, Maceda Law (RA 6552), CGT/DST tax computation, notary blocks, signature lines with witnesses
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

**Files created/modified:**

- `src/lib/contracts/templates.ts`
- `src/lib/contracts/generator.ts`
- `src/lib/contracts/fields.ts`
- `src/lib/contracts/index.ts`
- `src/components/contracts/ContractGenerator.tsx`
- `src/components/contracts/index.ts`
- `src/pages/ListingDetailPage.tsx` — contract button + auto-fill
- `package.json` — jspdf, jspdf-autotable dependencies

---

## ✅ Phase 5: 📍 Property Tour Builder — COMPLETE

**Goal:** Build multi-property tour itineraries — select listings, arrange stops, schedule times, collect post-tour feedback.

### Tasks

- [x] **5.1** Define `Tour`, `TourStop`, `TourStatus` types in `src/types/index.ts`
- [x] **5.2** Create `src/services/tourService.ts` — CRUD + real-time listeners + helper functions (duration calc, maps URL generation, status colors)
- [x] **5.3** Create `TourBuilder.tsx` — 4-step wizard: client info → select listings → arrange/schedule → review & save
- [x] **5.4** Create `TourList.tsx` — grouped by status, filters, search, quick actions (edit/start/complete/delete)
- [x] **5.5** Create `TourItinerary.tsx` — day-of view with stop cards, timeline, maps link, print support, status transitions
- [x] **5.6** Create `TourFeedback.tsx` — per-stop feedback form (interest level, concerns, next steps, photos)
- [x] **5.7** Create `TourStopCard.tsx` — reusable stop display with position marker, duration, drive time, feedback
- [x] **5.8** Add route `/tours` + sidebar nav entry
- [x] **5.9** Firestore rules for `tours` collection
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

**Files created:**

- `src/types/index.ts` — Tour, TourStop, TourStatus types
- `src/services/tourService.ts`
- `src/components/tours/TourBuilder.tsx`
- `src/components/tours/TourList.tsx`
- `src/components/tours/TourItinerary.tsx`
- `src/components/tours/TourFeedback.tsx`
- `src/components/tours/TourStopCard.tsx`
- `src/components/tours/index.ts`
- `src/pages/ToursPage.tsx`
- `src/App.tsx` / `src/components/layout/AppLayout.tsx` — routing + nav
- `firestore.rules` — tours collection

---

## ✅ Phase 6: 🆔 License Expiry Tracker — COMPLETE

**Goal:** Track PRC licenses, broker accreditations, BIR registrations, and HLURB licenses with expiry monitoring, renewal status, and compliance dashboard.

### Tasks

- [x] **6.1** Define `License`, `LicenseType`, `LicenseStatus` types in `src/types/index.ts`
- [x] **6.2** Create `src/services/licenseService.ts` — CRUD + real-time listeners + expiry calculations (active/expiring-soon/expired/renewed)
- [x] **6.3** Create `LicenseList.tsx` — list with status badges, expiry countdown, agent grouping, edit/delete actions
- [x] **6.4** Create `LicenseForm.tsx` — add/edit form with PH license types, issuing body auto-fill, date pickers
- [x] **6.5** Create `LicenseDashboard.tsx` — summary cards (active/expiring/expired/renewed), compliance rate bar, urgent alerts
- [x] **6.6** Add route `/licenses` + sidebar nav entry
- [x] **6.7** Firestore rules for `licenses` collection
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

**Files created:**

- `src/types/index.ts` — License, LicenseType, LicenseStatus types
- `src/services/licenseService.ts`
- `src/components/licenses/LicenseList.tsx`
- `src/components/licenses/LicenseForm.tsx`
- `src/components/licenses/LicenseDashboard.tsx`
- `src/components/licenses/index.ts`
- `src/pages/LicensesPage.tsx`
- `src/App.tsx` / `src/components/layout/AppLayout.tsx` — routing + nav
- `firestore.rules` — licenses collection

---

## ✅ Phase 7: 📊 Market Report Generator — COMPLETE

**Goal:** Client-side market analysis report computed from existing listings/deals — price trends, property distribution, location analysis, and KPI overview.

### Tasks

- [x] **7.1** Create `src/lib/marketReport.ts` — computation engine (overview, property type/status breakdown, location analysis, monthly price trends, days on market)
- [x] **7.2** Create `MarketOverview.tsx` — 6 KPI cards (total listings, volume, avg/median price, price range, price/sqm, days on market)
- [x] **7.3** Create `PriceTrends.tsx` — CSS bar charts for average price trend + monthly volume, summary table with median/volume/count
- [x] **7.4** Create `PropertyBreakdown.tsx` — distribution by property type (condo, house-lot, lot-only, commercial, foreclosed) and status (available, under-option, sold, rented, off-market)
- [x] **7.5** Create `LocationAnalysis.tsx` — province summary cards, city breakdown table with listing count / avg price / volume / bar indicator
- [x] **7.6** Create `MarketPage.tsx` — 4-tab layout (Overview, Price Trends, Breakdown, Locations) with auto-generated report from Firestore data
- [x] **7.7** Add route `/market` + sidebar nav entry
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

**Files created:**

- `src/lib/marketReport.ts`
- `src/components/market/MarketOverview.tsx`
- `src/components/market/PriceTrends.tsx`
- `src/components/market/PropertyBreakdown.tsx`
- `src/components/market/LocationAnalysis.tsx`
- `src/components/market/index.ts`
- `src/pages/MarketPage.tsx`
- `src/App.tsx` / `src/components/layout/AppLayout.tsx` — routing + nav

## ✅ Phase 8: 🏗️ Project / Subdivision Management — COMPLETE

**Goal:** Manage subdivisions, condos, commercial, and mixed-use developments — with phase tracking, unit inventory, developer dashboard, and payment milestone monitoring.

### Tasks

- [x] **8.1** Define `Project`, `ProjectPhase`, `ProjectStatus`, `ProjectType`, `Unit`, `UnitStatus`, `PaymentMilestone` types
- [x] **8.2** Create `src/services/projectService.ts` — CRUD + real-time listeners for projects, units, milestones + helper functions (status colors, labels, sold percentage)
- [x] **8.3** Create `ProjectCard.tsx` — project card with status badge, price range, units progress bar
- [x] **8.4** Create `ProjectList.tsx` — filterable/searchable grid with status pills, new/edit modal
- [x] **8.5** Create `ProjectForm.tsx` — full project creation/edit form with phases, amenities, pricing
- [x] **8.6** Create `ProjectDetail.tsx` — project detail with phase management, unit board, milestones, edit/delete
- [x] **8.7** Create `ProjectPhaseManager.tsx` — add/edit/remove phases with sold percentage progress bars
- [x] **8.8** Create `PhaseCard.tsx` / `PhaseForm.tsx` — phase display and mini-form
- [x] **8.9** Create `UnitCard.tsx` / `UnitStatusBoard.tsx` — unit inventory with status badges, filtering
- [x] **8.10** Create `PaymentMilestoneTracker.tsx` — milestone list with status indicators for units
- [x] **8.11** Create `DeveloperDashboard.tsx` — cross-project summary with KPIs, status distribution, approved-rejected-milestones chart
- [x] **8.12** Create `ProjectDashboard.tsx` — project-level KPIs (total units, available, phase count, milestones)
- [x] **8.13** Add route `/projects` + sidebar nav entry
- [x] **8.14** Firestore rules for `projects`, `units`, `paymentMilestones` collections
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

**Files created:**
- `src/types/index.ts` — Project, ProjectPhase, ProjectStatus, ProjectType, Unit, UnitStatus, PaymentMilestone types
- `src/services/projectService.ts`
- `src/components/projects/ProjectCard.tsx` / `ProjectList.tsx` / `ProjectForm.tsx` / `ProjectDetail.tsx`
- `src/components/projects/ProjectPhaseManager.tsx` / `PhaseCard.tsx` / `PhaseForm.tsx`
- `src/components/projects/UnitCard.tsx` / `UnitStatusBoard.tsx`
- `src/components/projects/PaymentMilestoneTracker.tsx`
- `src/components/projects/DeveloperDashboard.tsx` / `ProjectDashboard.tsx`
- `src/components/projects/index.ts`
- `src/pages/ProjectsPage.tsx`
- `src/App.tsx` / `src/components/layout/AppLayout.tsx` — routing + nav
- `firestore.rules` — projects, units, paymentMilestones collections

---

## 📋 All 8 Phases Complete ✅

The CRM now includes **26 modules**, **150+ components**, **25+ services**, and **184+ tests** covering the full real estate brokerage workflow for the Philippine market.

---

## 🚀 Upcoming Phases

### Phase 9: 🧪 E2E Tests with Playwright

**Goal:** Add end-to-end test coverage for critical user flows — login, lead CRUD, deal pipeline, listing management, viewing scheduling, and project management.

### Tasks

- [ ] **9.1** Install Playwright + `@playwright/test` as dev dependency
- [ ] **9.2** Configure `playwright.config.ts` — headless Chrome/Firefox, CI mode, video recording on failure
- [ ] **9.3** Auth setup — test helper that authenticates via Firebase Auth emulator (email/password + Google SSO mocks)
- [ ] **9.4** **Lead flow E2E**: create lead → edit → change status → add communication log entry → delete
- [ ] **9.5** **Deal pipeline E2E**: create deal from lead → verify kanban card → move through statuses → set co-broking split → mark closed
- [ ] **9.6** **Listing flow E2E**: create listing with media → verify detail page → generate brochure link → verify public brochure renders
- [ ] **9.7** **Viewing flow E2E**: schedule viewing → verify calendar event → submit post-viewing feedback → check tour completion
- [ ] **9.8** **Project/Subdivision flow E2E**: create project → add phases → add units → verify unit status board → track payment milestone
- [ ] **9.9** **Auth flows**: login with valid creds → logout → protected route redirect → registration → password reset flow
- [ ] **9.10** **CI integration**: add `e2e` job to GitHub Actions — start Firebase emulators + Vite dev server → run Playwright → upload videos/artifacts
- [ ] **9.11** Add `yarn e2e` script + `yarn e2e:ci` (with emulator setup)

---

### Phase 10: ⚡ Performance Optimization

**Goal:** Reduce bundle size, improve load times, and optimize runtime performance for mobile agents.

### Tasks

- [ ] **10.1** **Route-level code splitting** — convert all `import Page from "@/pages/..."` to `React.lazy(() => import("..."))` with `<Suspense fallback={<Skeleton />}>` in App.tsx
- [ ] **10.2** **Component-level lazy loading** — lazy-load heavy components: PropertyMap, ContractGenerator, TourBuilder, ProjectForm, Analytics charts, PaymentMilestoneTracker timeline view
- [ ] **10.3** **Bundle analysis** — add `vite-plugin-visualizer` to generate bundle report; identify and trim large dependencies
- [ ] **10.4** **Tree-shake Firebase** — verify only used Firestore/Auth/Storage modules are imported (not the entire `firebase` barrel)
- [ ] **10.5** **Memoize expensive computations** — `React.useMemo` on: marketReport computation, scorecard computation, filtered/sorted lists in ProjectList, LeadList, TourList
- [ ] **10.6** **Virtualize long lists** — use `react-window` or `@tanstack/virtual` for: LeadList with 500+ leads, unit inventory in large projects, activity feed with pagination
- [ ] **10.7** **Image optimization** — use Firebase Storage `?alt=media&width=...` resize parameters on listing images, brochure images; add `loading="lazy"` to all `<img>` tags
- [ ] **10.8** **Debounce search inputs** — add debounce (300ms) on search fields in LeadList, ListingList, ProjectList, LicenseList
- [ ] **10.9** **Reduce Firestore reads** — cache frequently accessed static data (office list, agent list) with React Query staleTime; batch Firestone listeners where possible
- [ ] **10.10** **Bundle budget** — set Rollup chunk size warning threshold; ensure initial JS payload < 200KB gzipped

---

### Phase 11: 🛡️ Production Hardening

**Goal:** Add error monitoring, analytics, security hardening, and operational readiness.

### Tasks

- [ ] **11.1** **Error boundary coverage** — wrap each route/page with an `<ErrorBoundary>` that shows a friendly error + retry button (currently only App-level); add error reporting to console in dev
- [ ] **11.2** **Firebase Performance Monitoring** — enable `firebase/performance` for automatic trace reporting (page load, network requests)
- [ ] **11.3** **Analytics events** — add Firebase Analytics custom events for key actions: lead_created, deal_closed, viewing_scheduled, project_created, document_generated, brochure_shared
- [ ] **11.4** **User-facing error toasts** — replace raw `alert()` calls with a Toast/Sonner notification pattern for all service operations (create/update/delete success/failure)
- [ ] **11.5** **Form validation feedback** — ensure all forms (LeadForm, ListingForm, ProjectForm, LicenseForm, TourBuilder) have inline validation errors with `aria-invalid` / `aria-describedby`
- [ ] **11.6** **Security headers audit** — verify `firebase.json` hosting headers include: `Content-Security-Policy`, `Strict-Transport-Security`, `Permissions-Policy`, `Referrer-Policy`
- [ ] **11.7** **Firestore rules audit** — review all collection rules for: no open writes, proper `request.auth.uid` checks, `inMyOrg()` consistency, no `if true` rules
- [ ] **11.8** **Storage rules audit** — verify `storage.rules` restrict upload size, file type, and path patterns per user role
- [ ] **11.9** **Input sanitization** — ensure all user-generated text is rendered as text (not HTML) via React's default XSS protection; verify no `dangerouslySetInnerHTML` usage
- [ ] **11.10** **Rate limiting simulation** — verify app degrades gracefully when Firestore read quota is near limit: show cached data, display quota warning banner
- [ ] **11.11** **Operational runbook** — update `plan/DEPLOYMENT.md` with: rollback procedure, monitoring dashboards link, alert response guide, incident escalation path
