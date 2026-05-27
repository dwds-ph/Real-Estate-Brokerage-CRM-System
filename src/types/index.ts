export type UserRole = "broker" | "agent" | "sub-agent";

export interface AppUser {
  id: string;
  role: UserRole;
  brokerId?: string;
  teamId?: string;
  officeId?: string;
  officeName?: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  licenseNumber?: string;
  accreditation?: string;
  defaultCommissionRate?: number;
  fcmTokens?: string[];
  isActive: boolean;
  createdAt: number;
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "viewed"
  | "negotiating"
  | "closed"
  | "lost";
export type LeadSource = "facebook" | "manual" | "referral" | "walk-in" | "website" | "call" | "sms" | "email" | "open-house" | "event" | "other";
export type LeadScore = "hot" | "warm" | "cold";

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  score: LeadScore;
  assignedTo?: string;
  propertyInterest?: string;
  budget?: number;
  location?: string;
  notes?: string;
  communicationLog: CommLogEntry[];
  activityTimeline: ActivityEntry[];
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
}

export interface CommLogEntry {
  type: "call" | "text" | "meeting" | "email";
  note: string;
  timestamp: number;
  by: string;
}

export interface ActivityEntry {
  action: string;
  timestamp: number;
  by: string;
}

export type ListingStatus =
  | "available"
  | "under-option"
  | "sold"
  | "rented"
  | "off-market";
export type PropertyType =
  | "condo"
  | "house-lot"
  | "lot-only"
  | "commercial"
  | "foreclosed";
export type FloodRisk = "low" | "medium" | "high" | "unknown";

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    province: string;
  };
  propertyDetails: {
    lotArea?: number;
    floorArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    furnishing?: string;
    floors?: number;
  };
  propertyType: PropertyType;
  floodRisk: FloodRisk;
  amenities: string[];
  status: ListingStatus;
  assignedTo?: string;
  createdBy: string;
  media: string[];
  views: number;
  inquiries: number;
  createdAt: number;
  updatedAt: number;
}

export interface Deal {
  id: string;
  leadId?: string;
  listingId?: string;
  clientName: string;
  clientContact: string;
  dealPrice: number;
  status: "pending" | "closed" | "cancelled";
  commissionPlanId?: string;
  coBroking?: {
    enabled: boolean;
    agent2Id: string;
    agent2Name: string;
    splitPercent: number;
  };
  commission?: {
    total: number;
    brokerShare: number;
    agentShare: number;
    agent2Share?: number;
  };
  tax?: {
    vat: number;
    withholding: number;
    cgt: number;
    dst: number;
  };
  titleStatus?: TitleStatus;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface TitleStatus {
  stage: "with-seller" | "bir-cgt" | "registry-deeds" | "transfer" | "complete";
  documents: { name: string; status: "pending" | "submitted" | "done" }[];
  lastUpdate: number;
}

export type CommissionPlanType = "fixed" | "tiered" | "referral" | "escalating";

export interface CommissionPlan {
  id: string;
  name: string;
  type: CommissionPlanType;
  brokerId: string;
  rules: {
    percent?: number;
    tiers?: { minVolume: number; percent: number }[];
    referralFee?: number;
    minVolumeForEscalation?: number;
  };
  assignedTo: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Payout {
  id: string;
  dealId: string;
  agentId: string;
  agentName?: string;
  brokerId: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "cancelled";
  paidAt?: number;
  paidBy?: string;
  approvedAt?: number;
  approvedBy?: string;
  receiptUrl?: string;
  notes?: string;
  dealClientName?: string;
  dealPrice?: number;
  commissionPercent?: number;
  periodLabel?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Phase 9: Smart Commission Engine ────────────────────────────────

export interface CommissionSplitConfig {
  brokerRate: number;
  agentRate: number;
  coBroking?: {
    enabled: boolean;
    agent2Id: string;
    agent2Name: string;
    splitPercent: number;
  };
  referralPercent?: number;
  referralName?: string;
}

export interface CommissionBreakdownLineItem {
  label: string;
  amount: number;
  type: "gross" | "deduction" | "tax" | "split" | "net";
}

export interface CommissionBreakdown {
  dealPrice: number;
  grossCommission: number;
  effectiveRate: number;
  brokerShare: number;
  agentShare: number;
  agent2Share?: number;
  referralFee?: number;
  taxes: {
    vat: number;
    withholding: number;
    cgt: number;
    dst: number;
    totalTax: number;
  };
  netCommission: number;
  breakdown: CommissionBreakdownLineItem[];
}

export interface CommissionPeriodSummary {
  period: "week" | "month" | "quarter" | "year";
  label: string;
  totalGrossCommission: number;
  totalNetCommission: number;
  totalDealVolume: number;
  dealCount: number;
  agentShares: Array<{
    agentId: string;
    agentName: string;
    grossCommission: number;
    netCommission: number;
    dealCount: number;
  }>;
}

export type ViewingStatus = "scheduled" | "done" | "cancelled" | "no-show";

export interface Viewing {
  id: string;
  leadId: string;
  listingId: string;
  agentId: string;
  scheduledAt: number;
  status: ViewingStatus;
  checkIn?: {
    method: "qr" | "photo";
    timestamp: number;
    photo?: string;
  };
  feedback?: {
    interestLevel: "low" | "medium" | "high";
    concerns?: string;
    nextSteps?: string;
  };
  photos: string[];
  reminders?: {
    sent24h: boolean;
    sent1h: boolean;
  };
  createdAt: number;
}

export interface TaskItem {
  id: string;
  agentId: string;
  createdBy: string;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  dueDate?: number;
  status: "pending" | "done";
  recurring?: "none" | "daily" | "weekly" | "monthly";
  relatedTo?: {
    type: "lead" | "listing" | "deal";
    id: string;
  };
  createdAt: number;
}

export type ExpenseCategory = "transportation" | "meals" | "ads" | "misc";

export interface Expense {
  id: string;
  agentId: string;
  brokerId: string;
  category: ExpenseCategory;
  amount: number;
  date: number;
  note?: string;
  receiptUrl?: string;
  dealId?: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data?: {
    link?: string;
    relatedId?: string;
  };
  createdAt: number;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  targetCollection: string;
  targetDocId: string;
  before?: unknown;
  after?: unknown;
  timestamp: number;
}

// ─── Phase 13: Document Vault ─────────────────────────────────────

export interface VaultDocument {
  id: string;
  dealId?: string;
  listingId?: string;
  stage?: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  uploadedBy: string;
  uploadedAt: number;
  version: number;
  previousVersionId?: string;
  expiryDate?: number;
  notes?: string;
  tags: string[];
}

export interface DocumentRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  dealId?: string;
  description: string;
  status: "pending" | "uploaded" | "cancelled";
  createdAt: number;
  respondedAt?: number;
  uploadedDocId?: string;
}

// ─── Phase 14: Mortgage Tracker ───────────────────────────────────

export type MortgageStage =
  | "application"
  | "bank-evaluation"
  | "bir-docs"
  | "rod"
  | "loan-release";
export type MortgageStatus = "ongoing" | "approved" | "rejected";

export interface Mortgage {
  id: string;
  dealId: string;
  bankId: string;
  bankName: string;
  loanAmount: number;
  status: MortgageStatus;
  currentStage: MortgageStage;
  stages: {
    key: MortgageStage;
    label: string;
    status: "pending" | "in-progress" | "done";
    startedAt?: number;
    completedAt?: number;
    notes?: string;
  }[];
  createdAt: number;
  updatedAt: number;
}

export interface BankProfile {
  id: string;
  name: string;
  typicalRate: string;
  estimatedTimelineDays: number;
}

// ─── Phase 17: Unified Calendar ───────────────────────────────────

export type CalendarEventType =
  | "viewing"
  | "task"
  | "deal-milestone"
  | "document-expiry";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  start: number;
  end?: number;
  allDay?: boolean;
  sourceId: string;
  sourceUrl: string;
  color: string;
  metadata?: Record<string, unknown>;
}

// ─── Phase 18: Automation ─────────────────────────────────────────

export interface CommTemplate {
  id: string;
  name: string;
  type: "call" | "text" | "meeting" | "email";
  body: string;
  createdBy: string;
  createdAt: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  scope: "lead" | "listing" | "deal";
  items: { label: string; required: boolean }[];
  createdBy: string;
  brokerId?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ChecklistInstance {
  id: string;
  templateId: string;
  templateName: string;
  scopeType: "lead" | "listing" | "deal";
  scopeId: string;
  items: { label: string; required: boolean; done: boolean }[];
  progress: number;
  createdAt: number;
}

export interface Referral {
  id: string;
  dealId: string;
  referrerName: string;
  referrerContact: string;
  referralFee: number;
  status: "pending" | "paid";
  paidAt?: number;
  createdAt: number;
}

// ─── Phase 19: Platform ───────────────────────────────────────────

export interface Office {
  id: string;
  name: string;
  address: string;
  brokerId: string;
  createdAt: number;
}

// ─── Phase 3: Payment / Collection Tracker ──────────────────────────

export type PaymentType =
  | "reservation-fee"
  | "down-payment"
  | "equity"
  | "full-payment"
  | "move-in-fee"
  | "other";

export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface Payment {
  id: string;
  dealId: string;
  type: PaymentType;
  label: string;
  amount: number;
  dueDate: number;
  paidDate?: number;
  status: PaymentStatus;
  receiptUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Phase 2: Agent Scorecard & Leaderboard ─────────────────────────

export interface AgentScore {
  agentId: string;
  displayName: string;
  role: string;
  photoURL?: string;
  dealsClosed: number;
  totalCommission: number;
  leadConversionRate: number;
  averageDealSize: number;
  viewingToDealRatio: number;
  totalViewings: number;
  totalLeadsAssigned: number;
  dealsTrend: "up" | "down" | "stable";
  commissionTrend: "up" | "down" | "stable";
  score: number;
  badges: AchievementBadge[];
}

export type AchievementBadgeId =
  | "first-deal"
  | "million-club"
  | "perfect-month"
  | "high-converter"
  | "top-viewer"
  | "veteran"
  | "riser"
  | "team-player";

export interface AchievementBadge {
  id: AchievementBadgeId;
  name: string;
  description: string;
  icon: string;
  earnedAt?: number;
}

// ─── Phase 5: Property Tour Builder ──────────────────────────────────

export type TourStatus =
  | "draft"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface TourStop {
  id: string;
  listingId: string;
  listingTitle: string;
  listingAddress: string;
  order: number;
  estimatedDuration: number; // minutes
  scheduledTime?: number; // epoch ms — specific time for this stop
  driveTime?: number; // minutes from previous stop
  notes?: string;
  feedback?: {
    interestLevel: "low" | "medium" | "high";
    concerns?: string;
    nextSteps?: string;
  };
  photoUrls?: string[];
}

export interface Tour {
  id: string;
  title: string;
  clientName: string;
  clientContact?: string;
  clientEmail?: string;
  leadId?: string;
  agentId: string;
  scheduledDate: number; // epoch ms
  status: TourStatus;
  notes?: string;
  stops: TourStop[];
  createdAt: number;
  updatedAt: number;
}

// ─── Phase 6: License Expiry Tracker ────────────────────────────────

export type LicenseType =
  | "prc"
  | "broker-license"
  | "bir-accreditation"
  | "hlurb"
  | "other";
export type LicenseStatus = "active" | "expiring-soon" | "expired" | "renewed";

export interface License {
  id: string;
  agentId: string;
  agentName: string;
  type: LicenseType;
  licenseNumber: string;
  issuingBody: string;
  issueDate: number;
  expiryDate: number;
  status: LicenseStatus;
  renewedLicenseId?: string;
  notes?: string;
  documentUrl?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Phase 8: Project / Subdivision Management ──────────────────────

export type ProjectStatus = "pre-selling" | "ongoing" | "completed" | "on-hold";
export type ProjectType = "subdivision" | "condo" | "commercial" | "mixed-use";

export interface ProjectPhase {
  id: string;
  name: string;
  status: ProjectStatus;
  totalUnits: number;
  availableUnits: number;
  launchDate?: number;
  targetCompletion?: number;
  priceRange: {
    min: number;
    max: number;
  };
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  developer: string;
  developerContact?: string;
  location: {
    address: string;
    city: string;
    province: string;
  };
  description: string;
  status: ProjectStatus;
  projectType: ProjectType;
  totalUnits: number;
  availableUnits: number;
  priceRange: {
    min: number;
    max: number;
  };
  phases: ProjectPhase[];
  amenities: string[];
  media: string[];
  commissionRate?: number;
  assignedTo?: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type UnitStatus =
  | "available"
  | "reserved"
  | "sold"
  | "under-contract"
  | "blocked";

export interface Unit {
  id: string;
  projectId: string;
  projectName: string;
  phaseId: string;
  phaseName: string;
  block: string;
  lot: string;
  floor?: number;
  model?: string;
  area: number;
  price: number;
  status: UnitStatus;
  buyerName?: string;
  buyerContact?: string;
  agentId?: string;
  agentName?: string;
  dealId?: string;
  notes?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentMilestone {
  id: string;
  projectId: string;
  unitId: string;
  name: string;
  amount: number;
  dueDate: number;
  paidDate?: number;
  status: "pending" | "paid" | "overdue" | "waived";
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Phase 15: Task & Activity Manager ──────────────────────────────

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  assignedName?: string;
  createdBy: string;
  createdByName?: string;
  dueDate?: number;
  brokerId: string;
  checklist?: ChecklistItem[];
  relatedTo?: { type: "lead" | "deal" | "listing" | "project"; id: string; title?: string };
  tags?: string[];
  recurring?: "none" | "daily" | "weekly" | "monthly";
  createdAt: number;
  updatedAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export type ActivityType = "call" | "meeting" | "email" | "note" | "status_change" | "task" | "tour" | "document";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  leadId?: string;
  dealId?: string;
  listingId?: string;
  createdBy: string;
  createdByName?: string;
  duration?: number;
  createdAt: number;
}

export interface CallLog {
  id: string;
  leadId?: string;
  dealId?: string;
  contactName: string;
  contactPhone?: string;
  duration: number;
  notes?: string;
  followUpDate?: number;
  createdBy: string;
  createdByName?: string;
  createdAt: number;
}

// ─── Phase 16: Property Map View ─────────────────────────────────

export interface MapViewport {
  center: [number, number];
  zoom: number;
}

export interface MapFilters {
  propertyType: string;
  status: string;
  minPrice: number;
  maxPrice: number;
  location: string;
}

// ─── Phase 17: PH Loan Calculator ────────────────────────────────

export type LoanType = "pagibig" | "bank" | "in-house";

export interface LoanInput {
  loanType: LoanType;
  propertyPrice: number;
  downPayment: number;
  loanTerm: number; // years
  annualRate: number; // percentage
  grossIncome?: number;
  existingDebts?: number;
  pagibigTier?: string;
}

export interface AmortizationRow {
  month: number;
  year: number;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
}

export interface AffordabilityResult {
  maxLoanAmount: number;
  maxPropertyPrice: number;
  monthlyPayment: number;
  debtToIncomeRatio: number;
  isAffordable: boolean;
  level: "green" | "yellow" | "red";
}

// ─── Phase 18: Lead Source & Agent Analytics ─────────────────────

export type GoalPeriod = "monthly" | "quarterly" | "yearly";

export interface AgentGoal {
  id: string;
  agentId: string;
  agentName?: string;
  period: GoalPeriod;
  periodStart: number;
  periodEnd: number;
  targetDeals: number;
  targetCommission: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SourceAnalytics {
  source: string;
  leadCount: number;
  dealCount: number;
  conversionRate: number;
  totalCommission: number;
  avgDealValue: number;
  avgDaysToDeal: number;
}

// ─── Phase 19: Co-Brokerage, Teams & Branches ────────────────────

export type BranchType = "head-office" | "branch" | "satellite";

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  address: string;
  city: string;
  province: string;
  phone?: string;
  email?: string;
  manager?: string;
  managerId?: string;
  brokerId: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AgentTeam {
  id: string;
  name: string;
  description?: string;
  teamLeadId: string;
  teamLeadName?: string;
  memberIds: string[];
  brokerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface TeamMember {
  userId: string;
  displayName: string;
  role: string;
  joinedAt: number;
}

export interface CoBroker {
  id: string;
  name: string;
  brokerage: string;
  licenseNumber?: string;
  phone: string;
  email?: string;
  address?: string;
  referralFeeRate?: number;
  notes?: string;
  createdBy: string;
  brokerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CoBrokerDeal {
  id: string;
  dealId: string;
  coBrokerId: string;
  coBrokerName: string;
  coBrokerBrokerage: string;
  splitPercentage: number;
  commissionAmount: number;
  status: "pending" | "approved" | "paid";
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SplitAgreement {
  id: string;
  dealId: string;
  parties: {
    agentId?: string;
    agentName?: string;
    coBrokerId?: string;
    coBrokerName?: string;
    role: string;
    percentage: number;
    amount: number;
  }[];
  totalCommission: number;
  brokerShare: number;
  brokerId: string;
  createdBy: string;
  createdAt: number;
}

// ─── Phase 21: Documents Vault & Compliance ──────────────────────

export type DocumentCategory =
  | "title"
  | "tax-declaration"
  | "permit"
  | "contract"
  | "identification"
  | "financial"
  | "legal"
  | "other";

export interface PropertyDocument {
  id: string;
  listingId?: string;
  dealId?: string;
  name: string;
  category: DocumentCategory;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  notes?: string;
  expiryDate?: number;
  uploadedBy: string;
  uploadedByName?: string;
  brokerId: string;
  createdAt: number;
}

export interface ComplianceItem {
  id: string;
  label: string;
  category: "legal" | "tax" | "documentary" | "financial";
  required: boolean;
  completed: boolean;
  completedAt?: number;
  completedBy?: string;
  notes?: string;
  documentId?: string;
}

export interface ComplianceChecklist {
  id: string;
  dealId: string;
  dealTitle?: string;
  items: ComplianceItem[];
  progress: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface CMReport {
  id: string;
  listingId: string;
  listingTitle?: string;
  subjectProperty: {
    address: string;
    propertyType: string;
    size: number;
    price: number;
    pricePerSqm: number;
  };
  comparables: {
    address: string;
    propertyType: string;
    size: number;
    price: number;
    pricePerSqm: number;
    distance: string;
    adjustment: number;
    adjustedPrice: number;
  }[];
  adjustedRange: { min: number; max: number };
  recommendedPrice: number;
  notes?: string;
  createdBy: string;
  createdAt: number;
}
