# Deployment Guide — Real Estate Brokerage CRM

## Table of Contents
- [Prerequisites](#prerequisites)
- [Production Deploy Checklist](#production-deploy-checklist)
- [Step 1: Configure Firebase Project](#step-1-configure-firebase-project)
- [Step 2: Enable Firebase Services](#step-2-enable-firebase-services)
- [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
- [Step 4: Deploy Firestore Security Rules](#step-4-deploy-firestore-security-rules)
- [Step 5: Build & Deploy](#step-5-build--deploy)
- [Step 6: Seed Demo Data](#step-6-seed-demo-data)
- [Staging Environment](#staging-environment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)
- [Rollback](#rollback)
- [Local Development](#local-development)
- [Updating](#updating)
- [Build Output](#build-output)

---

## Prerequisites

1. **Firebase Project** — Create one at [console.firebase.google.com](https://console.firebase.google.com)
2. **Firebase CLI** — `npm install -g firebase-tools`
3. **Node.js 24+** and **Yarn 4** installed (`corepack enable && yarn set version 4.15.0`)

---

## Production Deploy Checklist

Before deploying to production, verify each item:

- [ ] All environment variables set in GitHub Secrets (`FIREBASE_TOKEN`, `FIREBASE_PROJECT_ID`, Firebase config vars)
- [ ] `.firebaserc` points to the production project ID
- [ ] `firebase.json` hosting configuration is correct (cache headers, CSP, rewrites)
- [ ] `yarn validate` passes locally (typecheck + lint + test + build)
- [ ] E2E tests pass (`yarn e2e`)
- [ ] Lighthouse audit passes (run via CI)
- [ ] Firestore rules reviewed for security
- [ ] Storage rules reviewed for access control
- [ ] PWA manifest and service worker are up-to-date
- [ ] `.env.production` contains the correct Firebase config values
- [ ] Monitoring is initialized (see [Monitoring](#monitoring) below)
- [ ] Rollback script tested locally

---

## Step 1: Configure Firebase Project

```bash
# Login to Firebase
firebase login

# Set your project ID
firebase use --add
# Select your project from the list
```

Edit `.firebaserc` to set your project ID:

```json
{
  "projects": {
    "default": "your-firebase-project-id",
    "staging": "your-staging-project-id"
  }
}
```

---

## Step 2: Enable Firebase Services

In the [Firebase Console](https://console.firebase.google.com):

| Service                | What to do                                        |
| ---------------------- | ------------------------------------------------- |
| **Authentication**     | Enable **Email/Password** sign-in provider        |
| **Firestore Database** | Create in **production mode**, deploy rules below |
| **Storage**            | Set up with default rules, deploy rules below     |
| **Hosting**            | Already configured — just deploy                  |
| **Cloud Messaging**    | Optional — for push notifications                 |

---

## Step 3: Configure Environment Variables

Copy `.env.example` to `.env.production` and fill in your Firebase project values:

```bash
cp .env.example .env.production
```

Edit `.env.production`:

```
VITE_FIREBASE_API_KEY=AIzaSy...          # From Firebase Console → Project Settings → Web App
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_APP_ENV=production
```

For staging, use `VITE_APP_ENV=staging` and point to a separate Firebase project.

---

## Step 4: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

---

## Step 5: Build & Deploy

### Manual Deployment

```bash
# Build the SPA
yarn build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app is now live at `https://your-project-id.web.app` 🎉

### Automated Deployment (CI/CD)

See the [CI/CD Pipeline](#cicd-pipeline) section below — pushes to `main` and `develop` branches trigger automatic deployments.

---

## Step 6: Seed Demo Data

Navigate to `https://your-project-id.web.app/seed-data` and click **"🌱 Seed Demo Data"**
to populate the database with realistic Philippine real estate demo data:

- **10 listings** (condos, houses, lots, commercial across Metro Manila, Laguna, Batangas)
- **10 leads** (hot/warm/cold with PH names)
- **8 deals** (pending, closed, cancelled with commission breakdowns)

---

## Staging Environment

A separate staging environment allows testing changes before they hit production.

### Setup

1. Create a second Firebase project (e.g., `your-project-staging`)
2. Configure `.firebaserc` with a `staging` alias:
   ```json
   {
     "projects": {
       "default": "your-prod-project",
       "staging": "your-staging-project"
     }
   }
   ```
3. Set GitHub Secrets: `FIREBASE_PROJECT_ID_STAGING` and `FIREBASE_TOKEN` (same token works for both if the same account owns both projects)

### How it works

- Pushes to the `develop` branch trigger the **Deploy Staging** workflow (`.github/workflows/deploy-staging.yml`)
- The workflow runs all validation checks (typecheck, lint, test, build)
- If all checks pass, it deploys to the staging Firebase project at `https://your-staging-project.web.app`
- Staging uses the same Firebase token but a different project ID secret
- Build artifacts are retained for 3 days for debugging

### Promoting Staging to Production

1. Create a PR from `develop` → `main`
2. CI runs on the PR (via `ci.yml`)
3. Merge to `main` to trigger the **Deploy Production** workflow
4. Production deploys with no concurrent cancellation (critical deploys are never interrupted)

---

## CI/CD Pipeline

### Workflows

| Workflow                  | Trigger          | Actions                                                              |
| ------------------------- | ---------------- | -------------------------------------------------------------------- |
| `ci.yml`                  | PR to main, push to main/develop | Typecheck, lint, test with coverage, build, upload coverage report |
| `lighthouse.yml`          | PR to main, push to main | Lighthouse performance audit |
| `deploy-production.yml`   | Push to `main`   | Typecheck, lint, test, build, deploy to production Firebase Hosting  |
| `deploy-staging.yml`      | Push to `develop`| Typecheck, lint, test, build, deploy to staging Firebase Hosting     |

### Quality Gates

Every deployment goes through these checks in order:

1. **TypeScript type checking** (`yarn typecheck`) — ensures no type errors
2. **ESLint** (`yarn lint`) — enforces code quality standards
3. **Unit tests** (`yarn test --run`) — runs the full test suite
4. **Build** (`yarn build`) — produces the production bundle

If any step fails, the workflow stops and no deployment occurs.

### Required Secrets

Configure these in your GitHub repository → Settings → Secrets and variables → Actions:

| Secret                        | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `FIREBASE_TOKEN`              | Firebase CI token (`firebase login:ci`)              |
| `FIREBASE_PROJECT_ID`         | Production Firebase project ID                       |
| `FIREBASE_PROJECT_ID_STAGING` | Staging Firebase project ID                          |
| `VITE_FIREBASE_API_KEY`       | Firebase Web API key                                 |
| `VITE_FIREBASE_AUTH_DOMAIN`   | Auth domain                                          |
| `VITE_FIREBASE_STORAGE_BUCKET`| Storage bucket URL                                   |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID                            |
| `VITE_FIREBASE_APP_ID`        | Firebase App ID                                      |

### Generating a Firebase CI Token

```bash
firebase login:ci
# Copy the token output and add it as FIREBASE_TOKEN in GitHub Secrets
```

---

## Monitoring

### Client-Side Error Monitoring

The application includes a lightweight, built-in monitoring service (`src/lib/monitoring.ts`) that works without third-party dependencies.

**What it captures:**
- **Uncaught JavaScript errors** — via the `window.onerror` handler
- **Unhandled promise rejections** — via the `unhandledrejection` event
- **Navigation events** — page view changes via `history.pushState` interceptor
- **Breadcrumbs** — the last 50 app events leading up to an error

**How it works:**
- In production (`import.meta.env.PROD === true`), errors are logged to the console and stored in `sessionStorage` (up to 20 recent errors)
- In development, errors are only logged to the console
- A breadcrumb trail is maintained in memory (up to 50 entries) to provide context around errors
- The `sampleRate` config (default 1.0) controls what fraction of errors are captured

**Initialization:**
Monitoring is initialized in `src/main.tsx` via the `initMonitoring()` call. For user-specific context, a component within the `AuthProvider` tree can call `initMonitoring(user.uid)` to associate errors with the authenticated user.

**Extending:**
To send errors to an external service, modify the `captureError()` function in `monitoring.ts` to POST to your endpoint:

```typescript
fetch("/api/monitoring/errors", {
  method: "POST",
  body: JSON.stringify(payload),
  keepalive: true,
});
```

### Firebase Performance Monitoring (Optional)

For additional monitoring, enable Firebase Performance Monitoring in the Firebase Console and add the Performance SDK:

```bash
yarn add firebase/performance
```

```typescript
import { getPerformance } from "firebase/performance";
const perf = getPerformance(app);
```

---

## Rollback

### Using the Rollback Script

A convenience script is provided at `scripts/rollback.sh`:

```bash
# Rollback to the previous version (default)
./scripts/rollback.sh

# Rollback to a specific channel/version
./scripts/rollback.sh v1.2.3
```

The script:
1. Reads the project ID from `.firebaserc` (or `FIREBASE_PROJECT_ID` env var)
2. Lists recent hosting versions for reference
3. Clones the target version to `live` with a `rollback-<timestamp>` suffix

### Manual Rollback via Firebase CLI

```bash
# List recent versions
firebase hosting:channel:list

# Clone a specific version to live
firebase hosting:clone PROJECT_ID/CHANNEL_ID/latest PROJECT_ID/live

# Example: restore the channel "v1.0.0" to live
firebase hosting:clone your-project/v1.0.0/latest your-project/live
```

### Rollback via Firebase Console

1. Go to [Firebase Console → Hosting](https://console.firebase.google.com)
2. Select your project
3. Click the **"..."** menu next to the version you want to restore
4. Select **"Rollback"**

### Best Practices

- Always verify the current version before rolling back (`firebase hosting:channel:list`)
- Notify the team before performing a rollback
- After rollback, verify the app is working at the live URL
- Investigate the root cause of the issue that required the rollback
- Do NOT cancel in-progress production rollbacks — the production deploy workflow has `cancel-in-progress: false`

---

## Local Development

```bash
# Install dependencies
yarn install

# Copy env file
cp .env.example .env.development

# Start with Firebase emulators
yarn dev:full
```

This starts:
- Vite dev server on `http://localhost:3000`
- Firebase Emulator Suite (Auth:9099, Firestore:8080, Storage:9199, UI:4000)

---

## Updating

```bash
git pull
yarn install
yarn build
firebase deploy --only hosting
```

Or simply push to `main` and let CI/CD handle it.

---

## Build Output

| Artifact          | Path                        |
| ----------------- | --------------------------- |
| SPA bundle        | `dist/`                     |
| Service worker    | `dist/sw.js`                |
| PWA manifest      | Generated by VitePWA plugin |
| Firestore rules   | `firestore.rules`           |
| Storage rules     | `storage.rules`             |
| Firestore indexes | `firestore.indexes.json`    |
