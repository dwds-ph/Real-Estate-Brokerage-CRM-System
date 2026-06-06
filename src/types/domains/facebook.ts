/** Facebook & Instagram Lead Import types */

export interface FacebookSettings {
  id: string;
  /** Facebook Page ID connected for lead ads */
  pageId?: string;
  /** Facebook Page access token (long-lived) */
  pageAccessToken?: string;
  /** Selected ad account ID */
  adAccountId?: string;
  /** Selected lead gen form ID */
  leadFormId?: string;
  /** Auto-polling enabled */
  autoPollEnabled: boolean;
  /** Polling interval in minutes (default 15) */
  pollIntervalMinutes: number;
  /** Last successful sync timestamp */
  lastSyncAt?: number;
  /** Import lead deduplication strategy: 'skip' | 'update' | 'flag' */
  onDuplicate: "skip" | "update" | "flag";
  /** Auto-assign leads via routing rules */
  autoAssign: boolean;
  /** Broker ID for org isolation */
  brokerId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface FacebookImportLog {
  id: string;
  /** Reference to FacebookSettings */
  settingsId: string;
  /** When the import run started */
  startedAt: number;
  /** When the import run completed */
  completedAt?: number;
  /** Status of the import */
  status: "running" | "completed" | "failed" | "partial";
  /** Number of leads fetched from Facebook */
  totalFetched: number;
  /** Number of new leads imported */
  imported: number;
  /** Number of duplicates skipped */
  skipped: number;
  /** Number of leads flagged for review */
  flagged: number;
  /** Number of errors */
  errors: number;
  /** Error messages (up to 10) */
  errorMessages: string[];
  /** Lead IDs that were imported/flagged */
  leadIds?: string[];
  /** Broker ID for org isolation */
  brokerId: string;
  createdBy: string;
  createdAt: number;
}

export interface FacebookLeadForm {
  id: string;
  /** Facebook lead gen form ID */
  formId: string;
  /** Form name */
  name: string;
  /** Page ID that owns the form */
  pageId: string;
  /** Available fields from the form */
  fields: string[];
  /** Last time form was synced */
  lastSyncedAt: number;
}

/** Mapping from Facebook lead gen field → CRM lead field */
export interface FacebookFieldMapping {
  fbField: string;
  crmField: string;
  /** Whether this mapping is required (e.g., name) */
  required: boolean;
}

/** Default field mappings for Facebook lead gen → CRM leads */
export const DEFAULT_FIELD_MAPPINGS: FacebookFieldMapping[] = [
  { fbField: "full_name", crmField: "name", required: true },
  { fbField: "first_name", crmField: "name", required: false },
  { fbField: "last_name", crmField: "name", required: false },
  { fbField: "email", crmField: "email", required: false },
  { fbField: "phone_number", crmField: "phone", required: false },
  { fbField: "city", crmField: "location", required: false },
  { fbField: "zip_code", crmField: "location", required: false },
  { fbField: "property_interest", crmField: "propertyInterest", required: false },
  { fbField: "budget", crmField: "budget", required: false },
  { fbField: "notes", crmField: "notes", required: false },
];
