# Real Estate Brokerage CRM — Module Map

> All-in-one CRM + Project Management System for the Philippine real estate market.
> Firebase-only SPA (Auth + Firestore + Storage + Hosting).
> React 18 + Vite 5 + TypeScript + Tailwind 3 + ShadCN/ui.

---

## 1. Auth & User Management

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Login / Register | `/login` | LoginPage | Firebase Auth | ✅ |
| Onboarding Wizard | `/onboarding` | OnboardingPage, OnboardingTooltip | - | ✅ |
| Auth Guard | - | ProtectedRoute | AuthContext | ✅ |
| User Profiles | - | - | Firestore `/users` | ✅ |

## 2. Dashboard

| Module | Route | Components | Status |
|--------|-------|------------|--------|
| Broker Command Center | `/dashboard` | DashboardPage | ✅ |

## 3. Lead Management

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Lead List | `/leads` | LeadsPage, LeadList, LeadFilters, StatusBadge | useLeadsPage | ✅ |
| Lead Detail | `/leads/:id` | LeadDetailPage, LeadForm | - | ✅ |
| Duplicate Detection | - | (inline in LeadForm) | - | ✅ |
| Lead Assignment | - | (via LeadForm) | - | ✅ |
| Bulk CSV Import | - | - | - | ✅ |
| Export to CSV | - | - | - | ✅ |
| Communication Log | - | ActivityFeed | - | ✅ |
| Activity Timeline | - | ActivityFeed | - | ✅ |

## 4. Deal Pipeline (Kanban)

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Kanban Board | `/deals` | DealsPage, DealKanban, DealCard | - | ✅ |
| Co-broking Split | - | DealReferralSection | referralService | ✅ |
| Mortgage Tracking | - | DealMortgageSection, MortgageTracker, MortgageForm | mortgageService | ✅ |
| Payout Tracking | - | - | - | ✅ |

## 5. Property Listing Management

| Module | Route | Components | Status |
|--------|-------|------------|--------|
| Listings Grid | `/listings` | ListingsPage | ✅ |
| Listing Detail | `/listings/:id` | ListingDetailPage | ✅ |
| Property Map | - | PropertyMap, MapMarker, MapPopup, MapFilters, PoiOverlay | ✅ |
| Brochure Generator | `/b/:listingId` | BrochurePage | ✅ |
| Flood / Hazard Tags | - | (inline in listing form) | ✅ |
| Nearby Amenities Map | - | PoiOverlay | ✅ |

## 6. Commission Tracking

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Commission Dashboard | `/commissions` | CommissionsPage | commission.ts | ✅ |
| PH Tax Estimator | - | (in PhToolsPage) | commission.ts | ✅ |
| Split Config (Co-broking) | - | DealReferralSection | referralService | ✅ |

## 7. Agent Hierarchy

| Module | Route | Components | Status |
|--------|-------|------------|--------|
| Agent List | `/agents` | AgentsPage | ✅ |
| Agent Profiles | - | (inline) | ✅ |
| Team Management | - | (inline) | ✅ |
| Invitation Flow | - | (email invitation) | ✅ |

## 8. Viewing Schedule

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Viewing List | `/viewings` | ViewingsPage | - | ✅ |
| Calendar Integration | `/calendar` | UnifiedCalendar, CalendarPage | calendarService | ✅ |
| Post-viewing Feedback | - | TourFeedback | - | ✅ |

## 9. Client Portal

| Module | Route | Components | Status |
|--------|-------|------------|--------|
| Client-facing Page | `/p/:leadToken` | ClientPortalPage | ✅ |
| Schedule Request | - | (inline) | ✅ |
| Feedback Submission | - | (inline) | ✅ |

## 10. Agent Scorecard & Leaderboard

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Leaderboard | `/leaderboard` | LeaderboardPage, AgentLeaderboard, AgentProfileScore | scorecard.ts | ✅ |
| Achievement Badges | - | AchievementBadges | - | ✅ |
| Period Filters | - | (inline) | - | ✅ |

## 11. Payment / Collection Tracker

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Payment Timeline | - | PaymentList, DealPaymentSection | paymentService | ✅ |
| Payment Form | - | PaymentForm | - | ✅ |
| Payment Summary | - | PaymentSummary | - | ✅ |
| Receipt Upload | - | (inline in PaymentForm) | Firebase Storage | ✅ |
| Overdue Alerts | - | (inline) | - | ✅ |

## 12. Contract & Document Generator

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Contract Wizard | - | ContractGenerator | contracts (templates, generator, fields) | ✅ |
| PH-standard Documents | - | - | 5 templates: RA 9646, Maceda Law, CGT/DST, notary | ✅ |
| PDF Generation | - | - | jsPDF + autotable | ✅ |

## 13. Property Tour Builder

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Tour List | `/tours` | ToursPage, TourList | tourService | ✅ |
| Tour Builder (4-step wizard) | - | TourBuilder | - | ✅ |
| Tour Itinerary (day-of) | - | TourItinerary, TourStopCard | - | ✅ |
| Tour Feedback | - | TourFeedback | - | ✅ |

## 14. License Expiry Tracker

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| License Dashboard | `/licenses` | LicensesPage, LicenseDashboard | licenseService | ✅ |
| License Form | - | LicenseForm | - | ✅ |
| License List | - | LicenseList | - | ✅ |
| Expiry Alerts | - | ExpiryBanner | - | ✅ |

## 15. Market Report Generator

| Module | Route | Components | Lib | Status |
|--------|-------|------------|-----|--------|
| Market Overview | `/market` | MarketPage, MarketOverview | marketReport.ts | ⚠️ Route needs adding |
| Price Trends | - | PriceTrends | - | ✅ |
| Property Breakdown | - | PropertyBreakdown | - | ✅ |
| Location Analysis | - | LocationAnalysis | - | ✅ |

## 16. Document Vault

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Vault Explorer | `/vault` | VaultPage, DocumentTabs | documentVault | ✅ |
| Document Upload | - | DocumentUpload, UploadProgress, FilePicker | - | ✅ |
| Document Metadata | - | DocumentMetadataForm, DocumentDetail | - | ✅ |
| Document Requests | - | DocumentRequestModal | - | ✅ |

## 17. Financing Calculators

| Module | Route | Components | Status |
|--------|-------|------------|--------|
| Pag-IBIG Calculator | `/ph-tools` | PagIbigCalculator | ✅ |
| Bank Financing | `/ph-tools` | BankCalculator | ✅ |
| BIR Tax Estimator | `/ph-tools` | (inline) | ✅ |
| Title Status Tracker | `/ph-tools` | TitleStatusTracker | ✅ |
| Rent vs. Buy | `/ph-tools` | (inline) | ✅ |

## 18. Expense Tracking

| Module | Route | Components | Status |
|--------|-------|------------|--------|
| Expense List | `/expenses` | ExpensesPage | ✅ |
| Receipt Upload | - | Firebase Storage | ✅ |
| Category Tags | - | (inline) | ✅ |

## 19. Task Management

| Module | Route | Components | Status |
|--------|-------|------------|--------|
| Task List | `/tasks` | TasksPage | ✅ |
| Check-it-off | `/checklist-templates` | ChecklistTemplatesPage, ChecklistWidget | ✅ |
| Smart Reminders | `/reminders` | RemindersPage, SmartReminders | ✅ |

## 20. Analytics & Reporting

| Module | Route | Components | Status |
|--------|-------|------------|--------|
| Analytics Dashboard | `/analytics` | AnalyticsPage | ✅ |
| Agent Performance Board | - | AgentPerformanceBoard | ✅ |
| Conversion Funnel | - | ConversionFunnel | ✅ |
| Expense vs Commission | - | ExpenseVsCommission | ✅ |
| Listing Performance | - | ListingPerformance | ✅ |
| Source Analytics | - | SourceAnalytics | ✅ |

## 21. Notifications

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Notification Feed | `/notifications` | NotificationsPage | notifications.ts | ✅ |
| Notification Bell | - | NotificationBell | - | ✅ |
| Preferences | `/settings/notifications` | NotificationPreferencesPage | - | ✅ |
| FCM Push | - | - | fcm.ts | ✅ |

## 22. Office Management

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Office List | `/offices` | OfficesPage | officeService | ✅ |

## 23. Automation

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Lead Routing Rules | - | LeadRoutingRules | leadRoutingService | ✅ |
| Referral Dashboard | - | ReferralDashboard, ReferralForm | referralService | ✅ |
| Activity Feed | - | ActivityFeed | - | ✅ |
| Quick Log | - | QuickLog | - | ✅ |
| Communication Templates | - | CommTemplateManager | commTemplates | ✅ |

## 24. PWA / Offline

| Module | Components | Status |
|--------|------------|--------|
| Service Worker | vite-plugin-pwa | ✅ |
| Offline Indicator | OfflineIndicator, useNetworkStatus | ✅ |
| Firestore Persistence | enableMultiTabIndexedDbPersistence | ✅ |
| Manifest / Icons | public/manifest.json, public/icons/ | ✅ |

## 25. Settings & UX

| Module | Route | Components | Status |
|--------|-------|------------|--------|
| User Settings | `/settings` | SettingsPage | ✅ |
| Theme Toggle | - | ThemeContext | ✅ |
| Keyboard Shortcuts | - | ShortcutsHelpModal, useKeyboardShortcuts | ✅ |
| Error Handling | - | ErrorBoundary, ErrorState | ✅ |
| Skeleton Loading | - | Skeleton | ✅ |

## 26. 📦 Project / Subdivision Management ← NEW (Phase 8)

| Module | Route | Components | Services | Status |
|--------|-------|------------|----------|--------|
| Project List | `/projects` | _Planned_ | _Planned_ | ❌ |
| Project Detail | `/projects/:id` | _Planned_ | _Planned_ | ❌ |
| Unit Inventory | - | _Planned_ | _Planned_ | ❌ |
| Unit Status Board | - | _Planned_ | - | ❌ |
| Payment Milestone Tracker | - | _Planned_ | - | ❌ |
| Developer Dashboard | - | _Planned_ | - | ❌ |

---

**Total: 26 modules · 150+ components · 25+ services · 184+ tests**
