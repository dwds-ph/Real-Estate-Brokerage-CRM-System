# Testing Tasks

> Checklist-based testing plan for the Real Estate Brokerage CRM.
> Test files live under `tests/` mirroring the `src/` structure.

---

## Testing Rules

### 1. Test Coverage Requirements

- **Services**: Every service file in `src/services/` MUST have a corresponding `.test.ts` in `tests/services/`.
- **Hooks**: Every hook in `src/hooks/` MUST have a corresponding `.test.ts` in `tests/hooks/`.
- **Components**: Complex components (30+ lines of logic, state management, or async behavior) SHOULD have `.test.tsx` files in `tests/components/<domain>/`.
- **Pages**: Critical user flows (login, lead creation, deal pipeline) SHOULD have integration tests in `tests/pages/`.
- **Utils/Pure functions**: Every utility function in `src/lib/` MUST have unit tests.

### 2. Testing Patterns

- **Framework**: Vitest (already configured in `vitest.config.ts` / `package.json`).
- **Structure**: Use `describe` / `it` blocks. No `test()` calls.
- **Naming**: `describe('{ModuleName}', () => { it('should ...', () => { ... }) })`.
- **File naming**: `{sourceFileName}.test.ts` or `.test.tsx`.
- **Placement**: All test files under `tests/` directory, mirroring `src/` path.
- **Import source**: Import from `@/` aliases (e.g., `import { formatCurrency } from '@/lib/utils'`).

### 3. What to Test

| Layer | What to test | Example |
|-------|-------------|---------|
| **Services** | CRUD operations, edge cases (null/empty inputs), error handling | `createLead()`, `deleteLead()` |
| **Hooks** | State transitions, return shape, side effects | `useCollection` data flow |
| **Components** | Rendering with different props, user interactions, loading/error/empty states | `<LeadCard>` renders name |
| **Utils** | Pure function outputs for given inputs, edge cases | `formatCurrency(0)`, `cn('a', false && 'b')` |
| **Pages (integration)** | Full user flow, navigation, data fetch → render | Login → Dashboard → Leads |

### 4. Test File Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { functionName } from '@/services/module';

describe('ModuleName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle basic case', () => {
    const result = functionName(input);
    expect(result).toEqual(expected);
  });

  it('should handle edge case (null/empty)', () => {
    const result = functionName(null);
    expect(result).toBeNull();
  });

  it('should handle error state', async () => {
    vi.spyOn(dependency, 'method').mockRejectedValue(new Error('fail'));
    await expect(functionName()).rejects.toThrow('fail');
  });
});
```

### 5. Component Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '@/components/domain/ComponentName';

describe('ComponentName', () => {
  it('renders with required props', () => {
    render(<ComponentName prop1="value" />);
    expect(screen.getByText('value')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ComponentName isLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<ComponentName data={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<ComponentName onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
```

---

## Existing Tests (4 files)

- [x] `src/lib/commission.test.ts` — ✅ exists
- [x] `src/lib/utils.test.ts` — ✅ exists
- [x] `src/services/notifications.test.ts` — ✅ exists
- [x] `src/hooks/useKeyboardShortcuts.test.ts` — ✅ exists

---

## Phase 1: Service Tests (9 needed)

- [ ] `tests/services/calendarService.test.ts`
- [ ] `tests/services/checklistService.test.ts`
- [ ] `tests/services/commTemplates.test.ts`
- [ ] `tests/services/documentVault.test.ts`
- [ ] `tests/services/fcm.test.ts`
- [ ] `tests/services/geocoding.test.ts`
- [ ] `tests/services/leadRoutingService.test.ts`
- [ ] `tests/services/mortgageService.test.ts`
- [ ] `tests/services/officeService.test.ts`
- [ ] `tests/services/referralService.test.ts`

## Phase 2: Hook Tests (2 needed)

- [ ] `tests/hooks/useFirestore.test.ts`

## Phase 3: Component Tests (priority)

- [ ] `tests/components/documents/DocumentList.test.tsx`
- [ ] `tests/components/documents/DocumentUpload.test.tsx`
- [ ] `tests/components/analytics/ConversionFunnel.test.tsx`
- [ ] `tests/components/analytics/AgentPerformanceBoard.test.tsx`
- [ ] `tests/components/calendar/UnifiedCalendar.test.tsx`
- [ ] `tests/components/calendar/SmartReminders.test.tsx`
- [ ] `tests/components/automation/ChecklistWidget.test.tsx`
- [ ] `tests/components/automation/ActivityFeed.test.tsx`
- [ ] `tests/components/automation/ReferralDashboard.test.tsx`
- [ ] `tests/components/mortgage/MortgageTracker.test.tsx`
- [ ] `tests/components/mortgage/MortgageForm.test.tsx`
- [ ] `tests/components/map/PropertyMap.test.tsx`
- [ ] `tests/components/notifications/NotificationBell.test.tsx`
- [ ] `tests/components/layout/AppLayout.test.tsx`
- [ ] `tests/components/auth/ProtectedRoute.test.tsx`

## Phase 4: Page Integration Tests (critical flows)

- [ ] `tests/pages/LoginPage.test.tsx`
- [ ] `tests/pages/LeadsPage.test.tsx`
- [ ] `tests/pages/DealsPage.test.tsx`
- [ ] `tests/pages/ListingsPage.test.tsx`
- [ ] `tests/pages/VaultPage.test.tsx`
- [ ] `tests/pages/AnalyticsPage.test.tsx`
- [ ] `tests/pages/CalendarPage.test.tsx`

## Phase 5: Utils / Lib Tests

- [ ] `tests/lib/firebase.test.ts`
- [ ] `tests/lib/test-setup.test.ts`

---

## File Inventory (85 source files)

### Services (11 — 9 need tests)
- [ ] `src/services/calendarService.ts` → `tests/services/calendarService.test.ts`
- [ ] `src/services/checklistService.ts` → `tests/services/checklistService.test.ts`
- [ ] `src/services/commTemplates.ts` → `tests/services/commTemplates.test.ts`
- [ ] `src/services/documentVault.ts` → `tests/services/documentVault.test.ts`
- [ ] `src/services/fcm.ts` → `tests/services/fcm.test.ts`
- [ ] `src/services/geocoding.ts` → `tests/services/geocoding.test.ts`
- [ ] `src/services/leadRoutingService.ts` → `tests/services/leadRoutingService.test.ts`
- [ ] `src/services/mortgageService.ts` → `tests/services/mortgageService.test.ts`
- [ ] `src/services/notifications.ts` → `tests/services/notifications.test.ts` ✅
- [ ] `src/services/officeService.ts` → `tests/services/officeService.test.ts`
- [ ] `src/services/referralService.ts` → `tests/services/referralService.test.ts`

### Hooks (2 — 1 needs tests)
- [ ] `src/hooks/useFirestore.ts` → `tests/hooks/useFirestore.test.ts`
- [ ] `src/hooks/useKeyboardShortcuts.ts` → `tests/hooks/useKeyboardShortcuts.test.ts` ✅

### Lib (4 — 2 have tests)
- [ ] `src/lib/commission.ts` → `tests/lib/commission.test.ts` ✅
- [ ] `src/lib/utils.ts` → `tests/lib/utils.test.ts` ✅
- [ ] `src/lib/firebase.ts` → `tests/lib/firebase.test.ts`
- [ ] `src/lib/test-setup.ts` → `tests/lib/test-setup.test.ts`

### Components (30 — select priority)
- [ ] `src/components/ErrorBoundary.tsx` → `tests/components/ErrorBoundary.test.tsx`
- [ ] `src/components/ErrorState.tsx` → `tests/components/ErrorState.test.tsx`
- [ ] `src/components/Skeleton.tsx` → `tests/components/Skeleton.test.tsx`
- [ ] `src/components/ShortcutsHelpModal.tsx` → `tests/components/ShortcutsHelpModal.test.tsx`
- [ ] `src/components/analytics/ConversionFunnel.tsx` → `tests/components/analytics/ConversionFunnel.test.tsx`
- [ ] `src/components/analytics/AgentPerformanceBoard.tsx` → `tests/components/analytics/AgentPerformanceBoard.test.tsx`
- [ ] `src/components/analytics/DateRangePicker.tsx` → `tests/components/analytics/DateRangePicker.test.tsx`
- [ ] `src/components/analytics/ExpenseVsCommission.tsx` → `tests/components/analytics/ExpenseVsCommission.test.tsx`
- [ ] `src/components/analytics/ListingPerformance.tsx` → `tests/components/analytics/ListingPerformance.test.tsx`
- [ ] `src/components/analytics/SourceAnalytics.tsx` → `tests/components/analytics/SourceAnalytics.test.tsx`
- [ ] `src/components/automation/ActivityFeed.tsx` → `tests/components/automation/ActivityFeed.test.tsx`
- [ ] `src/components/automation/ChecklistWidget.tsx` → `tests/components/automation/ChecklistWidget.test.tsx`
- [ ] `src/components/automation/CommTemplateManager.tsx` → `tests/components/automation/CommTemplateManager.test.tsx`
- [ ] `src/components/automation/LeadRoutingRules.tsx` → `tests/components/automation/LeadRoutingRules.test.tsx`
- [ ] `src/components/automation/QuickLog.tsx` → `tests/components/automation/QuickLog.test.tsx`
- [ ] `src/components/automation/ReferralDashboard.tsx` → `tests/components/automation/ReferralDashboard.test.tsx`
- [ ] `src/components/automation/ReferralForm.tsx` → `tests/components/automation/ReferralForm.test.tsx`
- [ ] `src/components/calendar/QuickCreate.tsx` → `tests/components/calendar/QuickCreate.test.tsx`
- [ ] `src/components/calendar/SmartReminders.tsx` → `tests/components/calendar/SmartReminders.test.tsx`
- [ ] `src/components/calendar/UnifiedCalendar.tsx` → `tests/components/calendar/UnifiedCalendar.test.tsx`
- [ ] `src/components/documents/DocumentList.tsx` → `tests/components/documents/DocumentList.test.tsx`
- [ ] `src/components/documents/DocumentRequestModal.tsx` → `tests/components/documents/DocumentRequestModal.test.tsx`
- [ ] `src/components/documents/DocumentUpload.tsx` → `tests/components/documents/DocumentUpload.test.tsx`
- [ ] `src/components/layout/AppLayout.tsx` → `tests/components/layout/AppLayout.test.tsx`
- [ ] `src/components/map/PropertyMap.tsx` → `tests/components/map/PropertyMap.test.tsx`
- [ ] `src/components/mortgage/MortgageForm.tsx` → `tests/components/mortgage/MortgageForm.test.tsx`
- [ ] `src/components/mortgage/MortgageTracker.tsx` → `tests/components/mortgage/MortgageTracker.test.tsx`
- [ ] `src/components/notifications/NotificationBell.tsx` → `tests/components/notifications/NotificationBell.test.tsx`
- [ ] `src/components/auth/ProtectedRoute.tsx` → `tests/components/auth/ProtectedRoute.test.tsx`
- [ ] `src/components/OnboardingTooltip.tsx` → `tests/components/OnboardingTooltip.test.tsx`

### Pages (integration — 25, select critical)

#### High Priority (core business flows)
- [ ] `tests/pages/LoginPage.test.tsx`
- [ ] `tests/pages/LeadsPage.test.tsx`
- [ ] `tests/pages/DealsPage.test.tsx`
- [ ] `tests/pages/ListingsPage.test.tsx`
- [ ] `tests/pages/VaultPage.test.tsx`

#### Medium Priority (secondary flows)
- [ ] `tests/pages/DashboardPage.test.tsx`
- [ ] `tests/pages/AnalyticsPage.test.tsx`
- [ ] `tests/pages/CalendarPage.test.tsx`
- [ ] `tests/pages/CommissionsPage.test.tsx`
- [ ] `tests/pages/TasksPage.test.tsx`
- [ ] `tests/pages/ViewingsPage.test.tsx`
- [ ] `tests/pages/AgentsPage.test.tsx`
- [ ] `tests/pages/ExpensesPage.test.tsx`

#### Low Priority (utility pages)
- [ ] `tests/pages/LeadDetailPage.test.tsx`
- [ ] `tests/pages/ListingDetailPage.test.tsx`
- [ ] `tests/pages/MortgagePage.test.tsx`
- [ ] `tests/pages/NotificationPreferencesPage.test.tsx`
- [ ] `tests/pages/NotificationsPage.test.tsx`
- [ ] `tests/pages/OfficesPage.test.tsx`
- [ ] `tests/pages/OnboardingPage.test.tsx`
- [ ] `tests/pages/PhToolsPage.test.tsx`
- [ ] `tests/pages/RemindersPage.test.tsx`
- [ ] `tests/pages/SettingsPage.test.tsx`
- [ ] `tests/pages/ChecklistTemplatesPage.test.tsx`
- [ ] `tests/pages/ActivityPage.test.tsx`
- [ ] `tests/pages/ClientPortalPage.test.tsx`
- [ ] `tests/pages/BrochurePage.test.tsx`

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run a specific test file
npx vitest run tests/services/calendarService.test.ts

# Watch mode
npx vitest
```

---

## Test Coverage Target

| Phase | Tests | Target |
|-------|-------|--------|
| Services | 11 total (2 exist) | 100% coverage |
| Hooks | 2 total (1 exists) | 100% coverage |
| Utils/Lib | 4 total (2 exist) | 100% coverage |
| Components | 30 total (0 exist) | 50% coverage (15 tests) |
| Pages (integration) | 25 total (0 exist) | 20% coverage (5 critical) |
| **Total** | **~72 tests** | **~37 new test files** |

---

*Generated: Wed May 27 05:56:44 UTC 2026*
