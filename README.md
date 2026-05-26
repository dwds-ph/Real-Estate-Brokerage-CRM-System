# Real Estate Brokerage CRM & Project Management System

A comprehensive CRM + Project Management platform tailored for the Philippine real estate industry. Empowers brokers, property developers, and freelance agents to capture leads, manage listings, track commissions, organize agent hierarchies, and schedule property viewings.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + ShadCN/ui
- **Backend:** Firebase-only (no Cloud Functions)
- **Database:** Firestore
- **Auth:** Firebase Auth (email/password + Google OAuth)
- **Storage:** Firebase Storage
- **Hosting:** Firebase Hosting
- **Notifications:** Firebase Cloud Messaging

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase project with Auth, Firestore, Storage, and Hosting enabled

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/dwds-ph/Real-Estate-Brokerage-CRM-System.git
   cd Real-Estate-Brokerage-CRM-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_SENTRY_DSN=your_sentry_dsn
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

## Project Structure

```
src/
├── components/     # Reusable components
│   ├── auth/       # Auth-related components
│   ├── layout/     # Layout components (sidebar, header)
│   └── ui/         # Generic UI components
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── lib/            # Utilities and Firebase config
├── pages/          # Route pages
├── services/       # Firestore data access
├── styles/         # Additional styles
└── types/          # TypeScript type definitions
```

## Architecture

- **Firebase-only** — no Cloud Functions. Firestore security rules act as the backend.
- **Client-side commission calculation** — raw deal data is source of truth.
- **Manual FB lead entry** (v1) — leads captured via form entry.
- **Push notifications** via Firebase Cloud Messaging.

## Features

- Lead Management (CRUD, status workflow, scoring, duplicate detection)
- Deal Pipeline (Kanban board with drag & drop)
- Property Listing Management (media, status, flood tags, amenities)
- Property Brochure Generator (shareable public pages)
- Viewing Schedule Tracker (calendar, check-in, feedback)
- Client Portal (public page per client)
- Commission Tracking (fixed %, tiered split, referral, co-broking)
- PH-Specific Tools (Pag-IBIG calc, Bank calc, Title Status Tracker, BIR Tax Estimator)
- Agent Hierarchy (broker → agents → sub-agents)
- Task Management
- Notes & Mentions
- Expense Tracking
- Push & In-App Notifications
- Broker Command Center (dashboard, leaderboard, analytics)

## License

MIT
