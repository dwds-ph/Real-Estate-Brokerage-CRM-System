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
export type LeadSource =
  | "facebook"
  | "manual"
  | "referral"
  | "walk-in"
  | "website"
  | "call"
  | "sms"
  | "email"
  | "open-house"
  | "event"
  | "other";
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
