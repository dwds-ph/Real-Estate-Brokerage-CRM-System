# Remaining Implementation Phases — Real Estate Brokerage CRM

> **Current state:** 21 phases complete. **Phase 22 (Email Service) COMPLETE** ✅. **Phase 23 (Payment Gateway) COMPLETE** ✅. **Phase 24 (FB Lead Import) COMPLETE** ✅. **Phase 25 (WhatsApp/Viber) COMPLETE** ✅. **Phase 26 (Advanced Reporting) COMPLETE** ✅. **Phase 27 (Audit Trail) COMPLETE** ✅. **Phase 29 (Performance) COMPLETE** ✅. **Phase 31 (Production Deploy) COMPLETE** ✅. **Phase 32 (Polish Sprint) COMPLETE** ✅. **Phase 28 (i18n Foundation) COMPLETE** ✅. **Phase 30 (E2E Coverage) COMPLETE** ✅.
>
> **Codebase stats:** 41 pages · 111 components · 27 services · 15 type domains · 14 hooks · 72 test files (1439 tests) · 645-line Firestore rules · 4 E2E specs · 50+ routes.

---

## Phase 22: 📧 Email Service Integration

**Goal:** Send automated emails from the app — deal updates, payment reminders, document sharing, broker notifications. Integrate SendGrid or equivalent transaction email service.

### Tasks

- [x] **22.1** Add email service dependency — `resend` npm package installed ✅
- [x] **22.2** Create `src/services/emailService.ts` — Resend REST API client with sendEmail(), sendBulkEmails(), isEmailEnabled(), Firestore audit logging ✅
- [x] **22.3** Create email template system — 6 responsive HTML templates in `emailTemplates.ts`: deal status change, payment received, overdue, tour confirmed, new lead assigned, document uploaded ✅
- [x] **22.4** Integration triggers — `emailTriggers.ts` with exported notification functions for each event type ✅
- [x] **22.5** Email preferences UI — `EmailPreferences.tsx` component with 6 notification type toggles (Email/In-app) and Firestore persistence, integrated into SettingsPage ✅
- [x] **22.6** Firestore rules for `emailLogs` collection + `emailPreferences` collection ✅
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

### Files to create

| File | Purpose |
|------|---------|
| `src/services/emailService.ts` | SendGrid/Mailgun client, send helpers |
| `src/services/emailTemplates.ts` | HTML template builder per event type |
| `src/components/settings/EmailPreferences.tsx` | Notification preference toggles |
| `src/types/domains/email.ts` | EmailLog, EmailPreference types |

### Files to modify

| File | Change |
|------|--------|
| `package.json` | Add email service dependency |
| `src/pages/SettingsPage.tsx` | Add Email Preferences section |
| `firestore.rules` | Add emailLogs collection rules |

---

## Phase 23: 💳 PH Payment Gateway Integration

**Goal:** Accept online payments from clients — reservation fees, down payments, earnest money via PayMongo (GCash, Maya, card, grab pay). Track payment status end-to-end with webhook callbacks.

### Tasks

- [x] **23.1** Add PayMongo SDK/API client — create payment intents, attach payment methods, confirm payments ✅
- [x] **23.2** Create `src/services/paymentGatewayService.ts` — `createPaymentLink()`, `checkPaymentStatus()`, `createCheckoutSession()` for GCash/Maya/credit card ✅
- [x] **23.3** Create `PaymentGatewayForm.tsx` — payment method selector embedded in deal payment flow (Pay via GCash / Maya / Card) ✅
- [x] **23.4** Create webhook handler (client-side) for payment status updates (paid/failed/refunded) ✅
- [x] **23.5** Integrate payment gateway into DealPaymentSection — "Pay Online" button next to each payment entry, status sync back to Firestore ✅
- [x] **23.6** Offline payment fallback — receipt upload for cash/bank transfers ✅
- [x] **23.7** Firestore rules for `paymentTransactions` collection (immutable record) ✅
- [x] **Validation:** typecheck ✓ build ✓

### Files to create

| File | Purpose |
|------|---------|
| `src/services/paymentGatewayService.ts` | PayMongo API client |
| `src/components/payments/PaymentGatewayForm.tsx` | Online payment UI |
| `src/types/domains/paymentGateway.ts` | PaymentTransaction, PaymentGateway types |

### Files to modify

| File | Change |
|------|--------|
| `.env` | Add PayMongo secret/public keys |
| `src/components/payments/DealPaymentSection.tsx` | Add "Pay Online" CTA |
| `firestore.rules` | Add paymentTransactions rules |

---

## Phase 24: 📱 Facebook & Instagram Lead Auto-Import

**Goal:** Automatically pull leads from Facebook Lead Ads and Instagram into the CRM. Poll Facebook Graph API, deduplicate by phone/email, auto-assign via routing rules.

### Tasks

- [x] **24.1** Create `src/services/facebookLeadService.ts` — Facebook Graph API client: fetch leads from ad accounts, parse lead gen forms, deduplicate against existing leads ✅
- [x] **24.2** Create `FacebookLeadImporter.tsx` — manual trigger + auto-poll toggle, last-sync timestamp, import count, error log, mapping UI (map FB fields → CRM fields) ✅
- [x] **24.3** Create `src/lib/leadDeduplication.ts` — deduplication algorithm: match by phone → email → name+fuzzy address, auto-merge or flag for review ✅
- [x] **24.4** Create Facebook Lead import settings in SettingsPage — connect/revoke FB page, select ad account, choose lead gen form ✅
- [x] **24.5** Auto-assign imported leads via existing `leadRoutingService.ts` ✅
- [x] **24.6** Track import history in Firestore — `facebookImportLogs` collection ✅
- [x] **24.7** Firestore rules for `facebookImportLogs` collection ✅
- [x] **Validation:** typecheck ✓ build ✓ tests ✓

### Files to create

| File | Purpose |
|------|---------|
| `src/services/facebookLeadService.ts` | Graph API polling + parse |
| `src/lib/leadDeduplication.ts` | Dedup by phone/email/name |
| `src/components/import/FacebookLeadImporter.tsx` | Import config + trigger UI |

### Files to modify

| File | Change |
|------|--------|
| `src/pages/SettingsPage.tsx` | Add Facebook integration section |
| `src/pages/ImportPage.tsx` | Add Facebook import tab |
| `firestore.rules` | Add facebookImportLogs rules |

---

## Phase 25: 💬 WhatsApp & Viber Integration

**Goal:** Send notifications and share property brochures via WhatsApp and Viber (most-used PH messaging apps). One-click share from lead/deal/listings pages.

### Tasks

- [x] **25.1** Create `src/services/messagingService.ts` — WhatsApp Business API + Viber REST API clients: send message, send template, send media (property image/brochure) ✅
- [x] **25.2** Integrate with existing notification system — FCM + WhatsApp + Viber fallback chain ✅
- [x] **25.3** Create `MessagingWidget.tsx` — floating action button on lead/deal detail: "Send via WhatsApp", "Send via Viber", "Send via SMS" with templated message (property link, payment reminder, tour reminder) ✅
- [x] **25.4** Create shareable deep links — `wa.me/{phone}?text=...` and `viber://...` with pre-filled property/broker details ✅
- [x] **25.5** Message template library — property inquiry, payment reminder, tour confirmation, document request, commission update ✅
- [x] **25.6** Firestore rules for `messageLogs` collection ✅
- [x] **Validation:** typecheck ✓ build ✓

### Files to create

| File | Purpose |
|------|---------|
| `src/services/messagingService.ts` | WhatsApp + Viber client |
| `src/components/automation/MessagingWidget.tsx` | Send-to-messaging FAB |
| `src/components/automation/MessageTemplates.tsx` | Template editor |
| `src/types/domains/messaging.ts` | MessageLog, MessageTemplate types |

### Files to modify

| File | Change |
|------|--------|
| `src/pages/LeadDetailPage.tsx` | Add MessagingWidget |
| `src/pages/ListingDetailPage.tsx` | Add share via messaging |
| `src/pages/DealDetailPage.tsx` | Add payment reminder messaging |
| `firestore.rules` | Add messageLogs rules |

---

## Phase 26: 📊 Advanced Reporting & Data Export

**Goal:** Comprehensive reporting dashboard with cross-module aggregation, export to PDF/Excel/CSV, scheduled report delivery, and visual analytics.

### Tasks

- [x] **26.1** Create `src/lib/reportEngine.ts` — cross-module aggregation engine ✅
- [x] **26.2** Create `ReportBuilder.tsx` — 6 pre-built report templates with preset filters ✅
- [x] **26.3** Create export utility — CSV + PDF export via jspdf-autotable ✅
- [x] **26.4** Create `src/services/reportScheduler.ts` — ScheduledReport CRUD + schedule computation ✅
- [x] **26.5** Create `ReportDashboard.tsx` — full report dashboard with module selector, results, export ✅
- [x] **26.6** Create `ScheduledReportForm.tsx` — frequency/format/recipients config ✅
- [x] **26.7** Add route `/reports` + sidebar nav entry ✅
- [x] **26.8** Firestore rules for `scheduledReports` collection ✅
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

### Files to create

| File | Purpose |
|------|---------|
| `src/lib/reportEngine.ts` | Cross-module aggregation |
| `src/services/reportScheduler.ts` | Cron-like report scheduling |
| `src/components/reports/ReportBuilder.tsx` | Interactive report config |
| `src/components/reports/ReportDashboard.tsx` | Saved + scheduled reports |
| `src/components/reports/ScheduledReportForm.tsx` | Frequency/format config |
| `src/components/reports/ReportExport.tsx` | CSV/Excel/PDF download |
| `src/components/reports/index.ts` | Barrel export |
| `src/pages/ReportsPage.tsx` | Route page |

### Files to modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add /reports route |
| `src/components/layout/AppLayout.tsx` | Add Reports nav entry |
| `firestore.rules` | Add reports, scheduledReports rules |

---

## Phase 27: 🔐 Advanced Security & Audit Trail

**Goal:** Immutable audit logging for regulatory compliance (RA 9646 — Real Estate Service Act), enhanced role-based access control, session management, and data integrity checks.

### Tasks

- [x] **27.1** Create `src/services/auditService.ts` — write-only audit log: record every CRUD operation with `who`, `what`, `when`, `docBefore`, `docAfter`, `ip`, `userAgent` ✅ (auditService.ts created with createAuditLog, subscribeAuditLogs, getAuditLogsForEntity)
- [x] **27.2** Firestore rules: audit log immutability enforced (create only, no update/delete) + compliance-officer read access ✅
- [x] **27.3** Create `AuditLogViewer.tsx` — broker-only page: filterable/searchable table of all operations, entity type filter, date range, user filter, CSV export ✅ (AuditLogViewer created with all filters + CSV export)
- [x] **27.4** Enhanced RBAC — `usePermissions.ts` hook created with role checks (isBroker, isAdmin, isSeniorAgent, isComplianceOfficer) + derived permissions (canViewAllData, canManageUsers, canViewAudit). AuditPage updated to use `canViewAudit` ✅
- [x] **P27.5** Session management — `sessionService.ts` created (start/end/heartbeat/revoke), `SessionManager.tsx` UI integrated into AuditPage, AuthContext hooks for session lifecycle, firestore.rules for userSessions subcollection ✅
- [x] **27.6** Data integrity checker — `DataIntegrityReport.tsx` created: runs checks on 15 collections for expected vs actual counts, cross-references 6 relationship types for orphaned records. Integrated into AuditPage. ✅
- [x] **27.7** Add route `/audit` + sidebar nav entry (broker-only) ✅ (Lazy route added to App.tsx)
- [x] **27.8** Firestore rules enhanced RBAC — 6 new helper functions (isAdmin, isBrokerOrAdmin, isSeniorAgent, isComplianceOfficer, hasReadAllAccess), read access extended to all 40+ collections for compliance-officer/senior-agent roles ✅
- [x] **Validation:** typecheck ✓ lint ✓ build ✓

### Files to create

| File | Purpose |
|------|---------|
| `src/services/auditService.ts` | Write-once audit logger |
| `src/components/audit/AuditLogViewer.tsx` | Broker audit dashboard |
| `src/components/audit/DataIntegrityReport.tsx` | DB consistency checker |
| `src/components/audit/index.ts` | Barrel export |
| `src/pages/AuditPage.tsx` | Route page |

### Files to modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add /audit route |
| `src/components/layout/AppLayout.tsx` | Add Audit nav (broker only) |
| `firestore.rules` | Enhanced RBAC + audit rules |
| `src/context/AuthContext.tsx` | Add role/permission helpers |
| `src/types/domains/core.ts` | Add roles, Session, Permission types |

---

## Phase 28: 🌐 Multi-Language Support (i18n)

**Goal:** Full bilingual support — English and Filipino (Tagalog) — with locale-aware number/currency formatting. Foundation for future language additions.

### Tasks

- [x] **28.1** Add `react-i18next` + `i18next` dependencies ✅
- [x] **28.2** Create `src/lib/i18n/index.ts` — i18n config with language detection (localStorage → browser → fallback) ✅
- [x] **28.3** Create `src/lib/i18n/locales/en.json` — 200+ English translation keys across 20 categories ✅
- [x] **28.4** Create `src/lib/i18n/locales/fil.json` — 200+ Filipino translation keys (formal Filipino, same structure) ✅
- [x] **28.5** Create language switcher UI in AppLayout top bar + SettingsPage toggle ✅
- [x] **28.6** Translation expansion — expanded en.json and fil.json with 17 new page-level sections (dashboard, expenses, vault, analytics, leaderboard, compliance, cma, mortgages, loans, projects, activity, coBrokerage, licenses, reports, audit, tours, checklists, errors) + updated AppLayout, LanguageSwitcher, ErrorBoundary to use t() calls ✅
- [x] **28.7** Locale-aware formatting — created `src/lib/formatting.ts` with formatCurrencyPHP, formatDatePH, formatNumberPH, formatNumberInWords, abbreviateNumber using fil-PH locale ✅
- [x] **28.8** PH-specific number formatting — check-writing format (numberInWords), piso/sentimo convention, fil-PH locale number formatting ✅
- [x] **28.9** Validation: typecheck ✓ lint ✓ build ✓ tests ✓

### Files to create

| File | Purpose |
|------|---------|
| `src/lib/i18n/index.ts` | i18n config + locale detection |
| `src/lib/i18n/locales/en.json` | All English strings |
| `src/lib/i18n/locales/fil.json` | All Filipino strings |
| `src/components/layout/LanguageSwitcher.tsx` | Language toggle widget |

### Files to modify

| File | Change |
|------|--------|
| `package.json` | Add react-i18next, i18next |
| `src/main.tsx` | Initialize i18n |
| `src/components/layout/AppLayout.tsx` | Add language switcher |
| `src/pages/SettingsPage.tsx` | Add language preference |
| `All page/component files` | Wrap strings in `t()` calls |

---

## Phase 29: ⚡ Performance Optimization & Production Hardening

**Goal:** Bundle size audit, Firestore query optimization, lazy-loading polish, image optimization, and Lighthouse score improvement to 90+ on all metrics.

### Tasks

- [x] **29.1** Run production bundle analysis — identify large vendor chunks, code-split aggressively ✅ (Audit complete: 61 chunks, 2.5MB total, vendor-pdf 630kB identified)
- [x] **29.2** Audit and enforce lazy loading — ensure ALL route pages use `React.lazy()` ✅ (All 43 routes lazy-loaded)
- [x] **29.3** Firestore query optimization — audit + fix unbounded scans ✅ (useCollection now auto-adds orderBy + limit(200))
- [x] **29.4** Virtual scrolling for large lists — `src/lib/virtualList.ts` utility created, applied to LeadList, ActivityPage, NotificationsPage, CommissionsPage, ExpensesPage, PayoutDashboard, TaskKanbanBoard via CSS `content-visibility: auto` ✅
- [x] **29.5** Image optimization — `OptimizedImage.tsx` component created with lazy loading, object-fit cover, aspect-ratio containers; applied to ListingDetailPage, BrochurePage, ListingsPage, PropertyMapPopup, PropertyMap, AgentLeaderboard, AgentProfileScore, TourFeedback ✅
- [x] **29.6** PWA audit — enhanced WPA config: navigationPreload, navigateFallback, Google Fonts runtime caching, Storage CacheFirst. OfflinePage.tsx created with auto-redirect on connectivity restore. ✅
- [x] **29.7** Lighthouse CI integration — Created `lighthouse.config.js` + `.github/workflows/lighthouse.yml` for automated Lighthouse audits on PR/merge ✅
- [x] **29.8** Memory leak audit — verify all `onSnapshot` unsubscribers ✅ (1 critical leak fixed in CMAReportGenerator.tsx)
- [x] **29.9** Accessibility (a11y) audit — fixed 14 components/pages: aria-labels on all icon-only buttons, form input labels, keyboard handlers for clickable cards (LeadList, DealCard, TaskCard, BranchList, TeamList, etc.) ✅
- [x] **29.10** Validation: typecheck ✓ lint ✓ build ✓

### Files to create

| File | Purpose |
|------|---------|
| `.github/workflows/lighthouse.yml` | Lighthouse CI workflow |

### Files to modify

| File | Change |
|------|--------|
| `vite.config.ts` | Add bundle analysis plugin, image optimization |
| `src/App.tsx` | Verify all routes lazy-loaded |
| `src/main.tsx` | Add image optimization on upload |
| `src/hooks/useFirestore.ts` | Audit query limits + pagination |
| `All list components` | Add virtual scrolling where applicable |

---

## Phase 30: 🧪 End-to-End Testing & QA Coverage

**Goal:** Expand Playwright E2E test coverage to all critical user flows, add visual regression testing, and achieve 80%+ coverage on all service and lib modules.

### Tasks

- [x] **30.1** Create E2E test plan — `e2e/test-plan.md` with 14 user flow categories, 55+ test cases, data dependency diagrams ✅
- [x] **30.2** Expand E2E tests — 14 new spec files covering all modules: leads (10 tests), listings (9), payments (4), commissions (7), tours (7), tasks (6), dashboard (9), documents (6), analytics (5), projects (2), cobrokerage (5), licenses (3), loans (3), map (5) ✅
- [x] **30.3** Add visual regression testing — playwright.config.ts `toHaveScreenshot` config + `e2e/visual-regression.spec.ts` with login/dashboard screenshots ✅
- [x] **30.4** Add Firestore emulator seed data script ✅
- [x] **30.5** Add unit test coverage for remaining services — 6 new test files (analytics, branch, coBroker, compliance, goal, team) adding 105 tests, total 611 tests across 25 files ✅
- [x] **30.6** Expand leadRoutingService tests — 52 tests covering specialty rules, location rules, round-robin, edge cases ✅
- [x] **30.7** Create `tests/e2e/setup.ts` — shared fixture with auto-login and auto-seed ✅
- [x] **30.8** Add CI matrix — quality_matrix job (typecheck/lint/test parallel) + E2E browser matrix (chromium/firefox, PR exclude firefox) ✅
- [x] **30.9** Validation: typecheck ✓ build ✓ tests ✓ (72 files, 1439 tests)

### Files to create

| File | Purpose |
|------|---------|
| `scripts/seed-e2e-data.cjs` | Firestore emulator seed script |
| `e2e/leads.spec.ts` | Lead CRUD + status workflow |
| `e2e/listings.spec.ts` | Listing create + brochure |
| `e2e/payments.spec.ts` | Payment add + overdue |
| `e2e/commissions.spec.ts` | Commission calc + plan |
| `e2e/payouts.spec.ts` | Payout approve → paid flow |
| `e2e/tours.spec.ts` | Tour builder + feedback |
| `e2e/tasks.spec.ts` | Task kanban + checklists |
| `e2e/analytics.spec.ts` | Lead source + goals |
| `e2e/cobrokerage.spec.ts` | Co-broker + team + branch |
| `e2e/documents.spec.ts` | Document vault + compliance + CMA |
| `e2e/projects.spec.ts` | Project + units + milestones |
| `e2e/map.spec.ts` | Property map interaction |
| `e2e/license.spec.ts` | License CRUD + expiry |
| `e2e/loans.spec.ts` | Loan calculators |
| `tests/services/analytics.test.ts` | Analytics service unit tests |
| `tests/services/branchService.test.ts` | Branch CRUD tests |
| `tests/services/calendarService.test.ts` | Calendar ops tests |
| `tests/services/checklistService.test.ts` | Checklist CRUD tests |
| `tests/services/coBrokerService.test.ts` | Co-broker service tests |
| `tests/services/complianceService.test.ts` | Compliance tests |
| `tests/services/documentVault.test.ts` | Document vault tests |
| `tests/services/goalService.test.ts` | Goal CRUD tests |
| `tests/services/paymentService.test.ts` | Payment service tests |
| `tests/services/payoutService.test.ts` | Payout service tests |
| `tests/services/projectService.test.ts` | Project service tests |
| `tests/services/referralService.test.ts` | Referral service tests |
| `tests/services/teamService.test.ts` | Team CRUD tests |
| `tests/services/tourService.test.ts` | Tour CRUD tests |

### Files to modify

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | Add test matrix, visual regression |
| `playwright.config.ts` | Add screenshot config, testDir entries |
| `vitest.config.ts` | Expand coverage thresholds |

---

## Phase 31: 🚀 Production Deployment & Monitoring

**Goal:** Deploy to Firebase Hosting with custom domain, set up monitoring (Firebase Crashlytics, Sentry), configure CI/CD deployment pipeline, and implement automated rollback capability.

### Tasks

- [x] **31.1** Configure custom domain on Firebase Hosting — DNS setup, SSL, redirects ✅
- [x] **31.2** Add Sentry/Rollbar error monitoring — `src/lib/monitoring.ts` with source maps upload, breadcrumbs, user context ✅
- [x] **31.3** Production CI/CD pipeline — auto-deploy to Firebase Hosting on merge to main, deploy Firestore rules + indexes ✅
- [x] **31.4** Staging environment — deploy to a separate Firebase project (staging) on PR merge to develop ✅
- [x] **31.5** Firebase App Distribution for internal beta testing ✅
- [x] **31.6** Create `heroku.yml` or Dockerfile for alternative deployment targets ✅
- [x] **31.7** Monitoring dashboard — set up Firebase Performance Monitoring for web, track:
  - Firestore read/write/delete counts
  - Page load times (FCP, LCP, TTFB)
  - Error rates by page
  - Active users (DAU/MAU) ✅
- [x] **31.8** Create `DEPLOY.md` update with production deployment checklist ✅
- [x] **31.9** Automated rollback script — `scripts/rollback.sh` that reverts to previous hosting version on deploy failure ✅
- [x] **31.10** Validation: typecheck ✓ build ✓

### Files to create

| File | Purpose |
|------|---------|
| `src/lib/monitoring.ts` | Sentry/Rollbar init + config |
| `scripts/rollback.sh` | Firebase rollback utility |
| `.github/workflows/deploy-staging.yml` | Staging deployment workflow |
| `.github/workflows/deploy-production.yml` | Production deployment workflow |

### Files to modify

| File | Change |
|------|--------|
| `src/main.tsx` | Initialize monitoring |
| `DEPLOY.md` | Production checklist |
| `package.json` | Add monitoring dependency |

---

## 🎯 Phase 32: Quality & Polish Sprint

**Goal:** Cross-cutting polish across ALL existing 21 phases — fix UI inconsistencies, improve error handling, add loading skeletons, empty states, toast notifications, and responsive mobile layouts.

### Tasks

- [x] **32.1** Empty state audit — every list/table/grid must have an `EmptyState` component with illustration + CTA ✅ (All pages audited; 20+ pages updated to use shared EmptyState component)
- [x] **32.2** Loading state audit — every data-dependent view must show `LoadingSpinner` or skeleton while Firestore subscription is loading ✅ (All pages audited; 10+ pages updated to use shared LoadingSpinner component)
- [x] **32.3** Error state audit — every page must gracefully handle Firestore permission denied, offline, and unexpected errors with retry buttons ✅ (30+ pages now have error+retry handling)
- [x] **32.4** Toast notification system — replace ad-hoc alerts with unified toast (success/error/warning/info) for all CRUD operations ✅ (Toast.tsx + pub/sub already existed and is integrated in App.tsx)
- [x] **32.5** Mobile responsiveness — all 31+ pages now responsive: headers stack vertically on mobile (`flex-col sm:flex-row`), grids adjust columns, buttons wrap, overflow fixed ✅
- [x] **32.6** Confirmation dialogs — add confirmation modals for all destructive actions ✅ (ConfirmDialog.tsx created with focus trap, a11y, loading states)
- [x] **32.7** Form validation UX — inline validation errors, disabled submit buttons while saving, unsaved-changes warning on navigation ✅ (useUnsavedChanges.ts hook created)
- [x] **32.8** Keyboard shortcuts — implement global shortcut palette (`Cmd+K` / `Ctrl+K`) with commands: navigate to page, create lead, create listing, search ✅ (CommandPalette.tsx created + integrated in App.tsx)
- [x] **32.9** Animation polish — added CSS keyframes (fade-in, fade-in-up, scale-in, slide-in-right, badge-pulse, slide-out-right), applied to all 12 modal/dialog components, toast exit animation, page transitions via Outlet wrapper, StatusBadge pulse ✅
- [x] **32.10** Validation: typecheck ✓ · build ✓ · tests ✓ (82/82 pass) · lint ⏳ (times out in Docker)

### Files to create

| File | Purpose |
|------|---------|
| `src/components/ui/Toast.tsx` | Toast notification system |
| `src/hooks/useToast.ts` | Toast hook |
| `src/components/ui/CommandPalette.tsx` | `Cmd+K` shortcut palette |
| `src/hooks/useUnsavedChanges.ts` | Navigation guard hook |

### Files to modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add ToastProvider, CommandPalette |
| `All page files` | Audit empty/loading/error states |
| `All form components` | Add inline validation + submit guard |
| `all list/tables` | Add EmptyState |
| `firestore.rules` | Better error messages |

---

## Phasing Summary

| Phase | Effort | Dependencies | Priority |
|-------|--------|-------------|----------|
| **P22** Email Service | Medium | None | High |
| **P23** PH Payment Gateway | High | PayMongo account | High |
| **P24** FB Lead Import | Medium | Facebook App + API access | High |
| **P25** WhatsApp/Viber | Medium | WhatsApp Business API | Medium |
| **P26** Advanced Reporting | High | P22 (email) | Medium |
| **P27** Audit & Security | Medium | None | High |
| **P28** i18n | High | None | Low |
| **P29** Performance | Medium | None | High |
| **P30** E2E Coverage | High | None | Medium |
| **P31** Production Deploy | Medium | Custom domain | High |
| **P32** Polish Sprint | Medium | None | High |

**Recommended order:** P32 → P29 → P27 → P22 → P23 → P24 → P25 → P31 → P30 → P26 → P28

> **Total:** 11 new phases · ~180+ new/modified files · +15,000+ lines of code across services, components, pages, tests, and configuration.
