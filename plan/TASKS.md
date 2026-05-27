# TASKS — Real Estate Brokerage CRM & PM System

> Concrete, actionable tasks from initialization to production deployment.
> Each task is a single unit of work — implement, test, commit.

---

## Phase 0: Project Initialization

- [ ] **T-001** Initialize Git repo with `README.md`, `.gitignore` (React + Vite), `LICENSE`
- [ ] **T-002** Create project structure: `/src` (components, pages, hooks, services, lib, types)
- [ ] **T-003** Scaffold React + Vite + TypeScript project
- [ ] **T-004** Install & configure Tailwind CSS + ShadCN/ui
- [ ] **T-005** Configure ESLint, Prettier, Husky (pre-commit hooks)
- [ ] **T-006** Create Firebase project (console) — enable Auth, Firestore, Storage, Hosting
- [ ] **T-007** Initialize Firebase in the app (`firebase.ts` config)
- [ ] **T-008** Configure Firestore security rules (initial draft: lock down by auth)
- [ ] **T-009** Configure Firebase Storage security rules
- [ ] **T-010** Set up GitHub Actions CI: lint → test → deploy to Firebase Hosting
- [ ] **T-011** Set up Sentry / Error Boundary for client-side error tracking

---

## Phase 1: Authentication & User Management

- [ ] **T-101** Create `User` Firestore doc schema (id, role, brokerId, teamId, displayName, email, phone, photoURL)
- [ ] **T-102** Implement user registration (Firebase Auth email + password) + create Firestore user doc
- [ ] **T-103** Implement user login (Firebase Auth)
- [ ] **T-104** Implement password reset flow (Firebase Auth built-in)
- [ ] **T-105** Implement Google OAuth login
- [ ] **T-106** Build login / register UI pages (mobile-first)
- [ ] **T-107** Build profile settings page (edit name, phone, photo)
- [ ] **T-108** Build onboarding flow (set role, broker info for new users)
- [ ] **T-109** Implement FCM token registration on login (store in user doc)
- [ ] **T-110** Tests: auth signup, login, password reset, profile CRUD

### 1A. Agent Hierarchy

- [ ] **T-111** Implement hierarchy: `brokerId` field on agent User docs
- [ ] **T-112** Build broker UI — list agents under me, invite new agent
- [ ] **T-113** Implement invitation flow: broker sends invite → agent registers with link → linked automatically
- [ ] **T-114** Build agent team creation (group agents under team name)
- [ ] **T-115** Build agent profile page (license #, HLURB/DHSUD, contact, default commission rate)
- [ ] **T-116** Implement permission enforcement in UI (broker sees all, agent sees own)
- [ ] **T-117** Tests: hierarchy CRUD, permission rules

---

## Phase 2: Lead Management

- [ ] **T-201** Create `Lead` Firestore doc structure
- [ ] **T-202** Implement lead CRUD (create, edit, delete, assign)
- [ ] **T-203** Build lead list view with filters (status, source, assigned agent, date range)
- [ ] **T-204** Build lead detail page with full info
- [ ] **T-205** Implement lead status workflow (New → Contacted → Viewed → Negotiating → Closed / Lost)
- [ ] **T-206** Implement lead scoring: hot/warm/cold
- [ ] **T-207** Implement duplicate detection (check phone + email on create, warn user)
- [ ] **T-208** Build source field with options: Facebook, Referral, Walk-in, Manual
- [ ] **T-209** Bulk import leads from CSV
- [ ] **T-210** Export leads to CSV/Excel
- [ ] **T-211** Tests: lead CRUD, status transitions, duplicate detection

### 2A. Communication Log & Activity Timeline

- [ ] **T-212** Build communication log UI per lead (log call, text, meeting)
- [ ] **T-213** Each log entry: type, timestamp, notes, logged by
- [ ] **T-214** Build auto-generated activity timeline per lead
- [ ] **T-215** Timeline captures: lead created, status changed, viewing scheduled, commission computed
- [ ] **T-216** Tests: logging, timeline generation

### 2B. Lead Assignment & Transfer

- [ ] **T-217** Implement lead assignment (broker picks agent from dropdown)
- [ ] **T-218** Implement lead transfer request (agent requests → broker approves)
- [ ] **T-219** Add assignment history to lead activity timeline
- [ ] **T-220** Tests: assignment, transfer flow

---

## Phase 3: Deal Pipeline (Kanban)

- [ ] **T-301** Build Kanban board component (drag & drop columns)
- [ ] **T-302** Columns match lead statuses: New → Contacted → Viewed → Negotiating → Closed / Lost
- [ ] **T-303** Each card shows: lead name, property interest, score badge, days in stage
- [ ] **T-304** Drag moves lead to next/previous status (updates Firestore)
- [ ] **T-305** Quick actions on card: call, message, schedule viewing
- [ ] **T-306** Per-agent view: agent sees only their leads
- [ ] **T-307** Broker overview: all agents' pipelines in one view (grouped by agent)
- [ ] **T-308** Tests: drag & drop, status update, permission filtering

---

## Phase 4: Property Listing Management

- [ ] **T-401** Create `Listing` Firestore doc structure
- [ ] **T-402** Create `ListingMedia` subcollection (image URLs from Firebase Storage)
- [ ] **T-403** Implement listing CRUD (create/edit/delete with media uploads)
- [ ] **T-404** Build listing form (multi-step: details → media → publish)
- [ ] **T-405** Implement image upload to Firebase Storage with preview
- [ ] **T-406** Build listing gallery view (grid, lightbox)
- [ ] **T-407** Implement listing status workflow (Available → Under Option → Sold/Rented/Off-Market)
- [ ] **T-408** Assign listing to agent (broker assigns)
- [ ] **T-409** Build listing search & filters (price, location, type, status, flood risk)
- [ ] **T-410** Add property type tagging: condo, house & lot, lot only, commercial, foreclosed
- [ ] **T-411** Add flood / hazard risk tag (low, medium, high, unknown)
- [ ] **T-412** Add nearby amenities (school, hospital, mall, LRT/MRT)
- [ ] **T-413** Build required docs checklist per property type (title, tax dec, HOA clearance, etc.)
- [ ] **T-414** Tests: listing CRUD, media upload, status transitions

### 4A. Property Brochure Generator

- [ ] **T-415** Build public brochure page component (read-only listing view)
- [ ] **T-416** Page shows: main photo, details table, agent contact, share buttons
- [ ] **T-417** Host under `/b/{listingId}` route (public, no auth required)
- [ ] **T-418** Implement share buttons: WhatsApp, Viber, Messenger, Copy Link
- [ ] **T-419** Generate agent QR code on brochure (agent contact page)
- [ ] **T-420** Add "Download as Image" button (html2canvas or similar)
- [ ] **T-421** Track brochure views (increment counter on listing doc)
- [ ] **T-422** Tests: brochure rendering, share actions, view tracking

---

## Phase 5: Viewing Schedule Tracker

- [ ] **T-501** Create `Viewing` Firestore doc structure
- [ ] **T-502** Implement viewing CRUD (schedule, reschedule, cancel)
- [ ] **T-503** Build schedule creation form (date picker + time + property + lead select)
- [ ] **T-504** Build agent's calendar view (daily/weekly)
- [ ] **T-505** Implement check-in (photo upload at property = proof)
- [ ] **T-506** Build post-viewing feedback form (interest level, concerns, next steps)
- [ ] **T-507** Viewing photo upload — agent takes photos, stored under Viewing doc
- [ ] **T-508** Push notification reminders (24h before + 1h before via FCM)
- [ ] **T-509** Build viewing history on lead detail page
- [ ] **T-510** Google Calendar integration (one-way: create event from viewing)
- [ ] **T-511** Tests: schedule CRUD, check-in, reminders

### 5A. Client Portal

- [ ] **T-512** Build public client page (no auth required, token-based access)
- [ ] **T-513** Client sees: assigned properties, upcoming viewings
- [ ] **T-514** Request reschedule button (creates notification for agent)
- [ ] **T-515** Post-viewing feedback from client side
- [ ] **T-516** Shareable link generated per lead (agent sends via Messenger/Viber)
- [ ] **T-517** Tests: portal rendering, reschedule request flow

---

## Phase 6: Commission Tracking

- [ ] **T-601** Create `CommissionPlan` Firestore doc structure
- [ ] **T-602** Create `Commission` (deal) Firestore doc structure
- [ ] **T-603** Create `Payout` Firestore doc structure
- [ ] **T-604** Implement commission plan CRUD (broker defines plans, assigns to agents)
- [ ] **T-605** Plan types: fixed %, tiered split, referral fee, escalating tiers
- [ ] **T-606** Implement client-side commission calculation engine:
  - [ ] T-606a Fixed % calculation
  - [ ] T-606b Tiered split (broker/agent share)
  - [ ] T-606c Referral fee
  - [ ] T-606d Escalating tiers (volume-based)
  - [ ] T-606e PH tax deductions (12% VAT, 1% withholding)
- [ ] **T-607** Auto-compute commission when deal is marked Closed
- [ ] **T-608** Build commission statement page (per agent, per deal)
- [ ] **T-609** Build payout request / approval flow (agent requests → broker approves)
- [ ] **T-610** Generate commission reports (monthly, quarterly, yearly)
- [ ] **T-611** Export commission reports to PDF
- [ ] **T-612** Commission forecast (pending vs paid, projected monthly income)
- [ ] **T-613** Tests: all calculation types, tax handling, payout flow

### 6A. Co-broking / Shared Deals

- [ ] **T-614** Add co-broking toggle on deal creation
- [ ] **T-615** Co-broking fields: agent2, split percentage (50/50 default)
- [ ] **T-616** Shared pipeline access — both agents see deal progress
- [ ] **T-617** Commission split auto-calculated for both agents
- [ ] **T-618** Payout split — each agent's share tracked separately
- [ ] **T-619** Tests: co-broking flow, split math

### 6B. Expense Tracking

- [ ] **T-620** Create `Expense` Firestore doc structure
- [ ] **T-621** Implement expense CRUD (add/edit/delete)
- [ ] **T-622** Categories: transportation, meals, ads, misc
- [ ] **T-623** Receipt photo upload to Firebase Storage
- [ ] **T-624** Link expense to a deal (optional)
- [ ] **T-625** Broker view — see all agent expenses (optional toggle)
- [ ] **T-626** Export expenses to CSV
- [ ] **T-627** Tests: expense CRUD, receipt upload

### 6C. BIR Tax Estimator

- [ ] **T-628** Build BIR tax calculator component
- [ ] **T-629** Input: deal price, property type
- [ ] **T-630** Compute: 6% Capital Gains Tax, 1.5% DST, 1% CWT
- [ ] **T-631** Show breakdown: buyer pays what, seller pays what
- [ ] **T-632** Show total closing costs for buyer
- [ ] **T-633** Tests: all tax formulas match BIR rates

---

## Phase 7: PH-Specific Tools

### 7A. Pag-IBIG Loan Calculator

- [ ] **T-701** Build Pag-IBIG calculator component
- [ ] **T-702** Inputs: property price, down payment %, loan term, interest rate
- [ ] **T-703** Compute: loan amount, monthly amortization
- [ ] **T-704** Show Pag-IBIG max loanable amount table reference
- [ ] **T-705** Tests: calculator outputs match Pag-IBIG schedule

### 7B. Bank Financing Calculator

- [ ] **T-706** Build bank financing calculator component
- [ ] **T-707** Pre-filled tiers: BPI, BDO, Metrobank rates
- [ ] **T-708** Inputs: loan amount, term, selected bank
- [ ] **T-709** Compute: monthly amortization breakdown
- [ ] **T-710** Tests: calculator outputs

### 7C. Title Status Tracker

- [ ] **T-711** Create title tracking fields on Deal doc
- [ ] **T-712** Stages: With Seller → BIR (CGT) → Registry of Deeds → Transfer → Complete
- [ ] **T-713** Build title progress UI (step-by-step progress bar)
- [ ] **T-714** Document checklist per stage (required docs)
- [ ] **T-715** Timeline view — how long each stage took
- [ ] **T-716** Tests: stage transitions, document checklist

---

## Phase 8: Agent Productivity

### 8A. Task Management

- [ ] **T-801** Create `Task` Firestore doc structure
- [ ] **T-802** Implement task CRUD (create, edit, complete, delete)
- [ ] **T-803** Build task list UI (filter by priority, due date, related lead/listing)
- [ ] **T-804** Priority levels: high, medium, low with badges
- [ ] **T-805** Link task to lead, listing, or deal
- [ ] **T-806** Broker can assign tasks to agents
- [ ] **T-807** Push notification on new task assignment
- [ ] **T-808** Tests: task CRUD, assignment

### 8B. Notes & Mentions

- [ ] **T-809** Build notes system on leads, listings, and deals
- [ ] **T-810** Rich text: plain with @mentions support
- [ ] **T-811** @mention triggers notification for mentioned user
- [ ] **T-812** Note types: general, reminder, document request
- [ ] **T-813** Read/unread status per note
- [ ] **T-814** Tests: notes CRUD, @mention notification

---

## Phase 9: Notifications

- [ ] **T-901** Create `Notification` Firestore doc structure
- [ ] **T-902** Build in-app notification system (bell icon, unread badge, notification list)
- [ ] **T-903** Build push notification service (FCM send via client-side trigger)
- [ ] **T-904** Trigger notifications on:
  - New lead assigned
  - Viewing reminder (24h / 1h)
  - Commission approved / paid
  - Deal status change
  - New task assigned
  - @mention in notes
  - Reschedule request from client portal
- [ ] **T-905** Mark notification as read
- [ ] **T-906** Build notification preferences page (toggle per type)
- [ ] **T-907** Tests: notification creation, read status, FCM delivery

---

## Phase 10: Dashboard & Broker Command Center

- [ ] **T-1001** Build broker dashboard:
  - [ ] T-1001a Total leads, active listings, pending commissions (KPI cards)
  - [ ] T-1001b Active agents today
  - [ ] T-1001c Recent activity feed
- [ ] **T-1002** Build agent dashboard:
  - [ ] T-1002a My leads count, my viewings today
  - [ ] T-1002b My pending commissions
  - [ ] T-1002c My task list (due today)
- [ ] **T-1003** Build lead pipeline funnel chart
- [ ] **T-1004** Build lead source analytics (pie/bar chart: FB vs referral vs walk-in conversion rates)
- [ ] **T-1005** Build agent leaderboard (most leads, most closed deals, most viewings)
- [ ] **T-1006** Build commission overview chart (earned vs paid, by month)
- [ ] **T-1007** Build team performance report (per agent: leads, viewings, closed deals, commissions)
- [ ] **T-1008** Build listing performance report (views, brochure shares, inquiries, conversion)
- [ ] **T-1009** Build commission forecast widget (projected vs actual)
- [ ] **T-1010** Tests: chart data accuracy, permission-based visibility

---

## Phase 11: Production Hardening

- [ ] **T-1101** Finalize Firestore security rules — role-based access (broker vs agent vs sub-agent)
- [ ] **T-1102** Finalize Firebase Storage security rules (agents only see their own listing images)
- [ ] **T-1103** Implement Firestore indexes for common queries (leads by agent, listings by status, etc.)
- [ ] **T-1104** Set up Firebase performance monitoring
- [ ] **T-1105** Write end-to-end tests (Cypress / Playwright for critical paths)
- [ ] **T-1106** Test offline behavior — Firestore persistence + error states
- [ ] **T-1107** Security review — Firestore rules edge cases, auth edge cases, XSS in descriptions
- [ ] **T-1108** Set up Firebase alerts (usage spikes, security rule violations)
- [ ] **T-1109** Write deployment runbook (firebase deploy, rollback via hosting versions)

---

## Phase 12: Launch & Post-Launch

- [ ] **T-1201** Set up Firebase Hosting custom domain + SSL
- [ ] **T-1202** Set up Google Analytics / Plausible for usage tracking
- [ ] **T-1203** Create user onboarding guide (in-app tooltips + docs)
- [ ] **T-1204** Soft launch with 5–10 broker accounts for beta testing
- [ ] **T-1205** Collect feedback and prioritize v2 enhancements

---

---

## Phase 13: 📄 Document Vault & Management

Move v2 backlog to active development — PH real estate is document-intensive.

- [ ] **T-1301** Create `DocumentVault` Firestore doc structure (dealId, listingId, stage, name, fileUrl, fileType, fileSize, uploadedBy, uploadedAt, version)
- [ ] **T-1302** Implement document upload to Firebase Storage per deal/listing with preview
- [ ] **T-1303** Build document list view per deal (sort by stage, type, date)
- [ ] **T-1304** Build document detail panel (view, download, version history)
- [ ] **T-1305** Version tracking — new upload of same doc name creates new version, keeps old
- [ ] **T-1306** Per-stage document requirements (e.g. "BIR CGT stage needs: BIR Form 1706, CAR, Tax Clearance")
- [ ] **T-1307** Document expiry alerts — set expiry dates, push notification when nearing
- [ ] **T-1308** Document categories: Title, Tax, Contract, ID, HOA, Miscellaneous
- [ ] **T-1309** Bulk document upload (multiple files at once)
- [ ] **T-1310** Document request — broker requests doc from agent, creates notification
- [ ] **T-1311** Tests: upload, versioning, expiry alerts, permission-based access

## Phase 14: 🏗️ Mortgage & Deal Progress Tracker

Per-deal mortgage loan application tracking — PH banks have distinct processes.

- [ ] **T-1401** Create `Mortgage` Firestore doc structure (dealId, bankId, loanAmount, status, stages[], notes)
- [ ] **T-1402** Define mortgage stages: Application → Bank Evaluation → BIR Docs → ROD → Loan Release
- [ ] **T-1403** Pre-fill PH bank profiles: BPI, BDO, Metrobank, Security Bank, EastWest (estimated timelines, typical rates)
- [ ] **T-1404** Build mortgage tracker widget on deal detail page
- [ ] **T-1405** Build stage progress bar with estimated and actual dates
- [ ] **T-1406** Document checklist per mortgage stage (what docs the bank needs)
- [ ] **T-1407** Timeline view — how long each mortgage stage took (for agent reference)
- [ ] **T-1408** Push notification on mortgage stage changes
- [ ] **T-1409** Link mortgage to Document Vault — upload bank-required docs directly from tracker
- [ ] **T-1410** Add mortgage status summary to broker dashboard (deals awaiting bank approval)
- [ ] **T-1411** Tests: stage transitions, timeline accuracy, doc linkage

## Phase 15: 🗺️ Map View & Location Features

Interactive map for listings with PH-relevant overlays.

- [ ] **T-1501** Integrate Leaflet/MapLibre (free, no API key) for interactive maps
- [ ] **T-1502** Build map component with listing pins (price, status, type color-coded)
- [ ] **T-1503** Listing detail shows embedded map with location marker
- [ ] **T-1504** Add geocoding — store lat/lng on listing creation (from address string via Nominatim/OSM)
- [ ] **T-1505** Map filters: filter by price range, property type, status, flood risk
- [ ] **T-1506** Nearby POIs overlay: schools, hospitals, malls, LRT/MRT stations
- [ ] **T-1507** Cluster pins at zoom-out level (performance for many listings)
- [ ] **T-1508** Click pin → popup with listing thumbnail, price, status, agent contact
- [ ] **T-1509** Click popup → navigate to listing detail
- [ ] **T-1510** Agent dashboard shows "My Listings Map" view
- [ ] **T-1511** Tests: map rendering, pin placement, filter interaction

## Phase 16: 📈 Advanced Analytics & Performance Reports

Broker command center on steroids — data-driven decisions.

- [ ] **T-1601** Build lead conversion funnel chart (New → Contacted → Viewed → Negotiating → Closed, with drop-off % at each stage)
- [ ] **T-1602** Build agent performance board (per agent: leads acquired, deals closed, commission earned, conversion rate, response time)
- [ ] **T-1603** Build expense vs commission P&L report (per agent: total expenses claimed vs total commission earned)
- [ ] **T-1604** Build listing performance report (views, brochure shares, inquiries, days on market, conversion to deal)
- [ ] **T-1605** Build source analytics dashboard (lead source → conversion → revenue, by channel: Facebook, Referral, Walk-in, Manual)
- [ ] **T-1606** Build team comparison view (side-by-side agent metrics, rankable by any column)
- [ ] **T-1607** Build monthly/quarterly trend charts (leads, deals, revenue over time)
- [ ] **T-1608** Build exportable report generator (PDF/CSV of any report, date-range selectable)
- [ ] **T-1609** Build custom date range picker for all reports
- [ ] **T-1610** Add report widgets to broker dashboard (configurable KPI grid)
- [ ] **T-1611** Tests: chart data accuracy, permission filtering (agent sees own, broker sees all)

## Phase 17: 📅 Unified Calendar & Smart Reminders

Merge viewings, tasks, follow-ups, and deal milestones into one timeline.

- [ ] **T-1701** Build unified calendar component (month/week/day views) using a calendar library (react-big-calendar or FullCalendar)
- [ ] **T-1702** Ingest data sources: Viewings, Tasks, Deal milestones, Document expiry dates
- [ ] **T-1703** Color-code by type: viewing (blue), task (orange), deal milestone (green), document expiry (red)
- [ ] **T-1704** Click event → show detail popup with quick actions (reschedule viewing, mark task done)
- [ ] **T-1705** Click event → navigate to source page (lead detail, listing detail, etc.)
- [ ] **T-1706** Add new event quick-create from calendar (schedule viewing, create task)
- [ ] **T-1707** Build smart follow-up engine:
  - Lead inactive N days → auto-create "Follow up with {lead}" task
  - Viewing done, feedback pending → auto-notify agent
  - Document expiring in 7 days → push notification
- [ ] **T-1708** Build recurring task support (daily/weekly/monthly follow-ups, configurable)
- [ ] **T-1709** Build notification preferences page with smart reminder toggles
- [ ] **T-1710** Builder's calendar view on dashboard (today's events widget)
- [ ] **T-1711** Tests: event rendering, CRUD operations, reminder triggers

## Phase 18: 🔄 Automation & Productivity Tools

Reduce repetitive work for agents.

- [ ] **T-1801** Build communication log templates — agent creates a template ("Initial follow-up", "Viewing confirmation", "Thank you") and applies it to a lead with one tap
- [ ] **T-1802** Quick-log SMS/Viber/WhatsApp communication from template (type + prepopulated note)
- [ ] **T-1803** Build email templates — create templated emails (HTML), send via mailto: link with pre-filled body
- [ ] **T-1804** Build reusable checklists system — broker creates checklist templates (e.g. "New Listing Intake", "Deal Closing Checklist"), agents apply to specific items
- [ ] **T-1805** Checklist progress tracking per lead/listing/deal (checked items %, auto-advance logic)
- [ ] **T-1806** Build referral tracking — log referral source (existing client, other agent, partner), auto-assign referral fee when deal closes
- [ ] **T-1807** Referral dashboard for broker (see all referrals, conversion rate, referral fees paid)
- [ ] **T-1808** Build automated lead assignment — broker sets rules (round-robin, by property type specialty, by location) → system assigns new leads automatically
- [ ] **T-1809** Build activity feed widget (real-time stream of all team actions: "John moved lead to Negotiating", "Maria uploaded docs for Deal #42")
- [ ] **T-1810** Tests: template application, checklist progress, referral tracking flow

## Phase 19: 🧩 Platform Enhancements

Cross-cutting features that improve the entire app.

- [ ] **T-1901** Multi-office/branch support — add `officeId`, `officeName` to User doc, broker creates offices, agents assigned to office
- [ ] **T-1902** Office-level dashboard — broker sees metrics per office
- [ ] **T-1903** Keyboard shortcuts — global shortcuts: `G + D` = go to dashboard, `G + L` = leads, `G + N` = new lead, `?` = shortcuts help modal
- [ ] **T-1904** Dark mode polish — ensure all components respect dark theme, add system preference detection
- [ ] **T-1905** Build onboarding tooltips — guided tour for new users on first login
- [ ] **T-1906** Build notification preferences page (per-type toggles: email push, in-app, SMS)
- [ ] **T-1907** Add loading skeletons to all pages (ShadCN Skeleton component)
- [ ] **T-1908** Add error states to all data views (retry button, fallback message)
- [ ] **T-1909** Tests: keyboard shortcuts, dark mode, notification preferences

## Future / v2 (Backlog)

- [ ] **v2-001** React Native mobile app (iOS + Android)
- [ ] **v2-002** Offline-first mode (PWA or local-first sync)
- [ ] **v2-004** Facebook Marketplace auto-posting (Graph API)
- [ ] **v2-005** AI lead scoring & recommendations
- [ ] **v2-007** Payment gateway integration (GCash/Maya via PayMongo)
- [ ] **v2-008** Public listing website (SEO-optimized, separate Firebase site)
- [ ] **v2-009** Multi-brokerage support (cross-broker collaboration)
- [ ] **v2-010** Rent vs. Buy comparison calculator
