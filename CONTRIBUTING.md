# Contributing to Real Estate Brokerage CRM

## Development Workflow

1. **Create a branch** from `develop`:

   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and ensure quality gates pass:

   ```bash
   yarn lint
   yarn typecheck
   yarn test
   yarn build
   ```

3. **Commit** using conventional commits:

   ```
   feat: add lead scoring algorithm
   fix: resolve pag-ibig calculator rounding error
   refactor: extract commission calculation into service
   test: add validation edge case tests
   docs: update architecture diagram
   ```

4. **Push** and open a Pull Request to `develop`.

## Code Standards

### TypeScript

- Use strict typing — avoid `any`
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and utility types
- Import types with `import { type Foo }` syntax
- Use `const` assertions for literal types
- All domain types should extend `FirestoreEntity` or `TimestampedEntity` from `lib/firestore.ts`

### Service Layer (Business Logic)

- Every service goes in `src/services/<domain>Service.ts`
- Import shared Firestore helpers from `@/lib/firestore` — never call Firestore SDK directly
- Use `createDocument`, `updateDocument`, `deleteDocument` for CRUD
- Use `COLLECTIONS` constant (never hardcode collection names)
- Use `subscribeToQuery<T>()` for real-time subscriptions
- Each service exports named async functions, never classes
- Handle errors via `firestoreOperation()` or try/catch with `AppError`

### React

- Use functional components with hooks
- Extract complex logic into custom hooks
- Lazy-load page components with `React.lazy`
- Keep components focused — one component per file
- Use TypeScript interfaces for props

### State Management

- Use React Context for global state (auth, theme)
- Use Firestore real-time listeners (`onSnapshot`) for data
- Use local state for UI-only concerns

### Error Handling

- Use `AppError` for application errors
- Use `createScopedLogger` for module-level logging
- Wrap async operations in try/catch with structured error handling

### Testing

- Write tests for all new utilities and hooks
- Aim for 80%+ coverage on new code
- Test behavior, not implementation details
- Use descriptive test names

## Pull Request Process

1. Update documentation if needed
2. Ensure all quality gates pass in CI
3. Get at least one review approval
4. Squash-merge to `develop`
5. Delete the feature branch
