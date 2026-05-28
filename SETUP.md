# Setup Guide — Go Live

This guide walks you through taking the CRM from code to live production.

---

## Prerequisites

```bash
node -v       # ≥ 20
npm -g ls     # firebase-tools installed
```

Install firebase-tools if missing:

```bash
npm install -g firebase-tools
```

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Create a project** (or select existing)
3. Enable **Google Analytics** (recommended)
4. Wait for provisioning

---

## Step 2: Enable Firebase Services

### 🔐 Authentication

- Go to **Authentication → Sign-in method**
- Enable **Email/Password** provider
- (Optional) Enable **Google** provider

### 📦 Firestore Database

- Go to **Firestore Database → Create database**
- Choose **Start in test mode** (we'll apply rules in deploy)
- Select a region close to the Philippines (e.g., `asia-southeast1`)

### 📁 Storage

- Go to **Storage → Get started**
- Choose **Start in test mode**

### 🌐 Hosting

- Go to **Hosting → Get started**
- Follow the quick-start (can skip — deploy script handles it)

---

## Step 3: Get Firebase Config Values

1. Go to **Project Settings → General → Your apps**
2. Click **Add app → Web** (</> icon)
3. Register the app (any nickname)
4. Copy the `firebaseConfig` values:

```
apiKey:            "AIza..."  →  VITE_FIREBASE_API_KEY
authDomain:        "...firebaseapp.com"  →  VITE_FIREBASE_AUTH_DOMAIN
projectId:         "..."  →  VITE_FIREBASE_PROJECT_ID
storageBucket:     "...appspot.com"  →  VITE_FIREBASE_STORAGE_BUCKET
messagingSenderId: "123456789"  →  VITE_FIREBASE_MESSAGING_SENDER_ID
appId:             "1:...:web:..."  →  VITE_FIREBASE_APP_ID
```

---

## Step 4: Configure the Project

### Local .env file

```bash
cp .env.example .env
# Now edit .env with the 6 Firebase values above
```

### Link Firebase project

```bash
firebase use --add
# Select your project from the list
# This updates .firebaserc with your real project ID
```

---

## Step 5: Deploy

```bash
./deploy.sh
```

This will:

1. Build the SPA (`yarn build`)
2. Deploy Firestore rules & indexes
3. Deploy Storage rules
4. Deploy to Firebase Hosting

**Your app is live at:** `https://<project-id>.web.app`

---

## Step 6: GitHub Actions CI (Optional but Recommended)

Add these **secrets** to your GitHub repo:
**Settings → Secrets and variables → Actions**

| Secret                              | Value       |
| ----------------------------------- | ----------- |
| `VITE_FIREBASE_API_KEY`             | From Step 3 |
| `VITE_FIREBASE_AUTH_DOMAIN`         | From Step 3 |
| `VITE_FIREBASE_PROJECT_ID`          | From Step 3 |
| `VITE_FIREBASE_STORAGE_BUCKET`      | From Step 3 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Step 3 |
| `VITE_FIREBASE_APP_ID`              | From Step 3 |
| `FIREBASE_SERVICE_ACCOUNT`          | See below ↓ |

### Getting the Firebase Service Account Key

1. **Firebase Console → Project Settings → Service Accounts**
2. Click **Generate new private key**
3. A JSON file downloads — paste its **entire contents** as the `FIREBASE_SERVICE_ACCOUNT` secret

---

## After Deployment

### Seed sample data

Visit `https://<project-id>.web.app/seed-data` to populate demo data.

### Create your first user

- Navigate to the login page
- Click **Register** to create an account
- Or add users manually in **Firebase Console → Authentication**

### Set up custom domain (optional)

- **Firebase Console → Hosting → Add custom domain**

---

## Local Development with Emulators

```bash
# Start Firebase emulators + Vite dev server
yarn dev:full
```

Emulator ports:

- Auth: `localhost:9099`
- Firestore: `localhost:8080`
- Storage: `localhost:9199`
- Emulator UI: `localhost:4000`

### Run E2E tests locally

```bash
yarn e2e:ci
```

(Requires Playwright browsers: `npx playwright install chromium`)
