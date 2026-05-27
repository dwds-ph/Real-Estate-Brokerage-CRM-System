# Refactoring Tasks

> Checklist-based refactoring plan derived from `refactor_rules.md`.
> Each file is audited against the rules and marked for extraction/cleanup.

---

## Phase 1: Component Abstraction (Large Files)

### Guidelines Applied
- [ ] Pages > 250 lines → extract sections into sub-components
- [ ] Components > 200 lines → extract sub-sections
- [ ] Inline modals/dialogs → extract to dedicated `*Modal.tsx`
- [ ] Repeated JSX blocks → extract to reusable component
- [ ] Tables with sorting/filtering → extract to generic `<DataTable>`

### Checklist

- [ ] **`src/pages/LeadsPage.tsx`** (434 lines)
  - [ ] Extract lead form to `src/components/leads/LeadForm.tsx`
  - [ ] Extract lead list/cards to `src/components/leads/LeadList.tsx`
  - [ ] Extract filter chips + search bar to `src/components/leads/LeadFilters.tsx`
  - [ ] Extract status count badges to `src/components/leads/StatusBadge.tsx`
  - [ ] Create `useLeadsPage()` hook for state logic

- [ ] **`src/pages/VaultPage.tsx`** (~550 lines)
  - [ ] Extract tab navigation to `src/components/documents/DocumentTabs.tsx`
  - [ ] Extract document detail panel to `src/components/documents/DocumentDetail.tsx`
  - [ ] Extract expiring banner to `src/components/documents/ExpiryBanner.tsx`
  - [ ] Create `useVaultPage()` hook for tab/selection state

- [ ] **`src/pages/DealsPage.tsx`** (~400 lines)
  - [ ] Extract Kanban board to `src/components/deals/DealKanban.tsx`
  - [ ] Extract deal card to `src/components/deals/DealCard.tsx`
  - [ ] Extract mortgage section to `src/components/deals/DealMortgageSection.tsx`
  - [ ] Extract referral section to `src/components/deals/DealReferralSection.tsx`

- [ ] **`src/pages/PhToolsPage.tsx`** (365 lines)
  - [ ] Extract `PagIbigCalculator` → `src/components/ph-tools/PagIbigCalculator.tsx`
  - [ ] Extract `BankCalculator` → `src/components/ph-tools/BankCalculator.tsx`
  - [ ] Extract `TitleStatusTracker` → `src/components/ph-tools/TitleStatusTracker.tsx`
  - [ ] Create `src/components/ph-tools/index.ts` barrel export

- [ ] **`src/components/map/PropertyMap.tsx`** (~680 lines)
  - [ ] Extract marker rendering to `src/components/map/MapMarker.tsx`
  - [ ] Extract popup content to `src/components/map/MapPopup.tsx`
  - [ ] Extract filter panel to `src/components/map/MapFilters.tsx`
  - [ ] Extract POI overlay to `src/components/map/PoiOverlay.tsx`
  - [ ] Extract clustering logic to `src/components/map/useMapClustering.ts` hook

- [ ] **`src/components/documents/DocumentUpload.tsx`** (~350 lines)
  - [ ] Extract file picker section to `src/components/documents/FilePicker.tsx`
  - [ ] Extract metadata form (category, deal linkage, expiry) to `src/components/documents/DocumentMetadataForm.tsx`
  - [ ] Extract progress bar to `src/components/documents/UploadProgress.tsx`

---

## Phase 2: Prop Interface Standardization

- [ ] Audit all components for inline prop types → extract to exported `interface XxxProps`
- [ ] Convert `type XxxProps = { ... }` → `interface XxxProps { ... }` where applicable
- [ ] Add `onXxx` naming for callback props (e.g., `onSave` not `saveHandler`)
- [ ] Add `is`/`has` prefix for boolean props (e.g., `isLoading` not `loading`)

### Files to audit:
- [ ] `src/components/calendar/QuickCreate.tsx`
- [ ] `src/components/calendar/SmartReminders.tsx`
- [ ] `src/components/automation/ActivityFeed.tsx`
- [ ] `src/components/automation/ChecklistWidget.tsx`
- [ ] `src/components/automation/QuickLog.tsx`
- [ ] `src/components/analytics/ConversionFunnel.tsx`
- [ ] `src/components/analytics/AgentPerformanceBoard.tsx`
- [ ] `src/components/mortgage/MortgageTracker.tsx`

---

## Phase 3: Import Organization

- [ ] Audit all files for import ordering (external → `@/` → local)
- [ ] Remove unused imports across all files
- [ ] Replace long relative imports (`../../components/`) with `@/` aliases
- [ ] Ensure no barrel imports for internal modules

### High-priority files:
- [ ] `src/pages/VaultPage.tsx`
- [ ] `src/pages/DealsPage.tsx`
- [ ] `src/pages/LeadsPage.tsx`
- [ ] `src/components/automation/LeadRoutingRules.tsx`
- [ ] `src/services/documentVault.ts`

---

## Phase 4: Type Cleanup

- [ ] Remove all `any` types — replace with `unknown` + narrowing or proper interfaces
- [ ] Remove unnecessary `as` casts — prefer type guards or generics
- [ ] Ensure all Firestore collection calls use proper generics (e.g., `useCollection<Lead>('leads')`)
- [ ] Add missing type exports for shared component props

### Known `any` locations:
- [ ] `src/components/analytics/SourceAnalytics.tsx` — recharts formatter
- [ ] `src/components/automation/ActivityFeed.tsx` — find callback
- [ ] `src/pages/ActivityPage.tsx` — find callback
- [ ] `src/components/analytics/ExpenseVsCommission.tsx` — recharts tooltip

---

## Phase 5: Service Layer Extraction

- [ ] Move complex query logic from pages to service files
- [ ] Ensure all Firestore writes go through `src/services/` not inline in components
- [ ] Add `.test.ts` files for any service missing them

### Services needing tests:
- [ ] `src/services/calendarService.ts`
- [ ] `src/services/checklistService.ts`
- [ ] `src/services/commTemplates.ts`
- [ ] `src/services/documentVault.ts`
- [ ] `src/services/geocoding.ts`
- [ ] `src/services/leadRoutingService.ts`
- [ ] `src/services/mortgageService.ts`
- [ ] `src/services/officeService.ts`
- [ ] `src/services/referralService.ts`

---

## Phase 6: Hook Extraction

- [ ] Extract complex page logic into `useXxxPage()` hooks
- [ ] Ensure hooks are under 100 lines — split if exceeded
- [ ] Add `.test.ts` files for all hooks

### Hooks to create:
- [ ] `src/hooks/useLeadsPage.ts` — form state, submit, edit, delete, filter logic
- [ ] `src/hooks/useVaultPage.ts` — tab state, document selection, expiring filter
- [ ] `src/hooks/useDealsPage.ts` — kanban drag-drop state, mortgage expanded state
- [ ] `src/hooks/useAnalyticsPage.ts` — tab state, date range, report data aggregation

### Hooks needing tests:
- [ ] `src/hooks/useFirestore.ts`
- [ ] `src/hooks/useKeyboardShortcuts.ts`

---

## Phase 7: Testing Coverage

- [ ] `src/services/calendarService.test.ts`
- [ ] `src/services/checklistService.test.ts`
- [ ] `src/services/commTemplates.test.ts`
- [ ] `src/services/documentVault.test.ts`
- [ ] `src/services/geocoding.test.ts`
- [ ] `src/services/leadRoutingService.test.ts`
- [ ] `src/services/mortgageService.test.ts`
- [ ] `src/services/officeService.test.ts`
- [ ] `src/services/referralService.test.ts`
- [ ] `src/hooks/useFirestore.test.ts`
- [ ] `src/components/analytics/ConversionFunnel.test.tsx`
- [ ] `src/components/calendar/UnifiedCalendar.test.tsx`
- [ ] `src/components/documents/DocumentList.test.tsx`

---

## File Inventory (85 source files)

### Pages (25)
- [ ] `src/pages/ActivityPage.tsx`
- [ ] `src/pages/AgentsPage.tsx`
- [ ] `src/pages/AnalyticsPage.tsx`
- [ ] `src/pages/BrochurePage.tsx`
- [ ] `src/pages/CalendarPage.tsx`
- [ ] `src/pages/ChecklistTemplatesPage.tsx`
- [ ] `src/pages/ClientPortalPage.tsx`
- [ ] `src/pages/CommissionsPage.tsx`
- [ ] `src/pages/DashboardPage.tsx`
- [ ] `src/pages/DealsPage.tsx`
- [ ] `src/pages/ExpensesPage.tsx`
- [ ] `src/pages/LeadDetailPage.tsx`
- [ ] `src/pages/LeadsPage.tsx`
- [ ] `src/pages/ListingDetailPage.tsx`
- [ ] `src/pages/ListingsPage.tsx`
- [ ] `src/pages/LoginPage.tsx`
- [ ] `src/pages/MortgagePage.tsx`
- [ ] `src/pages/NotificationPreferencesPage.tsx`
- [ ] `src/pages/NotificationsPage.tsx`
- [ ] `src/pages/OfficesPage.tsx`
- [ ] `src/pages/OnboardingPage.tsx`
- [ ] `src/pages/PhToolsPage.tsx`
- [ ] `src/pages/RemindersPage.tsx`
- [ ] `src/pages/SettingsPage.tsx`
- [ ] `src/pages/TasksPage.tsx`
- [ ] `src/pages/VaultPage.tsx`
- [ ] `src/pages/ViewingsPage.tsx`

### Components (30)
- [ ] `src/components/Analytics.tsx`
- [ ] `src/components/ErrorBoundary.tsx`
- [ ] `src/components/ErrorState.tsx`
- [ ] `src/components/OnboardingTooltip.tsx`
- [ ] `src/components/ShortcutsHelpModal.tsx`
- [ ] `src/components/Skeleton.tsx`
- [ ] `src/components/analytics/AgentPerformanceBoard.tsx`
- [ ] `src/components/analytics/ConversionFunnel.tsx`
- [ ] `src/components/analytics/DateRangePicker.tsx`
- [ ] `src/components/analytics/ExpenseVsCommission.tsx`
- [ ] `src/components/analytics/ListingPerformance.tsx`
- [ ] `src/components/analytics/SourceAnalytics.tsx`
- [ ] `src/components/auth/ProtectedRoute.tsx`
- [ ] `src/components/automation/ActivityFeed.tsx`
- [ ] `src/components/automation/ChecklistWidget.tsx`
- [ ] `src/components/automation/CommTemplateManager.tsx`
- [ ] `src/components/automation/LeadRoutingRules.tsx`
- [ ] `src/components/automation/QuickLog.tsx`
- [ ] `src/components/automation/ReferralDashboard.tsx`
- [ ] `src/components/automation/ReferralForm.tsx`
- [ ] `src/components/calendar/QuickCreate.tsx`
- [ ] `src/components/calendar/SmartReminders.tsx`
- [ ] `src/components/calendar/UnifiedCalendar.tsx`
- [ ] `src/components/documents/DocumentList.tsx`
- [ ] `src/components/documents/DocumentRequestModal.tsx`
- [ ] `src/components/documents/DocumentUpload.tsx`
- [ ] `src/components/layout/AppLayout.tsx`
- [ ] `src/components/map/PropertyMap.tsx`
- [ ] `src/components/mortgage/MortgageForm.tsx`
- [ ] `src/components/mortgage/MortgageTracker.tsx`
- [ ] `src/components/notifications/NotificationBell.tsx`

### Services (13)
- [ ] `src/services/calendarService.ts`
- [ ] `src/services/checklistService.ts`
- [ ] `src/services/commTemplates.ts`
- [ ] `src/services/documentVault.ts`
- [ ] `src/services/fcm.ts`
- [ ] `src/services/geocoding.ts`
- [ ] `src/services/leadRoutingService.ts`
- [ ] `src/services/mortgageService.ts`
- [ ] `src/services/notifications.test.ts`
- [ ] `src/services/notifications.ts`
- [ ] `src/services/officeService.ts`
- [ ] `src/services/referralService.ts`

### Hooks (3)
- [ ] `src/hooks/useFirestore.ts`
- [ ] `src/hooks/useKeyboardShortcuts.ts`
- [ ] `src/hooks/useKeyboardShortcuts.test.ts`

### Contexts (2)
- [ ] `src/context/AuthContext.tsx`
- [ ] `src/context/ThemeContext.tsx`

### Lib (7)
- [ ] `src/lib/commission.ts`
- [ ] `src/lib/commission.test.ts`
- [ ] `src/lib/firebase.ts`
- [ ] `src/lib/utils.ts`
- [ ] `src/lib/utils.test.ts`
- [ ] `src/lib/test-setup.ts`

### Other (5)
- [ ] `src/App.tsx`
- [ ] `src/main.tsx`
- [ ] `src/types/index.ts`
- [ ] `src/vite-env.d.ts`

---

*Total: 85 source files | Generated: Wed May 27 05:56:44 UTC 2026*
