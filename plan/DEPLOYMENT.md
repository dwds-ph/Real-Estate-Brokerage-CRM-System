# Deployment Runbook — Real Estate Brokerage CRM

> **Stack**: React + Vite + TypeScript SPA (Firebase-only — no Cloud Functions)  
> **Hosting**: Firebase Hosting  
> **Database**: Firestore  
> **Auth**: Firebase Auth (email/password + Google OAuth)  
> **Storage**: Firebase Storage  
> **Notifications**: Firebase Cloud Messaging (FCM)  
> **CI/CD**: GitHub Actions → Firebase Hosting

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Local Build Verification](#3-local-build-verification)
4. [Firebase Project Configuration](#4-firebase-project-configuration)
5. [Deployment Targets](#5-deployment-targets)
6. [Deploy to Production](#6-deploy-to-production)
7. [Preview Channels (Pre-Production Testing)](#7-preview-channels-pre-production-testing)
8. [Rollback Procedure](#8-rollback-procedure)
9. [Post-Deploy Verification](#9-post-deploy-verification)
10. [Monitoring & Alerting](#10-monitoring--alerting)
11. [Common Issues & Solutions](#11-common-issues--solutions)
12. [CI/CD Pipeline](#12-cicd-pipeline)

---

## 1. Prerequisites

### Required Software

| Tool         | Version       | Check Command        |
| ------------ | ------------- | -------------------- |
| Node.js      | ^18.0.0 (LTS) | `node --version`     |
| yarn         | ^1.22.0       | `yarn --version`     |
| Firebase CLI | ^13.0.0       | `firebase --version` |
| Git          | ^2.30.0       | `git --version`      |

### Install Firebase CLI

```bash
npm install -g firebase-tools
# or install via yarn
yarn global add firebase-tools
# or
curl -sL https://firebase.tools | bash
```

### Authenticate with Google

```bash
firebase login
# Opens browser — authenticate with the Google account that owns the Firebase project.
# For CI/CD: use `firebase login:ci` to generate a CI token.
```

### Required Access

- **Owner** or **Editor** role on the Firebase project in [Firebase Console](https://console.firebase.google.com/)
- Access to the project's Google Cloud Console for advanced monitoring

---

## 2. Environment Setup

### 2.1 Create `.env.production`

The app reads Firebase config from Vite environment variables (`import.meta.env.VITE_*`). Create a `.env.production` file in the project root:

```bash
# /root/Real-Estate-Brokerage-CRM-System/.env.production
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxx
```

Get these values from: **Firebase Console → Project Settings → General → Your apps → Web app → Firebase SDK snippet → Config**.

> **⚠️ Important**: `.env.production` is consumed by Vite at **build time** (not runtime). Any change requires a new build + deploy.

### 2.2 `.gitignore` — Ensure `.env.production` is NEVER committed

The `.env.production` file contains no real secrets (Firebase config is client-safe by design), but committing it creates a maintenance burden. Confirm `.gitignore` includes:

```
.env
.env.local
.env.development
.env.production
```

### 2.3 Environment Reference (for local dev)

```bash
# .env.development (local)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxx
```

Use the same Firebase project for both dev and prod (Firestore rules enforce data isolation via `brokerId`).

---

## 3. Local Build Verification

Always verify the build succeeds **before** deploying.

### 3.1 Full Build

```bash
cd /root/Real-Estate-Brokerage-CRM-System

# Install dependencies (if not already)
yarn install

# Run type checking
yarn typecheck

# Run lint
yarn lint

# Run tests
yarn test

# Production build
yarn build
```

### 3.2 What the Build Produces

The `yarn build` command runs three steps (from `package.json`):

```json
"build": "tsc -b && vite build && node scripts/generate-sw.mjs"
```

Output goes to the `dist/` directory:

```
dist/
├── index.html                     # Entry point
├── assets/
│   ├── index-XXXXXXXX.js          # Bundled JS (hashed)
│   ├── index-XXXXXXXX.css         # Bundled CSS (hashed)
├── firebase-messaging-sw.js       # FCM service worker (copied from dist/)
```

> **Note**: The FCM service worker (`dist/firebase-messaging-sw.js`) uses hardcoded Firebase config as placeholders (`YOUR_API_KEY`, etc.). **You must replace these values before deploying** (see Section 6.2).

### 3.3 Local Preview

```bash
npm run preview
# Serves the built dist/ at http://localhost:4173
```

Test all major flows locally:

- [ ] Login (email/password + Google OAuth)
- [ ] Lead CRUD and pipeline
- [ ] Listing creation with media upload
- [ ] Deal pipeline drag & drop
- [ ] Brochure generation
- [ ] Commission calculator
- [ ] Viewing scheduling
- [ ] Push notification registration

---

## 4. Firebase Project Configuration

### 4.1 Initialize Firebase in the Project

```bash
firebase init
```

During init, enable these services:

| Feature       | Required? | Notes                              |
| ------------- | --------- | ---------------------------------- |
| **Hosting**   | ✅ Yes    | Deploy the SPA                     |
| **Firestore** | ✅ Yes    | Deploy security rules + indexes    |
| **Storage**   | ✅ Yes    | Deploy security rules              |
| **Functions** | ❌ No     | Firebase-only — no Cloud Functions |
| **Emulators** | Optional  | For local testing                  |

This creates `firebase.json` and `.firebaserc` in the project root.

### 4.2 `firebase.json` — Recommended Configuration

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "/firebase-messaging-sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          },
          { "key": "Service-Worker-Allowed", "value": "/" }
        ]
      },
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

**Key points**:

- `rewrites` — Single-page app: all routes serve `index.html`
- `Cache-Control: immutable` for hashed assets (1 year)
- Service worker must have `max-age=0` and `Service-Worker-Allowed: /`
- Security headers for all routes

### 4.3 Firestore Indexes

Create `firestore.indexes.json` (if not present). Required composite indexes for the CRM query patterns:

```json
{
  "indexes": [
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "brokerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedTo", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "brokerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "deals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "brokerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "viewings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "agentId", "order": "ASCENDING" },
        { "fieldPath": "scheduledAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedTo", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

> **Check existing indexes**: `firebase firestore:indexes`

---

## 5. Deployment Targets

The CRM uses **four deployable targets**. You can deploy them individually or all at once.

| Target                | Command                                    | Purpose                                 |
| --------------------- | ------------------------------------------ | --------------------------------------- |
| **Hosting**           | `firebase deploy --only hosting`           | SPA frontend (HTML, JS, CSS, assets)    |
| **Firestore Rules**   | `firebase deploy --only firestore:rules`   | Security rules for all collections      |
| **Firestore Indexes** | `firebase deploy --only firestore:indexes` | Composite indexes for queries           |
| **Storage Rules**     | `firebase deploy --only storage`           | Storage security rules for file uploads |

### Deploy All Targets

```bash
firebase deploy
```

### Deploy Individual Targets

```bash
# Frontend only (most common — daily updates)
firebase deploy --only hosting

# Security rules only (when modifying access control)
firebase deploy --only firestore:rules,storage

# Indexes only (when adding new query patterns)
firebase deploy --only firestore:indexes
```

---

## 6. Deploy to Production

### 6.1 Step-by-Step Production Deploy

```bash
# 1. Ensure you're on the correct branch
git checkout main
git pull origin main

# 2. Verify the build
yarn install
yarn typecheck
yarn lint
yarn test
yarn build

# 3. CRITICAL — Update FCM service worker config
# Edit dist/firebase-messaging-sw.js and replace placeholder values
# with the actual Firebase project credentials:
#   YOUR_API_KEY        → from .env.production
#   YOUR_PROJECT        → your-project-id
#   YOUR_PROJECT_ID     → your-project-id
#   YOUR_STORAGE_BUCKET → your-project.appspot.com
#   YOUR_SENDER_ID      → messaging sender ID
#   YOUR_APP_ID         → app ID

# 4. Preview the build locally first
yarn preview

# 5. Deploy
firebase deploy --only hosting

# 6. Verify deployment
firebase hosting:channel:list
```

### 6.2 FCM Service Worker — Required Manual Step

The `dist/firebase-messaging-sw.js` file is served at the **root scope** (`/`) and must contain the correct Firebase config for push notifications to work. Currently it has placeholder values:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY", // ← REPLACE
  authDomain: "YOUR_PROJECT.firebaseapp.com", // ← REPLACE
  projectId: "YOUR_PROJECT_ID", // ← REPLACE
  storageBucket: "YOUR_PROJECT.appspot.com", // ← REPLACE
  messagingSenderId: "YOUR_SENDER_ID", // ← REPLACE
  appId: "YOUR_APP_ID", // ← REPLACE
});
```

**Workaround options** (until this is automated):

1. **Manual replacement before every deploy** — Edit `dist/firebase-messaging-sw.js` after each build.
2. **Add a build script** to inject env vars at build time (recommended). Add to `package.json`:
   ```json
   "scripts": {
     "build": "tsc -b && vite build && node scripts/inject-fcm-config.mjs"
   }
   ```
   Create `scripts/inject-fcm-config.mjs` that reads `process.env` or `.env.production` and substitutes the placeholders.
3. **Use Vite PWA plugin** (future) — `vite-plugin-pwa` can generate the service worker with proper env injection.

> **Without this step, push notifications WILL fail silently in production.**

### 6.3 Deploy Rules + Indexes (First Time / After Changes)

```bash
# First production deploy — deploy everything
firebase deploy

# Subsequent rule-only updates
firebase deploy --only firestore:rules,storage
firebase deploy --only firestore:indexes
```

---

## 7. Preview Channels (Pre-Production Testing)

Preview channels let you test changes on a live URL before deploying to production.

### 7.1 Create a Preview Channel

```bash
# Create a channel from the current build
firebase hosting:channel:deploy preview-name

# Example — feature test
firebase hosting:channel:deploy feature-lead-scoring

# Output:
# ✔  Channel 'feature-lead-scoring' created
# ✔  Hosting URL: https://feature-lead-scoring--your-project.web.app
```

### 7.2 Deploy to a Specific Channel

```bash
npm run build
firebase hosting:channel:deploy staging --expires 7d
# The --expires flag controls how long the channel lives (default 7d, max 30d)
```

### 7.3 Promote Preview to Production

```bash
# After verifying on the preview channel, promote it
firebase hosting:channel:deploy staging
firebase hosting:clone your-project/staging your-project/live
```

### 7.4 List Active Channels

```bash
firebase hosting:channel:list
```

### 7.5 Delete a Channel (cleanup)

```bash
firebase hosting:channel:delete preview-name
```

### 7.6 Who Can Access Preview Channels?

Preview URLs are accessible to **anyone with the link** (Firebase Hosting preview channels are publicly accessible). For confidential testing, consider restricting via Firebase Auth or Cloud IAP (advanced).

---

## 8. Rollback Procedure

### 8.1 Rollback via Firebase Console (Recommended — No CLI)

1. Go to **Firebase Console → Hosting**
2. Select the site (default: `your-project.web.app` or custom domain)
3. Click the **"..." menu** on the current release
4. Select **"Rollback"**
5. Pick a previous version and confirm

### 8.2 Rollback via Firebase CLI

```bash
# List all releases (versions)
firebase hosting:channel:list

# For the live channel, list releases:
# (Firebase doesn't have a direct "list releases" CLI command — use the console)

# Rollback to a specific version by redeploying from Git
git log --oneline          # Find the commit hash of the stable version
git checkout <stable-commit-hash>
yarn install
yarn build
# Update dist/firebase-messaging-sw.js with real config
firebase deploy --only hosting
git checkout main          # Return to main branch
```

### 8.3 Rollback Using `firebase-tools` Release API

```bash
# Get the Firebase Hosting site name
FIREBASE_SITE=$(firebase hosting:sites:list --json | jq -r '.sites[0].name')

# List releases (requires jq)
# Note: This uses the Firebase Management API. Alternatively, use Console.

# Rollback via re-deploy of a previous dist (if you keep build artifacts)
# Keep last 3 builds in ./releases/ for quick rollback:
mkdir -p releases
cp -r dist releases/v1.2.3
# To rollback: cp releases/v1.2.3 dist/ && firebase deploy --only hosting
```

### 8.4 Emergency Rollback Script

Keep this script handy in `scripts/rollback.sh`:

```bash
#!/bin/bash
# Emergency rollback — deploy a previous build
set -e

VERSION=${1:-"previous"}

if [ "$VERSION" = "previous" ]; then
  echo "Rolling back to previous build..."
  # Assumes you maintain a releases/ directory
  PREVIOUS=$(ls -t releases/ | sed -n '2p')
  if [ -z "$PREVIOUS" ]; then
    echo "ERROR: No previous build found in releases/"
    exit 1
  fi
  VERSION=$PREVIOUS
fi

echo "Rolling back to: $VERSION"
rm -rf dist
cp -r "releases/$VERSION" dist
firebase deploy --only hosting
echo "Rollback to $VERSION complete"
```

### 8.5 Rollback Best Practices

- **Keep last 3 builds** in `releases/` directory
- **Tag Git releases**: `git tag v1.2.3 && git push origin v1.2.3`
- **Database rollback**: Firestore has no snapshots — data changes are permanent. Rules and indexes rollback instantly with `firebase deploy --only firestore:rules,firestore:indexes`
- **Storage rollback**: Files are immutable once uploaded — rollback rules only affect new access

---

## 9. Post-Deploy Verification

### 9.1 Hosting Verification Checklist

After deployment, verify these items on the live site:

- [ ] **HTTPS**: Site loads over HTTPS (custom domain if configured)
- [ ] **SPA routing**: All routes resolve (e.g., `/leads`, `/deals`, `/listings`) — no 404s
- [ ] **Build hash**: Confirm the deployed JS/CSS hashes match the latest build
- [ ] **Service worker**: `https://your-site.web.app/firebase-messaging-sw.js` serves correctly
- [ ] **Security headers**: Check response headers:
  ```bash
  curl -sI https://your-site.web.app/ | grep -E "X-Content-Type-Options|X-Frame-Options|X-XSS-Protection|Referrer-Policy"
  ```
- [ ] **Cache headers**: Static assets return `Cache-Control: public, max-age=31536000, immutable`
- [ ] **Custom domain**: If using a custom domain, verify DNS records and SSL cert provisioning
- [ ] **Login flow**: Email/password and Google OAuth both work
- [ ] **Responsive**: Mobile layout renders correctly

### 9.2 Firestore Rules Verification

```bash
# Rules are active immediately after deploy — test programmatically
# Use the Firebase Emulator Suite for comprehensive rule testing:
firebase emulators:start --only firestore

# Manual verification via Firebase Console:
# 1. Go to Firestore → Rules
# 2. Verify the latest rules are displayed
# 3. Try accessing data with different auth states (use incognito)
```

### 9.3 Performance Verification

```bash
# Check Lighthouse score (local)
npx lighthouse https://your-site.web.app --view

# Check Firebase Hosting latency
curl -w "@curl-format.txt" -o /dev/null -s https://your-site.web.app/
```

### 9.4 Firebase Console Health Checks

| Console                                       | What to Check                                  |
| --------------------------------------------- | ---------------------------------------------- |
| **Firebase Console → Hosting**                | Current release version, active channels       |
| **Firebase Console → Firestore → Data**       | Data appearing correctly, no unintended writes |
| **Firebase Console → Firestore → Usage**      | Read/write counts, daily quota                 |
| **Firebase Console → Storage → Files**        | Uploads working, bucket size                   |
| **Firebase Console → Authentication → Users** | New user sign-ups, login errors                |
| **Firebase Console → Performance**            | Page load times, network latency               |
| **Firebase Console → Crashlytics**            | JS errors, unhandled exceptions                |
| **Firebase Console → Analytics → Events**     | User engagement, active users                  |

---

## 10. Monitoring & Alerting

### 10.1 Firebase Performance Monitoring

- **Enable in Firebase Console → Performance**
- Monitors: page load, network requests, screen rendering
- Alerts: set thresholds for slow page loads (>3s)
- No code changes required for basic monitoring (automatic)

### 10.2 Firebase Crashlytics (JavaScript)

- **Enable in Firebase Console → Crashlytics**
- Built-in: unhandled JS exceptions are automatically captured
- Add custom logging for better diagnostics:

  ```typescript
  import { logEvent } from "firebase/analytics";
  import { analytics } from "@/lib/firebase";

  logEvent(analytics, "deploy_verified", { version: "1.2.3" });
  ```

### 10.3 Firebase Analytics Events

The app should fire key events to monitor business health:

| Event               | Trigger              | Business Metric  |
| ------------------- | -------------------- | ---------------- |
| `lead_created`      | New lead added       | Lead gen rate    |
| `deal_closed`       | Deal marked closed   | Revenue tracking |
| `viewing_scheduled` | Viewing booked       | Agent activity   |
| `brochure_shared`   | Brochure link copied | Marketing reach  |
| `user_login`        | User signs in        | DAU/MAU          |
| `error_occurred`    | Unhandled exception  | App health       |

### 10.4 Custom Domain Monitoring

If using a custom domain:

- **Uptime monitoring**: Use [UptimeRobot](https://uptimerobot.com/) or [Better Uptime](https://betteruptime.com/) (free tier)
- **SSL expiry**: Set a calendar reminder 30 days before cert renewal (automatic with Firebase, but verify)
- **CDN status**: Firebase Hosting uses Google Cloud CDN — check [status.cloud.google.com](https://status.cloud.google.com/)

### 10.5 Budget Alerts

Set up **Google Cloud Budget Alerts** to prevent surprise bills:

1. Go to **Google Cloud Console → Billing → Budgets & alerts**
2. Create budget: link to the Firebase project
3. Set thresholds: 50%, 75%, 90%, 100% of monthly budget
4. Add email alert recipients

### 10.6 Firestore Usage Monitoring

- **Daily read/write quota**: Firebase Console → Firestore → Usage
- **Monthly free tier**: 50K reads, 20K writes, 20K deletes per day (Spark plan)
- **Blaze plan**: Pay-as-you-go — set a budget alert before scaling

---

## 11. Common Issues & Solutions

### 11.1 Build Failures

| Symptom                                     | Likely Cause                                  | Solution                                                           |
| ------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| `tsc -b` fails with type errors             | TypeScript strict mode catches issues         | Fix types or use `// @ts-expect-error` with comment                |
| `vite build` fails — missing env var        | `.env.production` not created or missing keys | Create `.env.production` with all 6 VITE\_ variables               |
| `firebase deploy` fails — not authenticated | Not logged in                                 | `firebase login`                                                   |
| Build OK but blank page on deploy           | SPA rewrite missing in `firebase.json`        | Add `"rewrites": [{"source": "**", "destination": "/index.html"}]` |

### 11.2 Runtime Issues

| Symptom                        | Likely Cause                              | Solution                                                                                 |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Push notifications not working | FCM service worker has placeholder config | Update `dist/firebase-messaging-sw.js` with real keys                                    |
| 404 on page refresh (not `/`)  | Missing SPA rewrite rule                  | Ensure `firebase.json` has the rewrite config                                            |
| CORS errors on file uploads    | Storage bucket CORS not configured        | `gsutil cors set cors.json gs://your-project.appspot.com`                                |
| Google OAuth not working       | Auth domain not in Firebase Console       | Add custom domain to **Authentication → Settings → Authorized domains**                  |
| Firestore permission denied    | Rules not matching query pattern          | Review `firestore.rules` — `inMyOrg(resource)` requires `brokerId` field on the document |
| Images not loading on brochure | Storage rule for public read not applied  | Verify `match /listings/{userId}/{allPaths=**}` has `allow read: if true;`               |
| Slow first page load           | Unoptimized bundle size                   | Run `vite build --report` and analyze with `vite-bundle-analyzer`                        |

### 11.3 Deployment-Specific Issues

| Symptom                                  | Likely Cause                       | Solution                                                                              |
| ---------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| `firebase deploy` fails with quota error | Concurrent deploys or large assets | Wait and retry; check `dist/` size                                                    |
| Preview channel not accessible           | Channel expired                    | Redeploy with `--expires 30d`                                                         |
| Custom domain shows "Site Not Found"     | DNS propagation delay              | Wait up to 24h; verify DNS records in Firebase Console                                |
| Slow Firestore queries after deploy      | Missing composite index            | Check error logs for index creation links; `firebase deploy --only firestore:indexes` |

### 11.4 Rollback Issues

| Symptom                                | Likely Cause                     | Solution                                                                    |
| -------------------------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| Can't find previous version in Console | Deploy was from CI (not Console) | Use `git log` to find the stable commit and redeploy                        |
| Rollback didn't fix the issue          | Database schema changed          | Rollback is for hosting only — data changes are permanent                   |
| Service worker is stale after rollback | SW cached in browser             | Force reload: open DevTools → Application → Clear storage → Clear site data |

---

## 12. CI/CD Pipeline

### 12.1 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: yarn

      - run: yarn install --immutable
      - run: yarn typecheck
      - run: yarn lint
      - run: yarn test
      - run: yarn build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      # Inject FCM config into built service worker
      - name: Inject FCM config
        run: |
          sed -i "s/YOUR_API_KEY/${{ secrets.VITE_FIREBASE_API_KEY }}/g" dist/firebase-messaging-sw.js
          sed -i "s/YOUR_PROJECT\.firebaseapp\.com/${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}/g" dist/firebase-messaging-sw.js
          sed -i "s/YOUR_PROJECT_ID/${{ secrets.VITE_FIREBASE_PROJECT_ID }}/g" dist/firebase-messaging-sw.js
          sed -i "s/YOUR_PROJECT\.appspot\.com/${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}/g" dist/firebase-messaging-sw.js
          sed -i "s/YOUR_SENDER_ID/${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}/g" dist/firebase-messaging-sw.js
          sed -i "s/YOUR_APP_ID/${{ secrets.VITE_FIREBASE_APP_ID }}/g" dist/firebase-messaging-sw.js

      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
```

### 12.2 CI/CD — Required Secrets

Add these secrets to GitHub → Settings → Secrets and variables → Actions:

| Secret                              | Source                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase Console → Project Settings                                                                              |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase Console → Project Settings                                                                              |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase Console → Project Settings                                                                              |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase Console → Project Settings                                                                              |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings                                                                              |
| `VITE_FIREBASE_APP_ID`              | Firebase Console → Project Settings                                                                              |
| `FIREBASE_SERVICE_ACCOUNT`          | Generate: `firebase init` then use `firebase login:ci` token or create a service account JSON key in GCP Console |

### 12.3 Deployment Strategy Summary

| Scenario           | Action                                                              |
| ------------------ | ------------------------------------------------------------------- |
| **Hotfix**         | Push to `main` → CI builds + deploys automatically (~3 min)         |
| **Feature test**   | Create preview channel via CLI → share URL with QA                  |
| **Staged rollout** | Deploy to preview → test → `firebase hosting:clone` to live         |
| **Emergency**      | Rollback via Console (2 clicks) or redeploy previous tag            |
| **Rules change**   | `firebase deploy --only firestore:rules,storage` (instant)          |
| **Index change**   | `firebase deploy --only firestore:indexes` (takes 1–5 min to build) |

---

## Quick Reference — Common Commands

```bash
# Build
npm run build

# Deploy everything
firebase deploy

# Deploy just frontend
firebase deploy --only hosting

# Deploy rules only
firebase deploy --only firestore:rules,storage

# Preview channel
firebase hosting:channel:deploy staging --expires 7d

# List channels
firebase hosting:channel:list

# Delete channel
firebase hosting:channel:delete staging

# Promote to production
firebase hosting:clone your-project/staging your-project/live

# Check Firestore indexes
firebase firestore:indexes
```
