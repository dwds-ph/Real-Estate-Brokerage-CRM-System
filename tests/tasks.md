# Testing Tasks

> Checklist-based testing plan for the Real Estate Brokerage CRM.

## Test Structure

Tests are split into two locations:
- `src/**/*.test.ts` — Unit tests for utilities, hooks, and pure functions
- `tests/` — Component, service, page, and integration tests (mirrors `src/` structure)

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

## Test Coverage Target

| Phase | Tests | Status |
|-------|-------|--------|
| Services | 18 service test files | ✅ Complete |
| Hooks | 2 unit + 1 integration | ✅ Complete |
| Utils/Lib | 6 unit + 7 lib tests | ✅ Complete |
| Components | 16 component tests | ✅ Complete |
| Pages (integration) | 7 page tests | ✅ Complete |
| **Total** | **57+ test files** | **✅ Passing** |

## Testing Rules

### Framework & Tools
- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for component/hook tests
- **Coverage**: v8 provider with 80% statement threshold

### Naming Conventions
- `describe('{ModuleName}', () => { it('should ...', () => { ... }) })`
- Test files: `{sourceFileName}.test.ts` or `.test.tsx`
- Import from `@/` aliases

### What to Test by Layer

| Layer | What to test |
|-------|-------------|
| **Services** | CRUD operations, edge cases, error handling |
| **Hooks** | State transitions, return shape, side effects |
| **Components** | Rendering with different props, user interactions, loading/error/empty states |
| **Utils** | Pure function outputs, edge cases, error states |
| **Pages (integration)** | Full user flow, navigation, data fetch → render |

---

*Generated: Wed May 28 05:42:10 UTC 2026*
