# Real Estate Brokerage CRM & Project Management System — Plan

## 1. Vision

A comprehensive **CRM + Project Management** platform tailored for the Philippine real estate industry. It empowers brokers, property developers, and freelance agents to capture leads, manage listings, track commissions, organize agent hierarchies, and schedule property viewings — all in one place.

The system bridges the gap between traditional CRMs (too generic) and project management tools (no real estate context), with first-class support for the unique commission structures and agent hierarchies common in the Philippines.

---

## 2. Target Users

| Persona | Needs | Pain Points |
|---|---|---|
| **Broker** | Oversee agents, track commissions, get reports | No visibility into agent activity; manual commission computation |
| **Property Developer** | Manage inventory, assign agents, track sales pipeline | Fragmented tools; no unified view of listings and buyers |
| **Freelance Agent** | Capture leads from social media, schedule viewings, track deals | Juggling spreadsheets, missing follow-ups, no lead source tracking |
| **Buyer / Client** | View assigned properties, schedule viewings, see financing options | No transparency; relying on agent for everything |

---

## 3. Full Feature Map

### 3.1 Lead Management

- **Lead CRUD** — name, phone, email, source, status, assigned agent, notes, score
- **Lead status workflow** — New → Contacted → Viewed → Negotiating → Closed / Lost
- **Lead scoring** — hot / warm / cold (based on source + engagement)
- **Duplicate detection** — block/merge by phone number or email on creation
- **Lead assignment & transfer** — broker assigns to agent; agent requests transfer
- **Bulk import** — CSV upload of leads
- **Export** — leads to CSV/Excel
- **Communication log** — log calls, texts, meetings per lead with timestamp + notes
- **Activity timeline** — auto-log every action on a lead (viewed, contacted, status change)

### 3.2 Deal Pipeline (Kanban Board)

- **Visual pipeline** — drag & drop leads through status columns (New → Contacted → Viewed → Negotiating → Closed / Lost)
- **Per-agent pipeline** — each agent sees their own deals
- **Broker overview** — broker sees all agents' pipelines at a glance
- **Quick actions** — click a card to call, message, or schedule viewing

### 3.3 Property Listing Management

- **Listing CRUD** — title, description, price, location, lot area, floor area, bedrooms, bathrooms, furnishing, etc.
- **Media support** — image gallery (Firebase Storage), virtual tour URLs, floor plan uploads
- **Status tracking** — Available → Under Option → Sold / Rented / Off-Market
- **Listing assignment** — assign listings to specific agents
- **Tagging & categories** — condo, house & lot, lot only, commercial, foreclosed
- **Shareable brochure** — auto-generate a public property card (image + details) as a single-page link
- **Required docs checklist** — per property type, checklist of documents: title, tax dec, HOA clearance, etc.
- **Flood / hazard tag** — tag flood risk level (common buyer concern in PH)
- **Nearby amenities** — mark schools, hospitals, malls, LRT/MRT stations near property

### 3.4 Commission Tracking (PH-Specific)

- **Commission structures:**
  - **Fixed %** — standard broker share (e.g., 3–5% of selling price)
  - **Tiered split** — broker takes X%, agent takes Y% (e.g., 50/50, 60/40)
  - **Referral fee** — fixed amount per referral
  - **Escalating tiers** — agent gets higher % after hitting volume targets
  - **Co-broking split** — two agents split a commission on one deal (very common in PH)
- **Commission calculation engine (client-side):**
  - Auto-compute from deal price + commission structure
  - VAT handling (12% in PH)
  - Creditable withholding tax (1% for real estate services per BIR)
  - Capital gains tax (6%) & DST (1.5%) estimator for deals
- **Payout tracking** — paid / pending / due dates
- **Commission forecast** — broker sees projected income for the month
- **Per-agent commission reports** — earned vs collected

### 3.5 Agent Hierarchy System (Broker → Agents)

- **Tree structure:**
  - **Broker** (top-level) — owns the license, oversees multiple agents
  - **Agents** (under broker) — can have their own sub-agents or assistants
- **Permissions & visibility:**
  - Broker: see ALL data, commissions, performance
  - Agent: see own leads, listings, commissions
  - Sub-agent / Assistant: limited to tasks assigned by parent agent
- **Agent profiles** — license number, PRC/HLURB accreditation, contact info, commission rate
- **Team management** — create teams/groups under a broker
- **Invitation flow** — broker invites agent via email; agent creates own account

### 3.6 Viewing Schedule Tracker

- **Schedule creation** — agent picks date, time, property listing, lead
- **Client confirmation** — shareable viewing link sent via Messenger/Viber
- **Calendar integration** — Google Calendar sync (one-way export)
- **Check-in / check-out** — QR code or photo-based check-in at property (proof of viewing)
- **Post-viewing feedback form** — lead interest level, concerns, next steps
- **Reminders** — push notification 24h and 1h before viewing
- **Viewing photo upload** — agent snaps photos during viewing, stored under Viewing doc

### 3.7 Client Portal

- **Public-facing page per client** — they see assigned properties, upcoming viewings
- **Schedule request** — client can request a reschedule
- **Feedback submission** — post-viewing feedback form
- **Shareable link** — agent sends via Messenger / Viber / SMS

### 3.8 Broker Control Panel & Analytics

- **Command center** — see active agents today, calls made, viewings done
- **Agent leaderboard** — gamify: top closers, most leads, most viewings
- **Lead source analytics** — which source (FB, referral, walk-in) converts best
- **Commission forecast** — projected income vs actual for the month
- **Team performance report** — per agent: leads, viewings, closed deals, commissions
- **Listing performance** — views, inquiries, conversion rate per property

### 3.9 Agent Task Management

- **Per-agent to-do list** — tasks tied to leads or listings
- **Task types** — "Follow up with [lead]", "Prepare contract for [listing]", "Submit docs for [deal]"
- **Due dates & priorities** — high / medium / low
- **Broker assignment** — broker can assign tasks to agents

### 3.10 Expense Tracking

- **Agent expenses** — gas, client meetings, marketing, parking, tolls
- **Category tags** — transportation, meals, ads, misc
- **Receipt upload** — photo of receipt stored in Firebase Storage
- **Broker visibility** — broker sees agent expenses (optional)
- **Export** — CSV of expenses for bookkeeping

### 3.11 Title Status Tracker (PH-Specific)

- **Title transfer stages:**
  - With Seller → BIR (Capital Gains Tax) → Registry of Deeds → Transfer to Buyer → Complete
- **Status per stage** — pending / in-progress / done
- **Document checklist** — required docs per stage
- **Timeline view** — how long each stage took (historical)

### 3.12 Financing Calculators (PH-Specific)

- **Pag-IBIG Loan Calculator:**
  - Monthly amortization based on loan amount, term, interest rate
  - Max loanable amount based on Pag-IBIG tiers
- **Bank Financing Calculator:**
  - BPI, BDO, Metrobank estimated rates
  - Monthly amortization breakdown
- **BIR Tax Estimator:**
  - 6% Capital Gains Tax
  - 1.5% Documentary Stamp Tax
  - Creditable Withholding Tax (1%)
  - Total closing costs for buyer
- **Rent vs. Buy comparison** — simple side-by-side

### 3.13 Property Brochure Generator

- **Auto-generated public page** — single page with property photos, details, agent contact
- **Shareable link** — `${hosting-url}/brochure/{listingId}`
- **WhatsApp / Viber / Messenger share** — one-tap share buttons
- **Agent QR code** — QR on brochure links to agent's contact page
- **Download as image** — save brochure as PNG for posting on FB Marketplace

### 3.14 Co-broking / Shared Deals

- **Dual-agent deal** — listing agent + buyer's agent on one transaction
- **Commission split config** — 50/50, 60/40, or custom
- **Shared pipeline** — both agents see deal progress
- **Audit log** — who did what on a shared deal
- **Payout split** — each agent's share tracked separately

### 3.15 Notes & Mentions

- **Internal notes** — on leads, listings, deals
- **@mentions** — `@agentName` triggers in-app notification
- **Note types** — general, reminder, document request
- **Read status** — mark notes as read / unread

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite + TypeScript + Tailwind CSS + ShadCN/ui (SPA) |
| **Mobile** | React Native (v2) |
| **Backend** | Firebase-only — **no Cloud Functions** |
| **Database** | Firestore (NoSQL) |
| **Auth** | Firebase Auth (email/password + Google OAuth) |
| **File Storage** | Firebase Storage (property images, receipts, viewing photos) |
| **Hosting** | Firebase Hosting |
| **FB Leads** | Manual entry only (v1) |
| **Notifications** | Firebase Cloud Messaging (push notifications) |
| **Commission Engine** | Client-side computation (display only; raw deal data is source of truth) |
| **Analytics** | Firebase Analytics + custom dashboard (Firestore aggregations) |
| **CI/CD** | GitHub Actions → Firebase Hosting deploy |

---

## 5. Data Model (Firestore Collections)

```
/users/{userId}
  - role: "broker" | "agent" | "sub-agent"
  - brokerId (for agents — links to parent broker)
  - teamId (optional team grouping)
  - displayName, email, phone, photoURL
  - licenseNumber, accreditation (HLURB/DHSUD)
  - defaultCommissionRate
  - fcmTokens: string[] (push notification tokens)
  - isActive, createdAt

/listings/{listingId}
  - title, description, price
  - location: { address, city, province, coordinates }
  - propertyDetails: { lotArea, floorArea, bedrooms, bathrooms, furnishing, floors }
  - propertyType: "condo" | "house-lot" | "lot-only" | "commercial" | "foreclosed"
  - floodRisk: "low" | "medium" | "high" | "unknown"
  - amenities: string[] (school, hospital, mall, lrt, mrt)
  - requiredDocs: { docName, isRequired, notes }
  - status: "available" | "under-option" | "sold" | "rented" | "off-market"
  - assignedTo (userId)
  - createdBy, createdAt, updatedAt
  - media: string[] (Storage URLs)
  - views, inquiries (counts)

/leads/{leadId}
  - name, email, phone, source ("facebook" | "manual" | "referral" | "walk-in")
  - status: "new" | "contacted" | "viewed" | "negotiating" | "closed" | "lost"
  - score: "hot" | "warm" | "cold"
  - assignedTo (userId)
  - propertyInterest (listingId or freeform text)
  - budget, location, notes
  - communicationLog: [{ type, note, timestamp, by }]
  - activityTimeline: [{ action, timestamp, by }]
  - createdAt, updatedAt

/deals/{dealId}
  - leadId, listingId
  - clientName, clientContact
  - dealPrice, status: "pending" | "closed" | "cancelled"
  - commissionPlanId
  - coBroking: { enabled, agent2Id, splitPercent }
  - commission: { total, brokerShare, agentShare, agent2Share }
  - tax: { vat, withholding, cgt, dst }
  - titleStatus: { stage, documents, lastUpdate }
  - expenses: [{ category, amount, receipt, note, date }]
  - createdBy, createdAt, updatedAt

/commissionPlans/{planId}
  - name, type ("fixed" | "tiered" | "referral" | "escalating")
  - brokerId (who created)
  - rules: { percent, tiers, referralFee, minVolumeForEscalation }
  - assignedTo: userId[]

/payouts/{payoutId}
  - dealId, agentId, brokerId
  - amount, status: "pending" | "approved" | "paid"
  - paidAt, paidBy (brokerId)
  - receiptUrl, notes

/viewings/{viewingId}
  - leadId, listingId, agentId
  - scheduledAt (timestamp)
  - status: "scheduled" | "done" | "cancelled" | "no-show"
  - checkIn: { method, timestamp, photo }
  - feedback: { interestLevel, concerns, nextSteps }
  - photos: string[] (viewing photos)
  - reminders: { sent24h, sent1h }
  - createdAt, updatedAt

/tasks/{taskId}
  - agentId, createdBy (broker or self)
  - title, description, priority ("high" | "medium" | "low")
  - dueDate, status: "pending" | "done"
  - relatedTo: { type: "lead" | "listing" | "deal", id }
  - createdAt

/expenses/{expenseId}
  - agentId, brokerId
  - category: "transportation" | "meals" | "ads" | "misc"
  - amount, date, note, receiptUrl
  - dealId (optional — tie to a deal)
  - createdAt

/notifications/{notificationId}
  - userId, type, title, body
  - read: boolean, createdAt
  - data: { link, relatedId }

/auditLogs/{docId}
  - action, userId, targetCollection, targetDocId
  - before, after (snapshots)
  - timestamp
  - security rule: append-only (no update, no delete)

/brochures/{brochureId}
  - listingId, agentId
  - generatedAt, views
  - shareUrl
```

---

## 6. UI/UX Principles

- **Mobile-first** — most agents work from their phones
- **Minimal clicks** — 3 taps or less to log a lead or schedule a viewing
- **Offline-capable** (v2) — agents in areas with poor connectivity
- **Tagalog / Filipino language toggle** (v2)
- **Clear role differentiation** — broker sees controls, agent sees tools, sub-agent sees tasks
- **Visual feedback** — drag & drop pipeline, progress bars for title tracking, charts for analytics

---

## 7. PH-Specific Considerations

| Factor | Implication |
|---|---|
| **Commission culture** | Agents expect clear, transparent commission tracking. Must support complex splits + co-broking. |
| **VAT (12%) & Withholding Tax** | Commission calculations must account for tax deductions. Also CGT (6%) and DST (1.5%). |
| **Pag-IBIG / Bank Financing** | Most buyers finance — built-in calculators are a must-sell feature. |
| **HLURB / DHSUD** | Licensing and accreditation numbers must be stored per agent. |
| **Title transfer complexity** | Multi-stage process with BIR, ROD — agents need to track it step by step. |
| **Flood-prone areas** | Flood risk tagging on properties is a major buyer concern. |
| **FB Marketplace dominance** | Brochure generator is the workaround — shareable cards for FB posts. |
| **Low data connectivity** | Consider PWA / offline-first architecture for provincial agents. |
| **GCash / PayMongo** | Integrate PH payment gateways for commission payouts (v2). |
| **Co-broking culture** | Two agents splitting one deal is standard practice — must be first-class. |

---

## 8. Milestones (High-Level)

1. **Foundation** — Auth, user roles, agent hierarchy, project setup
2. **Core CRM** — Lead management, deal pipeline (Kanban), listing management
3. **Engagement** — Viewing tracker, client portal, brochure generator
4. **Money** — Commission engine, payout tracking, co-broking, expense tracking
5. **Productivity** — Task management, notes & mentions, communication log
6. **PH Tools** — Financing calculators, title tracker, BIR tax estimator, flood/hazard tags
7. **Command Center** — Broker dashboard, agent leaderboard, analytics & reports
8. **Production Hardening** — Firestore rules, indexes, E2E tests, performance
9. **Launch** — Beta with 5–10 brokers, onboarding guide, feedback loop
10. **v2 Enhancements** — Mobile app, offline mode, Filipino l10n, FB auto-post

---

## 9. Success Metrics

- **Time to log a lead** < 30 seconds
- **Commission computation accuracy** 100% (auditable)
- **Viewing no-show rate** < 10% (via push reminders)
- **Agent adoption rate** > 80% within first month
- **Lead response time** < 5 minutes (from lead creation to first contact)
- **Days from viewing to deal close** — tracked & reduced
- **Broker dashboard DAU** — broker checks daily
- **Brochure shares** — tracked per agent (engagement metric)
