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

## Remaining Phases (not yet implemented)

- **Phase 6:** 🆔 License Expiry Tracker
- **Phase 7:** 📊 Market Report Generator
- **Phase 8:** 🏗️ Project / Subdivision Management
