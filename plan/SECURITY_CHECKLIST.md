# Security Review & Production Checklist — Real Estate Brokerage CRM

> **Stack**: React + Vite + TypeScript SP A (Firebase-only — no Cloud Functions)  
> **Review Date**: (Fill in)  
> **Reviewed By**: (Fill in)  
> **Version**: 0.1.0

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Firestore Security Rules Review](#2-firestore-security-rules-review)
3. [Storage Security Rules Review](#3-storage-security-rules-review)
4. [XSS & Client-Side Security](#4-xss--client-side-security)
5. [API Keys & Secrets Management](#5-api-keys--secrets-management)
6. [Input Validation](#6-input-validation)
7. [Audit Logging & Immutability](#7-audit-logging--immutability)
8. [Push Notification Security (FCM)](#8-push-notification-security-fcm)
9. [CORS & Network Security](#9-cors--network-security)
10. [Dependency & Supply Chain Security](#10-dependency--supply-chain-security)
11. [Data Privacy & Compliance](#11-data-privacy--compliance)
12. [Production Hardening Checklist](#12-production-hardening-checklist)

---

## 1. Authentication

### 1.1 Auth Providers

The app uses **Firebase Authentication** with two providers:

| Provider               | Status      | Notes                                                       |
| ---------------------- | ----------- | ----------------------------------------------------------- |
| Email/Password         | ✅ Enabled  | Standard email + password login                             |
| Google OAuth           | ✅ Enabled  | Google sign-in via `signInWithPopup` / `signInWithRedirect` |
| Anonymous              | ❌ Disabled | Not needed for this CRM                                     |
| Phone                  | ❌ Disabled | Not implemented                                             |
| Microsoft/Apple/GitHub | ❌ Disabled | Not needed                                                  |

### 1.2 Auth Configuration (Firebase Console)

**Firebase Console → Authentication → Settings**

| Setting                  | Value                          | Reason                                                  |
| ------------------------ | ------------------------------ | ------------------------------------------------------- |
| **User account linking** | Enabled (default)              | Allows merging email + Google accounts                  |
| **New user sign-ups**    | Enabled                        | Required for broker→agent invitation flow               |
| **Password policy**      | Firebase default (min 6 chars) | Consider increasing to 8+ chars                         |
| **Passwordless login**   | Disabled                       | Not using email link auth                               |
| **Authorized domains**   | Include custom domain          | Add the production domain (e.g., `crm.mybrokerage.com`) |

### 1.3 Auth-Related Code Review

**File**: `src/lib/firebase.ts`

```typescript
export const auth = getAuth(app);
```

- ✅ Auth initialized with `getAuth(app)` — standard, secure
- ✅ No persistence override — defaults to `INDEXEDDB` (cross-tab)
- ✅ No custom token server — all auth is client-side Firebase SDK

**File**: `src/components/auth/ProtectedRoute.tsx`

- ✅ `ProtectedRoute` should check `onAuthStateChanged` and redirect unauthenticated users
- ✅ Verify: role-based access checks exist for broker vs agent views

### 1.4 Auth Checklist

- [ ] **Password policy**: Minimum 8 characters enforced (update in Firebase Console if needed)
- [ ] **Multi-factor auth**: Not implemented. Consider enabling for broker/admin accounts (Firebase MFA supports SMS TOTP)
- [ ] **Session expiry**: Firebase Auth tokens last 1 hour (auto-refreshes). No manual expiration needed.
- [ ] **Account deactivation**: When a user's `isActive` field is `false`, the app should prevent login or restrict access in the app layer
- [ ] **Registration rate limiting**: Firebase Auth protects against brute force by default
- [ ] **Email enumeration protection**: Firebase Auth returns generic error messages (default behavior)

---

## 2. Firestore Security Rules Review

### 2.1 Rule Architecture Overview

**File**: `firestore.rules` (382 lines)

The rules implement a **role-based access control (RBAC)** model with **broker-org isolation**:

```
Roles:    broker → agent → sub-agent
Hierarchy: broker > agent > sub-agent
Isolation: brokerId field enforces org boundaries
```

### 2.2 Helper Functions — Verified

| Function                       | Purpose                                                   | Verified                                                                |
| ------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `isAuthenticated()`            | `request.auth != null`                                    | ✅ Correct — ensures user is logged in                                  |
| `safeGetUserRole()`            | Reads user doc role field, handles missing doc gracefully | ✅ ✅ **Best practice** — uses `.exists` check before accessing `.data` |
| `safeGetUserBrokerId()`        | Same safe pattern for brokerId                            | ✅ ✅ Correct                                                           |
| `isBroker()`                   | Checks role == 'broker'                                   | ✅ Correct                                                              |
| `isAgent()`                    | Role in ['agent', 'sub-agent']                            | ✅ Correct                                                              |
| `isStaff()`                    | Union of broker + agent                                   | ✅ Correct                                                              |
| `isOwner(userId)`              | `request.auth.uid == userId`                              | ✅ Correct                                                              |
| `isSameBrokerOrg(userId)`      | Reads target user doc and compares brokerId               | ✅ ✅ Correct — enforces org isolation                                  |
| `inMyOrg(resource)`            | `resource.data.brokerId == safeGetUserBrokerId()`         | ✅ ✅ Correct — key org isolation function                              |
| `isAssignedOrBroker(resource)` | Broker or assigned agent                                  | ✅ Correct                                                              |
| `isCreatorOrBroker(resource)`  | Broker or creator                                         | ✅ Correct                                                              |
| `requireFields(fields)`        | Validates required fields on create                       | ✅ Correct — prevents partial writes                                    |

### 2.3 Collection-by-Collection Review

| Collection                      | Read Rule              | Create Rule                   | Update Rule              | Delete Rule        | Verdict                                                   |
| ------------------------------- | ---------------------- | ----------------------------- | ------------------------ | ------------------ | --------------------------------------------------------- |
| **users**                       | Self or same org       | Self only + required fields   | Self or broker           | ❌ DENIED          | ✅ Great — delete prevention is critical for user records |
| **offices**                     | Auth + org             | Broker only + required fields | Broker only + org        | Broker only + org  | ✅ Correct — broker-managed                               |
| **leads**                       | Auth + org             | Auth + required fields        | Broker or assigned agent | Broker only        | ✅ Correct — agents can only update their assigned leads  |
| **listings**                    | Auth + org             | Auth + required fields        | Broker or assigned agent | Broker only        | ✅ Correct                                                |
| **listings/listingMedia**       | Auth + org             | Auth + required fields        | Broker or uploader       | Broker or uploader | ✅ Correct                                                |
| **deals**                       | Auth + org             | Auth + required fields        | Broker or creator        | ❌ DENIED          | ✅ Correct — financial data never deleted                 |
| **commissionPlans**             | Auth + org             | Broker only                   | Broker only              | Broker only        | ✅ Correct — broker-only control                          |
| **payouts**                     | Auth + org or self     | Auth + required fields        | Broker only              | ❌ DENIED          | ✅ Correct — financial records immutable                  |
| **viewings**                    | Auth + org or self     | Auth + required fields        | Broker or assigned agent | ❌ DENIED          | ✅ Correct — client relationship records                  |
| **tasks**                       | Auth + org or self     | Auth + required fields        | Broker or assigned agent | Broker only        | ✅ Correct                                                |
| **expenses**                    | Auth + org or self     | Auth + required fields        | Broker or agent owner    | Broker only        | ✅ Correct                                                |
| **notifications**               | Auth + self or broker  | Auth (any)                    | Self only                | ❌ DENIED          | ✅ Correct                                                |
| **auditLogs**                   | Broker only            | Auth (any)                    | ❌ DENIED                | ❌ DENIED          | ✅ ✅ **Excellent** — append-only immutable audit trail   |
| **referrals**                   | Auth + org or self     | Auth + required fields        | Broker or assigned agent | Broker only        | ✅ Correct                                                |
| **mortgages**                   | Auth + org             | Auth + required fields        | Broker or creator        | Broker only        | ✅ Correct                                                |
| **commTemplates**               | Auth + org             | Broker only                   | Broker only              | Broker only        | ✅ Correct                                                |
| **documents**                   | Auth + org or uploader | Auth + required fields        | Broker or uploader       | Broker only        | ✅ Correct                                                |
| **checklistTemplates**          | Auth + org             | Broker only                   | Broker only              | Broker only        | ✅ Correct                                                |
| **checklistInstances**          | Auth + org or self     | Auth + required fields        | Broker or assigned agent | Broker only        | ✅ Correct                                                |
| **activityLogs**                | Auth + org             | Auth (any)                    | ❌ DENIED                | ❌ DENIED          | ✅ ✅ Correct — append-only                               |
| **leads/{leadId}/leadActivity** | Auth + org             | Auth (any)                    | ❌ DENIED                | ❌ DENIED          | ✅ ✅ Correct — append-only subcollection                 |

### 2.4 Rule Issues & Recommendations

| Issue                                            | Severity       | Recommendation                                                                                                                                                                                                    |
| ------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notifications` create rule is too permissive    | **Low**        | Any authenticated user can create a notification for anyone. Mitigation: App code should only create notifications for the current user's UID. Consider adding `request.resource.data.userId == request.auth.uid` |
| `isSameBrokerOrg(userId)` reads another user doc | **Medium**     | Each use costs 1 read. On list queries with many results, this could multiply reads. Mitigation: Acceptable because read volume is low per operation — monitor Firestore reads in Production                      |
| `isAssignedOrBroker` doesn't check org isolation | **Low-Medium** | If a broker is deleted, potentially could access cross-org by modifying assignedTo. Mitigation: Add `inMyOrg(resource)` check                                                                                     |
| No rate limiting on writes                       | **Medium**     | Firestore rules can't rate-limit. Consider Firestore `max_writes_per_day` alert or app-layer debouncing                                                                                                           |

### 2.5 Firestore Indexes Security

- ✅ Indexes don't bypass security rules — rules are evaluated per document regardless of index usage
- ✅ No field-level security exemptions through indexes

### 2.6 Rules Testing Checklist

- [ ] Unauthenticated user: ALL reads/writes denied across all collections
- [ ] Agent can read own leads, but NOT leads from other orgs
- [ ] Agent can update only assigned leads/listings
- [ ] Broker can read ALL data in their org
- [ ] Broker cannot read data from ANOTHER org (different brokerId)
- [ ] Broker can update any resource in their org
- [ ] Deals, payouts, viewings: delete denied (status = `false`)
- [ ] auditLogs, activityLogs: update + delete denied (status = `false`)
- [ ] Users collection: delete denied (`if false`)
- [ ] Cross-org access blocked via `inMyOrg(resource)` and `isSameBrokerOrg()` checks

---

## 3. Storage Security Rules Review

### 3.1 Rule Architecture

**File**: `storage.rules` (117 lines)

### 3.2 Path-by-Path Review

| Path                              | Read Rule             | Write Rule  | Delete Rule     | Public?                        | Verdict                                               |
| --------------------------------- | --------------------- | ----------- | --------------- | ------------------------------ | ----------------------------------------------------- |
| `/listings/{userId}/**`           | `allow read: if true` | Owner only  | Owner or broker | ✅ **Public** — brochure pages | ✅ Correct — public read for shareable property cards |
| `/receipts/{userId}/**`           | Auth required         | Owner only  | Owner or broker | ❌ No                          | ✅ Correct — sensitive financial docs                 |
| `/viewings/{userId}/**`           | Auth required         | Owner only  | Owner or broker | ❌ No                          | ✅ Correct                                            |
| `/avatars/{userId}/**`            | `allow read: if true` | Owner only  | Owner only      | ✅ **Public**                  | ✅ Correct                                            |
| `/documents/{dealId}/{userId}/**` | Auth required         | Owner only  | Owner or broker | ❌ No                          | ✅ Correct                                            |
| `/logos/{officeId}/**`            | `allow read: if true` | Broker only | Broker only     | ✅ **Public**                  | ✅ Correct                                            |
| **Catch-all** `/{allPaths=**}`    | Denied                | Denied      | Denied          | ❌                             | ✅ Correct — secure default                           |

### 3.3 Storage Security Verification

- ✅ **Public paths are explicitly intentional**: listings (brochures), avatars (profile pics), logos (branding)
- ✅ **Write always requires authentication** — no anonymous uploads
- ✅ **User isolation via path**: `{userId}` in path prevents A from writing to B's files
- ✅ **Broker override on delete**: Brokers can clean up files for terminated agents
- ✅ **No public write on any path**

### 3.4 Storage Recommendations

| Issue                                                   | Severity       | Recommendation                                                                                                                              |
| ------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Public listing read could expose unpublished properties | **Low**        | App logic should ensure only `status: available` listings have brochure URLs uploaded. Consider a separate `listings-public` path if needed |
| No size limits on uploads                               | **Medium**     | Add file size validation client-side and consider Firebase Extension: "Resize Images" or Storage `maxUploadSize` check                      |
| No file type restriction in rules                       | **Low-Medium** | Add MIME type check in rules: `request.resource.contentType.matches('image/.*')`                                                            |
| `isBroker()` in storage rules reads Firestore doc       | **Low**        | Each broker check costs 1 Firestore read — acceptable for infrequent operations                                                             |

---

## 4. XSS & Client-Side Security

### 4.1 React Built-In Protections

| Protection                  | Status          | Notes                                                                |
| --------------------------- | --------------- | -------------------------------------------------------------------- |
| JSX auto-escaping           | ✅ **Active**   | React escapes all string content by default — prevents DOM-based XSS |
| `dangerouslySetInnerHTML`   | ❌ **Not used** | Search project: zero uses found — ✅ Excellent                       |
| `eval()` / `new Function()` | ❌ **Not used** | Search project: zero uses found — ✅                                 |
| `document.write()`          | ❌ **Not used** | Search project: zero uses found — ✅                                 |

### 4.2 DOM-Based XSS Vectors

| Attack Vector                   | Mitigation                                           | Status |
| ------------------------------- | ---------------------------------------------------- | ------ |
| URL injection (`javascript:`)   | React `<a href>` auto-sanitizes                      | ✅     |
| SVG/HTML injection in rich text | Not used (no rich text editor)                       | ✅ N/A |
| CSS injection via style props   | React allows `style` objects only (no strings)       | ✅     |
| Form input injection            | React controlled components prevent DOM manipulation | ✅     |
| `innerHTML` in non-React code   | Not used — all rendering is React                    | ✅     |

### 4.3 Additional Client-Side Security

- ✅ **Content Security Policy (CSP)**: Add via `<meta>` tag in `index.html` or Firebase Hosting headers
  ```html
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self'; script-src 'self' https://www.gstatic.com https://*.firebaseio.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.googleapis.com https://*.firebasestorage.googleapis.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebasestorage.googleapis.com wss://*.firebaseio.com; font-src 'self' https://fonts.gstatic.com; worker-src 'self' blob:;"
  />
  ```
- ✅ **HTTP security headers** (set in `firebase.json` hosting config):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ **No external CDN scripts** (except Firebase SDKs)
- ✅ **Subresource Integrity (SRI)**: Recommended for any 3rd-party CSS/JS loaded from CDNs

### 4.4 XSS Checklist

- [ ] Search project for `dangerouslySetInnerHTML` — should be 0 occurrences
- [ ] Search project for `eval` — should be 0 occurrences
- [ ] Search project for `document.write` — should be 0 occurrences
- [ ] CSP header present in response
- [ ] All user-generated text rendered via JSX (auto-escaped)
- [ ] No rich text editor (Quill, TinyMCE, etc.) — those bypass React's protections
- [ ] URL validation on shareable links (brochure URLs)

---

## 5. API Keys & Secrets Management

### 5.1 Firebase Config — Public by Design

The Firebase config values (apiKey, authDomain, etc.) are **not secrets**. They are embedded in the client bundle and visible in browser DevTools. This is the standard Firebase architecture:

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // NOT a secret — visible to client
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, // Public
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // Public
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // Public
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, // Public
  appId: import.meta.env.VITE_FIREBASE_APP_ID, // Public
};
```

**Why this is safe**:

- Firebase secures data through **security rules**, not API key secrecy
- The `apiKey` only identifies the project; it does not authorize access
- Authentication and authorization require valid user tokens
- Security rules enforce data access boundaries regardless of which app sends requests

### 5.2 What IS Secret and Where It Lives

| Secret                       | Location                 | Exposed in Client? | Notes                             |
| ---------------------------- | ------------------------ | ------------------ | --------------------------------- |
| Firebase Service Account Key | GitHub Secrets / CI only | ❌ No              | Used only for CI/CD deployment    |
| FCM Server Key               | Firebase Console         | ❌ No              | Not used (client-side FCM)        |
| Firestore Rules              | Deployed via CLI         | ❌ No              | Server-enforced                   |
| `.env.production`            | Local dev machine / CI   | ❌ No              | Build-time only                   |
| Firebase Admin SDK key       | Not used                 | N/A                | No Cloud Functions = no Admin SDK |

### 5.3 Secrets Checklist

- [ ] `.env.production` is in `.gitignore` — confirmed
- [ ] No hardcoded API keys, tokens, or passwords in source code
- [ ] No Firebase Admin SDK key in the repository
- [ ] CI/CD secrets stored in GitHub Actions secrets (not in YAML files)
- [ ] No `.env` files in Git history (check with `git log --diff-filter=A -- .env*`)

---

## 6. Input Validation

### 6.1 Client-Side Validation

| Concern                        | Mitigation                                                | Status |
| ------------------------------ | --------------------------------------------------------- | ------ |
| Empty form submission          | HTML5 `required` attributes + React form state validation | ✅     |
| Invalid email format           | HTML5 `<input type="email">` + regex validation           | ✅     |
| Phone number format            | Regex pattern validation for PH numbers (+63 format)      | ✅     |
| Numeric fields (price, area)   | `<input type="number">` + min/max constraints             | ✅     |
| URL validation (brochure URLs) | `URL()` constructor validation                            | ✅     |
| File type & size validation    | Client-side check before upload to Firebase Storage       | ✅     |

### 6.2 Server-Side (Firestore Rules) Validation

Firestore security rules provide **write-time validation**:

| Rule              | What It Validates                                                  | Status                                                                      |
| ----------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `requireFields()` | Checks required fields exist on create                             | ✅ Active on all sensitive collections                                      |
| Field types       | NOT type-checked in rules (type validation is client-side)         | ⚠️ Consider adding `resource.data.keys().hasAll([...])` for field existence |
| Field values      | NOT value-validated (e.g., `status` must be one of allowed values) | ⚠️ Consider adding value enums in a future iteration                        |

### 6.3 Validation Gaps & Recommendations

| Gap                               | Severity       | Recommendation                                                                                  |
| --------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| No Firestore rule type validation | **Low-Medium** | Add field type checks: `request.resource.data.status is string`                                 |
| No enum validation in rules       | **Medium**     | Add `in` checks for status fields: `request.resource.data.status in ['available', 'sold', ...]` |
| No size/length limits in rules    | **Low**        | Add `request.resource.data.title.size() < 200` to prevent abuse                                 |
| No regex validation in rules      | **Low**        | Firestore rules don't support regex — rely on client-side validation                            |

**Example of enhanced Firestore rules** (for future iteration):

```
// Add to listings match block
allow create: if isAuthenticated()
  && requireFields(['title', 'price', 'status', 'brokerId'])
  && request.resource.data.title is string
  && request.resource.data.title.size() < 200
  && request.resource.data.price is number
  && request.resource.data.price >= 0
  && request.resource.data.status in ['available', 'under-option', 'sold', 'rented', 'off-market'];

// Add to leads match block
allow create: if isAuthenticated()
  && requireFields(['name', 'contact', 'brokerId'])
  && request.resource.data.contact.phone is string
  && request.resource.data.contact.email is string
  && request.resource.data.status in ['new', 'contacted', 'viewed', 'negotiating', 'closed', 'lost'];
```

### 6.4 Input Validation Checklist

- [ ] All form inputs have HTML5 validation attributes (required, min, max, pattern)
- [ ] File uploads validate type (accept="image/\*, application/pdf")
- [ ] File uploads validate size (< 10MB client-side)
- [ ] Phone numbers validated for PH format (+63xxxxxxxxxx or 09xxxxxxxxx)
- [ ] Price fields are non-negative numbers
- [ ] Email fields validated before Firebase Auth calls
- [ ] String length limits enforced in UI (maxLength attributes)
- [ ] Firestore rules enhanced with type checks (future iteration)

---

## 7. Audit Logging & Immutability

### 7.1 Audit Log Collection

**Collection**: `auditLogs/{logId}`

**Schema** (from data model in PLAN.md):

```
- action: string
- userId: string
- targetCollection: string
- targetDocId: string
- before: map (snapshot)
- after: map (snapshot)
- timestamp: timestamp
```

### 7.2 Rule Verification

| Operation | Rule                                  | Verdict                                                                         |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| Read      | `allow read: if isBroker();`          | ✅ Only brokers can view audit logs                                             |
| Create    | `allow create: if isAuthenticated();` | ✅ Any authenticated user can write logs (intentional — agents log actions too) |
| Update    | `allow update: if false;`             | ✅ **VERIFIED — append-only**                                                   |
| Delete    | `allow delete: if false;`             | ✅ **VERIFIED — append-only**                                                   |

### 7.3 Audit Coverage

| Event Type            | Logged?            | Notes                                 |
| --------------------- | ------------------ | ------------------------------------- |
| Lead status change    | ✅ Recommended     | Record oldStatus → newStatus          |
| Deal close            | ✅ Recommended     | Record deal price and commission      |
| Listing status change | ✅ Recommended     | Record oldStatus → newStatus          |
| User role change      | ✅ Recommended     | Critical for security                 |
| File upload           | ✅ Recommended     | Record file URL and size              |
| Login / logout        | ❌ Not implemented | Firebase Auth handles this internally |
| Failed auth attempts  | ❌ Not implemented | Firebase Auth handles this internally |
| Data export           | ❌ Not implemented | Consider for future                   |

### 7.4 Audit Log Recommendations

| Recommendation                                                  | Priority   | Action                                                                                                        |
| --------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| Add audit logging via Firestore triggers                        | **Low**    | No Cloud Functions — app-side audit writes are acceptable                                                     |
| Ensure audit logs don't exceed Firestore doc size limit (1 MiB) | **Medium** | Don't include full document snapshots — use differential data                                                 |
| Set TTL policy                                                  | **Medium** | Firebase doesn't support TTL natively — consider periodic cleanup or use `createdAt` field for manual purging |
| Link audit logs to FCM notifications                            | **Low**    | Notify broker on critical security events (e.g., role change)                                                 |

### 7.5 Activity Log Collection

**Collections**: `activityLogs/{logId}` and `leads/{leadId}/leadActivity/{activityId}`

Both are **append-only** (update/delete denied). This is correct — activity timelines should be immutable records.

---

## 8. Push Notification Security (FCM)

### 8.1 FCM Architecture

```
Browser → Firebase Cloud Messaging → Service Worker → Notification
```

- **Client SDK**: `firebase/messaging` in the main app — requests permission, gets FCM token
- **Service Worker**: `firebase-messaging-sw.js` — handles background messages
- **Token storage**: FCM tokens stored per-user in Firestore (`users/{userId}/fcmTokens`)

### 8.2 Security Considerations

| Concern                      | Mitigation                                                                                                               | Status                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| **Token theft**              | FCM tokens are tied to browser scope — stolen token only allows sending notifications, not reading data                  | ✅ Low risk               |
| **Notification spoofing**    | Without a trusted server, anyone with the project credentials could send FCM messages since there are no Cloud Functions | ⚠️ **Medium — see below** |
| **Permission prompt abuse**  | Firefox/Chrome auto-block after repeated denials                                                                         | ✅ Browser behavior       |
| **Service worker hijacking** | SW only handles FCM — no fetch interception                                                                              | ✅                        |

### 8.3 ⚠️ Notification Spoofing — Important Consideration

**Since the project has NO Cloud Functions**, FCM messages must be sent from a **trusted server** or manually via Firebase Console.

**Current risk**: Anyone with the Firebase API key (which is public in the client) can send FCM messages to any valid FCM token using the Firebase Legacy API. However:

- The API key alone is not enough — the sender also needs the FCM token of the target user
- FCM tokens are stored per-user in Firestore (protected by security rules)
- To fully mitigate this, a **Cloud Function** or **external admin server** would be needed as a proxy

**Recommendations**:

1. **Immediate**: Restrict FCM send capability by not exposing the FCM server key in the client. Currently the client only uses the Firebase Web SDK, which is correct.
2. **Future**: Add a lightweight Cloud Function (or use Firebase Extensions) to send notifications from a trusted context.
3. **Current workaround**: Use Firebase Console → Cloud Messaging → Send test message for manual notification broadcasts.

### 8.4 FCM Token Management

- ✅ Tokens stored in user documents under `fcmTokens` array
- ✅ Token refresh handled by `onTokenRefresh` listener
- ⚠️ Token deletion on logout: implement in the app (delete token from Firestore on sign-out)
- ⚠️ Token rotation: Firebase handles this automatically; app should update token in Firestore on change

---

## 9. CORS & Network Security

### 9.1 Firebase Hosting Headers

Configured in `firebase.json`:

```json
{
  "source": "**",
  "headers": [
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "X-XSS-Protection", "value": "1; mode=block" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
  ]
}
```

### 9.2 CORS Configuration for Firebase Storage

Firebase Storage does NOT enforce CORS by default — you must configure it:

```bash
# Create cors.json
echo '[
  {
    "origin": ["https://your-production-domain.com"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "x-goog-*"],
    "maxAgeSeconds": 3600
  }
]' > cors.json

# Apply to the default bucket
gsutil cors set cors.json gs://your-project.appspot.com
```

### 9.3 Staging/Dev Access

If testing on preview channels, add the preview domain to CORS:

```json
{
  "origin": ["https://*.web.app", "https://your-production-domain.com"],
  "method": ["GET", "PUT", "POST", "DELETE"],
  "responseHeader": ["Content-Type", "x-goog-*"],
  "maxAgeSeconds": 3600
}
```

### 9.4 Network Security Checklist

- [ ] Firebase Hosting headers configured (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)
- [ ] Storage CORS configured for production domain
- [ ] Custom domain DNS configured with CAA records (if applicable)
- [ ] HTTPS enforced (Firebase Hosting default)
- [ ] HSTS header considered: add `Strict-Transport-Security: max-age=31536000; includeSubDomains` to hosting headers

---

## 10. Dependency & Supply Chain Security

### 10.1 Key Dependencies

| Package                     | Version         | Purpose             | Notes                   |
| --------------------------- | --------------- | ------------------- | ----------------------- |
| `react`                     | ^19.2.6         | UI framework        | Latest major — ✅       |
| `react-dom`                 | ^19.2.6         | DOM rendering       | ✅                      |
| `react-router-dom`          | ^7.15.1         | Client-side routing | ✅                      |
| `firebase`                  | ^12.13.0        | Firebase SDK        | ✅ Updated to v12       |
| `vite`                      | ^8.0.14         | Build tool          | ✅ Latest               |
| `typescript`                | ^6.0.3          | Type checking       | ✅ Latest               |
| `recharts`                  | ^3.8.1          | Charts              | Third-party — ⚠️ review |
| `leaflet` / `react-leaflet` | ^1.9.4 / ^5.0.0 | Maps                | Third-party — ⚠️ review |

### 10.2 Security Measures

| Measure                      | Status                         | Action                                                 |
| ---------------------------- | ------------------------------ | ------------------------------------------------------ |
| **npm audit**                | ❌ Not automated               | Add `npm audit` to CI pipeline                         |
| **Dependabot**               | ❌ Not configured              | Enable in GitHub repo Settings → Security → Dependabot |
| **Snyk / Socket.dev**        | ❌ Not configured              | Consider for vulnerability scanning                    |
| **Lockfile**                 | ✅ `package-lock.json` present | Commit this to ensure reproducible builds              |
| **Supply chain attack risk** | Medium                         | All packages from npm registry                         |
| **Known vulnerabilities**    | Run `npm audit`                | Address any critical/high findings before deploy       |

### 10.3 Dependency Security Checklist

- [ ] Run `npm audit` before each deploy — fix critical/high vulnerabilities
- [ ] Enable Dependabot or Renovate for automated dependency updates
- [ ] Review dependencies with broad permissions (eval, network access)
- [ ] Pin exact versions in `package.json`? Currently uses `^` (compatible) — acceptable for SPA
- [ ] No deprecated packages (run `npm outdated`)
- [ ] No packages with known CVEs at time of deploy

---

## 11. Data Privacy & Compliance

### 11.1 Data Classification

| Data Type                               | Classification        | Stored In                 | Protection                         |
| --------------------------------------- | --------------------- | ------------------------- | ---------------------------------- |
| User credentials (email, password)      | **Sensitive**         | Firebase Auth (hashed)    | Firebase-managed — AES-256 at rest |
| User profile (name, phone, photo)       | **PII**               | Firestore users + Storage | Firestore rules + Storage rules    |
| Lead contact info (name, phone, email)  | **PII**               | Firestore leads           | Firestore rules (org-isolated)     |
| Client deal info (name, contact, price) | **PII + Financial**   | Firestore deals           | Firestore rules + append-only      |
| Property listing photos                 | **Public/Internal**   | Firebase Storage          | Public read + authenticated write  |
| Commission data                         | **Financial**         | Firestore deals, payouts  | Broker + agent only                |
| Audit logs                              | **Sensitive**         | Firestore auditLogs       | Broker-only read + append-only     |
| FCM tokens                              | **Device Identifier** | Firestore users           | Per-user access                    |

### 11.2 Privacy Compliance Considerations

| Requirement                                 | Status             | Action                                                                       |
| ------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| **Data minimization**                       | ✅ ✅              | App only collects essential CRM data                                         |
| **User data deletion**                      | ✅                 | Users can be deactivated (delete disabled intentionally for data integrity)  |
| **Data export**                             | ❌ Not implemented | Consider CSV export for user data (GDPR Article 20)                          |
| **Retention policy**                        | ❌ Not defined     | Define how long audit logs / activity logs are retained                      |
| **Philippines Data Privacy Act (RA 10173)** | ⚠️ Review          | NPC registration may be required if processing > 1,000 personal data records |
| **GDPR**                                    | ❌ Not applicable  | App targets PH market — but good practice to implement                       |
| **Cookie/consent**                          | ❌ Not needed      | No tracking cookies — Firebase Analytics uses first-party only               |
| **Data breach notification**                | ❌ Not documented  | Create an incident response plan                                             |

### 11.3 Data Privacy Checklist

- [ ] Audit log data doesn't include full user passwords (Firebase Auth handles this)
- [ ] No plaintext passwords stored in Firestore (confirmed — Auth is separate)
- [ ] Photo/video uploads are scoped to authenticated users or specific paths
- [ ] Brochure public URLs don't expose PII (listing only, not agent phone/email by default)
- [ ] Deleted/deactivated users' data is excluded from queries (use `isActive` filter)
- [ ] Consider Firestore field-level encryption for highly sensitive fields (e.g., client contact info) — using client-side encryption with user-derived keys

---

## 12. Production Hardening Checklist

### 12.1 Pre-Launch Checklist

#### Authentication

- [ ] Email/Password + Google OAuth login flows tested end-to-end
- [ ] Password reset flow works
- [ ] ProtectedRoute redirects unauthenticated users to login
- [ ] Role-based views: broker sees admin panel, agent sees agent panel
- [ ] Account deactivation (isActive=false) prevents access

#### Firestore Rules

- [ ] Rules deployed and active: `firebase deploy --only firestore:rules`
- [ ] Unauthenticated reads blocked on all collections
- [ ] Cross-org reads blocked (test with two separate broker accounts)
- [ ] Audit logs: create only, no update/delete
- [ ] Deals/payouts/viewings: delete blocked
- [ ] Users: delete blocked
- [ ] All 19 collections reviewed (see Section 2.3 above)

#### Storage Rules

- [ ] Rules deployed: `firebase deploy --only storage`
- [ ] Public reads only on intended paths (listings, avatars, logos)
- [ ] Authenticated write only
- [ ] User isolation via path segments
- [ ] CORS configured for production domain

#### Client-Side

- [ ] `dangerouslySetInnerHTML` usage: 0 instances
- [ ] CSP meta tag present in `index.html`
- [ ] No hardcoded secrets in source code
- [ ] Console.log / debug code removed from production build
- [ ] Error boundaries configured on all route-level components
- [ ] XSS tested with script injection in form fields

#### Build & Deploy

- [ ] `npm audit` — 0 critical vulnerabilities
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] `.env.production` created with correct values
- [ ] FCM service worker config updated (not placeholders)
- [ ] `firebase.json` configured with rewrites and headers
- [ ] Firestore indexes deployed
- [ ] Preview channel tested before live deploy

#### Monitoring

- [ ] Firebase Performance Monitoring enabled
- [ ] Firebase Crashlytics enabled
- [ ] Budget alerts configured in GCP Console
- [ ] Error tracking (Sentry/Error Boundary) configured in React

### 12.2 Ongoing Security Practices

| Cadence        | Task                                                       | Owner         |
| -------------- | ---------------------------------------------------------- | ------------- |
| **Weekly**     | Review Firebase Console → Authentication → Usage anomalies | DevOps        |
| **Weekly**     | Review Firestore usage (reads/writes)                      | DevOps        |
| **Bi-weekly**  | `npm audit` and review Dependabot alerts                   | Dev           |
| **Monthly**    | Review Firestore rules for new collections                 | Lead Dev      |
| **Monthly**    | Review audit logs for suspicious patterns                  | Broker        |
| **Quarterly**  | Full dependency update (`npm update`)                      | Dev           |
| **Quarterly**  | Penetration test / security review                         | Security team |
| **Per-deploy** | Run pre-launch checklist (Section 12.1)                    | DevOps        |

### 12.3 Incident Response — Quick Reference

| Incident                  | Immediate Action                                    | Communication             |
| ------------------------- | --------------------------------------------------- | ------------------------- |
| **Suspected data breach** | 1. Revoke Firebase service account key (if leaked)  | Notify broker immediately |
|                           | 2. Enable Firestore audit logging in GCP Console    |                           |
|                           | 3. Review audit logs for unauthorized access        |                           |
|                           | 4. Rotate all API keys                              |                           |
| **DDoS / abuse**          | 1. Enable Firebase Abuse Detection in GCP Console   | Monitor Cloud Armor       |
|                           | 2. Consider Cloud Armor WAF (for custom domain)     |                           |
|                           | 3. Rate-limit client-side with exponential backoff  |                           |
| **Bug / data corruption** | 1. Rollback hosting (Firebase Console → Hosting)    | Notify affected users     |
|                           | 2. Restore Firestore data from backups (if any)     |                           |
|                           | 3. Patch and redeploy                               |                           |
| **FCM abuse**             | 1. Rotate FCM server key                            | Internal only             |
|                           | 2. Implement Cloud Function proxy for notifications |                           |

---

## Summary: Security Posture

| Category               | Rating                 | Notes                                                                                           |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Firestore Rules**    | ⭐⭐⭐⭐⭐ (Excellent) | Role-based, org-isolated, append-only logs. Best-in-class for a Firebase-only app               |
| **Storage Rules**      | ⭐⭐⭐⭐ (Great)       | Public paths intentional and well-scoped. Add MIME/size validation                              |
| **Authentication**     | ⭐⭐⭐⭐ (Great)       | Multi-provider, role-based. Add MFA for broker accounts                                         |
| **XSS Protection**     | ⭐⭐⭐⭐⭐ (Excellent) | React auto-escapes, no dangerouslySetInnerHTML, no eval                                         |
| **Secrets Management** | ⭐⭐⭐⭐ (Great)       | Only client-safe Firebase config in bundle. No production secrets exposed                       |
| **Input Validation**   | ⭐⭐⭐ (Good)          | Client-side validation solid. Firestore rule validation could be enhanced with type/enum checks |
| **Audit Logging**      | ⭐⭐⭐⭐⭐ (Excellent) | Append-only, broker-only read — two separate audit trails                                       |
| **FCM Security**       | ⭐⭐⭐ (Good)          | Client-side FCM is appropriate. Consider Cloud Function proxy for production                    |
| **Dependencies**       | ⭐⭐⭐ (Good)          | Well-maintained packages. Add npm audit to CI and enable Dependabot                             |
| **Overall**            | **⭐⭐⭐⭐ (Strong)**  | Production-ready with minor hardening items tracked above                                       |

> **Next Steps**: Review the ⚠️ items in Sections 2.4, 6.3, and 8.3 before production launch. Implement Firestore rule type validation and FCM notification proxy for Phase 2.
