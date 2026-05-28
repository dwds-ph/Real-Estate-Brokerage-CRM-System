# Architecture Guide

## System Overview

The Real Estate Brokerage CRM is a **single-page application (SPA)** with a **Firebase-only backend** — no Cloud Functions, no custom server. Security rules in Firestore act as the authorization layer, keeping operational costs minimal while maintaining robust access control.

```
┌──────────────────────────────────────────────────────────────┐
│                       React SPA (Vite)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  Pages   │  │Components│  │  Hooks   │  │   Services   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │
│       └──────────────┴─────────────┴───────────────┘         │
│                              │                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                lib/ (shared utilities)                │     │
│  │  firestore.ts  │  validation.ts  │  logger.ts  │ ...  │     │
│  └─────────────────────────────────────────────────────┘     │
│                              │                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │            Firebase SDK (client-side)                 │     │
│  │  Auth  │  Firestore  │  Storage  │  Messaging         │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ┌─────▼─────┐     ┌──────▼──────┐
              │  Firebase  │     │   Firebase   │
              │    Auth    │     │   Storage    │
              └───────────┘     └─────────────┘
                    │
              ┌─────▼──────────────────────────────────┐
              │          Firestore (NoSQL)              │
              │  Security Rules = Backend Logic          │
              │  Real-time listeners → instant UI sync  │
              └────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. Firebase-only (No Cloud Functions)

| Decision                   | Rationale                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Security rules as backend  | Reduces cost to zero for moderate scale. No server management.                       |
| Client-side mutations only | Every write goes through client SDK — rules validate all access.                     |
| No Cloud Functions         | Avoids cold starts, deployment complexity, and vendor lock-in at the function level. |

**Implication:** Complex multi-document transactions and background jobs (e.g., email notifications, scheduled payouts) are not possible server-side. For v1, all logic is client-side with Firestore listeners.

### 2. Service Layer with Shared Firestore Helpers

All business logic is extracted into **services** (`src/services/`) that delegate Firestore operations through a shared `src/lib/firestore.ts` module.

```
Service (src/services/leadService.ts)
  └── createDocument("leads", data)      ← shared helper
  └── updateDocument("leads", id, data)   ← shared helper
  └── deleteDocument("leads", id)         ← shared helper
      └── addDoc / updateDoc / deleteDoc  ← raw Firestore SDK
```

**Benefits:**

- Single source of truth for snapshot-to-entity mapping
- Consistent `createdAt` / `updatedAt` timestamps on every document
- Centralized error handling via `firestoreOperation()`
- Reusable `COLLECTIONS` constant prevents typos in collection names
- Services become testable — just mock the shared helpers

### 3. Real-time Subscriptions via `subscribeToQuery`

The `firestore.ts` module provides a single `subscribeToQuery<T>()` function that wraps `onSnapshot` with typed snapshot mapping:

```typescript
// All real-time subscriptions go through this one function
subscribeToQuery<Lead>("leads", [where("assignedTo", "==", userId)], (leads) => {
  setLeads(leads); // UI updates instantly
});
```

### 4. Component → Hook → Service Flow

```
Page Component (src/pages/LeadsPage.tsx)
  └── Custom Hook (src/hooks/useLeads.ts)
        └── Service (src/services/leadService.ts)
              └── Shared Helper (src/lib/firestore.ts)
                    └── Firebase SDK
```

Each layer has a single responsibility:

- **Pages:** Route-entry component, layout, error boundaries
- **Hooks:** State management, subscription lifecycle, UI logic
- **Services:** Business rules, data transformation, validation
- **Shared Helpers:** Generic Firestore CRUD with timestamps and error handling

## Data Flow

### Reads (Real-time)

```
Component mounts
  └── Hook calls service function
        └── Service calls subscribeToQuery()
              └── onSnapshot() registers listener
                    └── Firestore SDK sends real-time updates
                          └── Snapshot mapped via snapshotToEntities<T>()
                                └── Hook updates state
                                      └── Component re-renders
```

### Writes

```
User action (form submit, button click)
  └── Hook calls service function
        └── Service validates input (optional)
              └── Service calls createDocument/updateDocument/deleteDocument
                    └── Shared helper adds timestamps (createdAt, updatedAt)
                          └── Firestore SDK writes to database
                                └── Security rules validate the write
                                      └── Real-time listener fires → UI updates
```

## Directory Structure

```
src/
├── components/         # Reusable UI components (1 per file)
│   ├── ui/             # Generic UI primitives (button, input, modal)
│   ├── layout/         # App shell, sidebar, header
│   ├── leads/          # Lead-specific components
│   ├── deals/          # Deal/Kanban components
│   └── ...             # Domain-specific directories
├── context/            # React Context providers (Auth, Theme)
├── hooks/              # Custom React hooks
│   ├── useFirestore.ts # Real-time Firestore hooks
│   ├── useAsync.ts     # Async operation handler
│   └── ...
├── lib/                # Core libraries
│   ├── firebase.ts     # Firebase init + emulator config
│   ├── firestore.ts    # ** Shared Firestore helpers **
│   ├── validation.ts   # Input validation rules
│   ├── logger.ts       # Structured logging
│   ├── errors.ts       # Typed error classes
│   ├── utils.ts        # General utility functions
│   ├── commission.ts   # Commission calculation engine
│   └── ...
├── pages/              # Route-level components (~40 pages)
├── services/           # Business logic layer
│   ├── leadService.ts
│   ├── dealService.ts
│   ├── commissionPlanService.ts
│   ├── documentVault.ts
│   ├── referralService.ts
│   ├── leadRoutingService.ts
│   └── ... (~30 services)
├── types/              # TypeScript type definitions
│   ├── index.ts        # Barrel re-export
│   ├── lead.ts         # Lead, LeadStatus, LeadSource
│   ├── deal.ts         # Deal, DealStatus
│   ├── property.ts     # Listing, PropertyType
│   └── ...
└── index.tsx           # App entry point
```

## Type System

Types are organized by domain in `src/types/` with a barrel re-export:

```typescript
// src/types/index.ts
export * from "./lead";
export * from "./deal";
export * from "./property";
// ... etc

// Usage throughout the app
import { Lead, LeadStatus } from "@/types";
```

All domain types extend `FirestoreEntity` or `TimestampedEntity`:

```typescript
interface FirestoreEntity {
  id: string;
}

interface TimestampedEntity extends FirestoreEntity {
  createdAt: number;
  updatedAt: number;
}
```

## Error Handling Strategy

```
Component
  └── try/catch ────────────── AppError ──────────→ ErrorBoundary
       │                          │                       │
       │                    .code (string)           Renders fallback UI
       │                    .severity (error|warn)
       │                    .recoverable (boolean)
       │
       └── createScopedLogger("ServiceName")
              .error("operation failed", err)
```

## Testing Strategy

| Layer      | Tool                       | Scope                                    |
| ---------- | -------------------------- | ---------------------------------------- |
| Services   | Vitest (unit)              | Business logic, data transformations     |
| Hooks      | Vitest + RTL (unit)        | Hook behavior, subscription lifecycle    |
| Components | Vitest + RTL (integration) | Component rendering, user interactions   |
| E2E        | Playwright                 | Full user flows, cross-page interactions |
| Coverage   | Vitest + c8                | 80%+ statements, 70%+ branches           |

**Mocking pattern:** Services mock `@/lib/firestore` directly (not the Firebase SDK), making tests fast and focused on business logic. The Firebase SDK is mocked globally in `test-setup.ts`.

```
Service test
  └── vi.mock("@/lib/firestore")
        └── createDocument = vi.fn()
        └── updateDocument = vi.fn()
        └── deleteDocument = vi.fn()
              └── Test calls service → assert on mock calls
```

## Quality Gates

| Gate        | Tool             | When                          |
| ----------- | ---------------- | ----------------------------- |
| Lint        | ESLint           | Pre-commit (husky) + CI       |
| Format      | Prettier         | Pre-commit (husky) + CI       |
| Type check  | TypeScript (tsc) | Pre-commit (husky) + CI       |
| Unit tests  | Vitest           | CI (with coverage thresholds) |
| Build       | Vite             | CI (production build + SW)    |
| E2E         | Playwright       | CI (on demo firebase project) |
| CI Pipeline | GitHub Actions   | On push to develop/main       |

## PH-Specific Architecture Decisions

### Commission Engine

Commission calculations happen **client-side** in `lib/commission.ts`. The Firestore document is the raw data source; the engine computes net amounts after VAT (12%) and withholding tax (1%) on display. This means calculations can't be relied on for official accounting — they're for agent visibility and estimation.

### Title Transfer Tracker

The 5-stage title process (With Seller → BIR CGT → Registry of Deeds → Transfer → Complete) is tracked as a status field on the Property/Deal document. Each stage transition requires validation against a checklist of required documents.

### Loan Calculators

Pag-IBIG and bank financing calculators are pure client-side computations in `lib/loanEngine.ts`. Rates are stored as constants (updated via PR when PH banks change rates). No real-time rate fetching — the calculator is for ballpark estimates.

## Performance Considerations

- **Lazy loading:** All page components use `React.lazy()` + Suspense
- **Real-time listener management:** Hooks call the unsubscribe function on unmount
- **Firestore query limits:** queries capped at 50-100 results with `limit()` to avoid unbounded reads
- **Storage upload resumable:** Files upload via `uploadBytesResumable` with progress callbacks
- **PWA caching:** Service worker caches static assets via Workbox
- **Bundle splitting:** Vite auto-splits by route; vendor chunk for React/Firebase SDK

## Security Model

Since there are no Cloud Functions, **Firestore Security Rules** are the entire backend:

```javascript
// Conceptual rule structure
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /{document=**} {
      allow read: if request.auth != null;
    }

    // Brokers can read/write all leads in their hierarchy
    match /leads/{leadId} {
      allow write: if request.auth.uid == resource.data.assignedTo
                   || request.auth.token.role == 'broker';
    }

    // Agents can only modify their own leads
    match /leads/{leadId} {
      allow write: if request.auth.uid == resource.data.assignedTo;
    }
  }
}
```

## Development Workflow

```bash
# Start Firebase Emulators + Vite concurrently
yarn dev:full

# Development server only (uses production Firebase)
yarn dev

# Quality gates (run before commit)
yarn validate

# Individual gates
yarn lint           # ESLint
yarn typecheck      # TypeScript
yarn test           # Unit tests
yarn build          # Production build

# Test with coverage
yarn test:coverage

# Deploy to Firebase
firebase deploy
```
