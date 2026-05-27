# Refactoring & Component Abstraction Rules

> Guidelines for systematic refactoring of the Real Estate Brokerage CRM codebase.
> Goal: Clean architecture, DRY components, strong typing, and maintainable code.

---

## 1. File Size Limits

- **Pages**: Max 250 lines. Any page exceeding this must extract sections into sub-components under `src/components/<domain>/`.
- **Components**: Max 200 lines. Extract sub-sections, render helpers, or complex JSX into smaller components.
- **Hooks**: Max 100 lines. Split complex hooks into smaller focused hooks.
- **Services**: Max 150 lines. Split into domain-specific service files if exceeded.

## 2. Component Abstraction Rules

### 2.1 Page-to-Component Extraction
- Each page directory's components live under `src/components/<domain>/` (e.g., `src/components/leads/`, `src/components/deals/`).
- **Trigger**: Any JSX block repeated twice → extract to reusable component.
- **Trigger**: Any page section with 30+ lines of JSX → extract to named component.
- **Trigger**: Any inline modal/dialog → extract to dedicated `*Modal.tsx` or `*Dialog.tsx` component.
- **Trigger**: Any table with sorting/filtering → extract to reusable `<DataTable>` with generic props.

### 2.2 Prop Interface Rules
- Every component MUST have an explicit exported `interface` for its props (no inline `{ prop1, prop2 }: { ... }`).
- Name pattern: `{ComponentName}Props` (e.g., `LeadCardProps`).
- Use `interface` over `type` for props (better error messages, extends support).
- Mark optional props with `?` — do NOT use `| undefined` union.

### 2.3 Render/View Separation
- **Container vs Presentational**: Logic-heavy pages → split into a container hook (`useXyzPage`) and a presentational component (`XyzPageView`).
- Data fetching, state management, and event handlers go in the hook.
- JSX rendering, styling, and layout go in the view component.

## 3. State Management Rules

### 3.1 Local State
- Use `useState` for UI-only state (form inputs, toggles, filters).
- Use `useReducer` for complex state with multiple interrelated fields (e.g., multi-step forms).
- Use `useRef` for DOM references and values that shouldn't trigger re-renders.

### 3.2 Shared State
- Auth state: `AuthContext` (already exists).
- Theme state: `ThemeContext` (already exists).
- NO new global contexts without explicit justification.
- Prefer prop drilling up to 3 levels before introducing context.

### 3.3 Data Fetching
- All Firestore reads go through `src/hooks/useFirestore.ts` (`useCollection`, `useDoc`).
- No raw Firestore calls in components — always through hooks or services.
- Services under `src/services/` handle writes (create, update, delete) and complex queries.

## 4. TypeScript Strictness

### 4.1 Type Definitions
- All entity types in `src/types/index.ts` — NOT scattered across component files.
- API response shapes, form data types, and filter types defined in the same file or co-located `types.ts` within the domain folder.
- No `any` — use `unknown` + type narrowing, or explicit interfaces.
- Avoid `as` casts — prefer type guards or proper generics.

### 4.2 Generics
- Reusable hooks and components MUST use generics where applicable.
- Example: `useCollection<T extends DocumentData>(collectionName: string)` — already done.
- Data table components: `DataTable<T extends Record<string, unknown>>`.

### 4.3 Utility Types
- Use `Pick<>`, `Omit<>`, `Partial<>`, `Required<>` for derived types.
- Do NOT redefine partial shapes of entities — derive from the base type.

## 5. Naming Conventions

### 5.1 Files
- **Pages**: PascalCase, `XxxPage.tsx` (e.g., `LeadsPage.tsx`).
- **Components**: PascalCase, `Xxx.tsx` (e.g., `LeadCard.tsx`).
- **Hooks**: camelCase, `useXxx.ts` (e.g., `useLeads.ts`).
- **Services**: camelCase, `xxxService.ts` (e.g., `leadService.ts`).
- **Types**: camelCase, `xxx.types.ts` or co-located in `types/index.ts`.

### 5.2 Exports
- Pages: `export default function XxxPage()` — default export.
- Components: `export function Xxx()` — named export (unless it's a page).
- Hooks: `export function useXxx()` — named export.
- Services: `export async function xxx()` — named exports.
- Types: `export interface Xxx` / `export type Xxx` — named exports.

### 5.3 Variables & Functions
- **Boolean**: prefix with `is`, `has`, `should`, `can` (e.g., `isLoading`, `hasError`).
- **Event handlers**: `handle{Action}` (e.g., `handleSubmit`, `handleDelete`).
- **Callbacks passed as props**: `on{Event}` (e.g., `onSave`, `onClose`).

## 6. Import Organization

Within each file, order imports in this sequence (separated by blank lines):

```typescript
// 1. External libraries (react, react-router, firebase, recharts, etc.)
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal project modules (@/ path aliases)
import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { Lead, Deal } from '@/types';

// 3. Local relative imports (same-domain components, utils)
import { LeadCard } from './LeadCard';
import { formatCurrency } from './utils';
```

- NO barrel imports (`index.ts` re-exports) for internal modules — import directly.
- Path aliases (`@/`) preferred over relative `../../` chains.

## 7. Testing Rules

- Every service file MUST have a corresponding `.test.ts` file.
- Every hook MUST have a corresponding `.test.ts` file.
- Complex components (30+ lines of logic) SHOULD have test files.
- Tests use Vitest (already configured).
- Use `describe`/`it` blocks — no `test()`.

## 8. Refactoring Workflow

When refactoring a file, follow this sequence:

1. **Audit**: Read the file, identify violations of rules above.
2. **Plan**: Decide what to extract — components, hooks, or services.
3. **Extract**: Create new files, move code, wire imports.
4. **Type**: Ensure all types are properly defined and exported.
5. **Build**: Run `npm run build` — fix any TypeScript errors.
6. **Lint**: Run `npm run lint` — fix any lint errors.
7. **Test**: Run `npm test` — add tests for extracted code.
8. **Commit**: Atomic commits per file refactored.

## 9. Priority Files for Refactoring

Files most likely to need refactoring (size/complexity):

| File | Lines | Issues |
|------|-------|--------|
| `LeadsPage.tsx` | 434 | Exceeds 250-line limit, merge inline form/table/list |
| `VaultPage.tsx` | ~550 | Exceeds limit, mix of tabs/lists/detail panel |
| `DealsPage.tsx` | ~400 | Kanban + mortgage + referral sections all in one |
| `PhToolsPage.tsx` | 365 | 3 calculators in one file — extract each |
| `PropertyMap.tsx` | ~680 | Massive component — extract marker/popup/filter sub-components |
| `DocumentUpload.tsx` | ~350 | Modal with complex form — extract form sections |

---

*Last updated: 2026-05-27*
