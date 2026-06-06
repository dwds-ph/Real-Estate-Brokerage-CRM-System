/**
 * Facebook Lead Import Service
 *
 * Provides:
 * 1. Facebook Graph API helpers for fetching lead gen forms and leads
 * 2. Lead import + deduplication pipeline with strategy support
 * 3. FacebookSettings CRUD with real-time subscriptions
 * 4. Import log subscriptions for import history
 */
import {
  where,
  orderBy,
  type QueryConstraint,
} from "firebase/firestore";
import {
  subscribeToQuery,
  createDocumentWithUser,
  updateDocument,
  COLLECTIONS,
} from "@/lib/firestore";
import { type Lead, type AppUser } from "@/types";
import {
  type FacebookSettings,
  type FacebookImportLog,
  type FacebookLeadForm,
} from "@/types/domains/facebook";
import { deduplicateLead, mergeLeadData } from "@/lib/leadDeduplication";
import { autoAssignLead } from "@/services/leadRoutingService";

// ─── Constants ─────────────────────────────────────────────────────

const GRAPH_API_BASE = "https://graph.facebook.com/v22.0";
const FACEBOOK_SETTINGS_COLLECTION = "facebookSettings";
const FACEBOOK_IMPORT_LOGS_COLLECTION = "facebookImportLogs";

// ─── Facebook Graph API Helpers ────────────────────────────────────

/**
 * Fetch available lead gen forms from a Facebook Page.
 */
export async function fetchLeadGenForms(
  pageId: string,
  accessToken: string,
): Promise<FacebookLeadForm[]> {
  const url = `${GRAPH_API_BASE}/${pageId}/leadgen_forms?access_token=${encodeURIComponent(accessToken)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Facebook API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Facebook API error: ${data.error.message}`);
  }

  const now = Date.now();
  return (data.data || []).map(
    (form: { id: string; name: string }) =>
      ({
        id: form.id,
        formId: form.id,
        name: form.name,
        pageId,
        fields: [],
        lastSyncedAt: now,
      }) as FacebookLeadForm,
  );
}

/**
 * Fetch leads submitted to a specific lead gen form.
 */
export async function fetchLeadsFromForm(
  formId: string,
  accessToken: string,
): Promise<
  Array<{
    id: string;
    field_data: Array<{ name: string; values: string[] }>;
    created_time: string;
  }>
> {
  const url = `${GRAPH_API_BASE}/${formId}/leads?access_token=${encodeURIComponent(accessToken)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Facebook API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Facebook API error: ${data.error.message}`);
  }

  return data.data || [];
}

// ─── Lead Data Parsing ─────────────────────────────────────────────

/**
 * Parse a Facebook lead's field_data array into a Lead-shaped partial
 * that the deduplication and creation system understands.
 *
 * Facebook lead gen forms return:
 *   field_data: [
 *     { name: "full_name", values: ["Juan"] },
 *     { name: "email", values: ["juan@example.com"] },
 *     ...
 *   ]
 */
function parseFacebookLeadToLeadData(
  fieldData: Array<{ name: string; values: string[] }>,
): Partial<Lead> {
  const raw: Record<string, string> = {};

  for (const field of fieldData) {
    const value = field.values?.[0]?.trim();
    if (value) {
      raw[field.name] = value;
    }
  }

  const partial: Partial<Lead> = {};

  // Build name from full_name, or combine first_name + last_name
  if (raw.full_name) {
    partial.name = raw.full_name;
  } else if (raw.first_name || raw.last_name) {
    partial.name = [raw.first_name, raw.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  if (raw.email) {
    partial.email = raw.email;
  }

  if (raw.phone_number) {
    partial.phone = raw.phone_number;
  }

  // Combine city + zip into a single location string
  const locParts = [raw.city, raw.zip_code].filter(Boolean);
  if (locParts.length > 0) {
    partial.location = locParts.join(" ");
  }

  if (raw.property_interest) {
    partial.propertyInterest = raw.property_interest;
  }

  if (raw.budget) {
    const parsed = parseFloat(raw.budget.replace(/[^0-9.]/g, ""));
    if (!isNaN(parsed)) {
      partial.budget = parsed;
    }
  }

  if (raw.notes) {
    partial.notes = raw.notes;
  }

  return partial;
}

/**
 * Build a lead data payload suitable for createDocumentWithUser<Lead>.
 */
function buildLeadPayload(
  leadData: Partial<Lead>,
  extras?: { notes?: string },
): Omit<Lead, "id" | "createdAt" | "updatedAt" | "createdBy"> {
  return {
    name: leadData.name ?? "Unknown",
    email: leadData.email,
    phone: leadData.phone,
    source: "facebook",
    status: "new",
    score: "cold",
    assignedTo: leadData.assignedTo,
    propertyInterest: leadData.propertyInterest,
    budget: leadData.budget,
    location: leadData.location,
    notes: extras?.notes ?? leadData.notes,
    communicationLog: [],
    activityTimeline: [],
  };
}

// ─── Import Pipeline ───────────────────────────────────────────────

/**
 * Process imported Facebook leads through the deduplication pipeline.
 *
 * For each lead:
 *  - Runs deduplicateLead() from the dedup engine
 *  - If duplicate + onDuplicate === "skip" → logs as skipped
 *  - If duplicate + onDuplicate === "update" → merges & updates existing
 *  - If duplicate + onDuplicate === "flag" → marks with notes, creates as new
 *  - If not duplicate → creates new lead with source "facebook" & status "new"
 *  - If autoAssign is enabled → calls autoAssignLead from routing service
 *
 * Tracks everything in the facebookImportLogs collection.
 */
export async function importFacebookLeads(
  settingsId: string,
  leads: Array<{
    id: string;
    field_data: Array<{ name: string; values: string[] }>;
    created_time?: string;
  }>,
  brokerId: string,
  userId: string,
  options?: {
    /** Deduplication strategy when a duplicate is found */
    onDuplicate?: "skip" | "update" | "flag";
    /** Whether to auto-assign leads via routing rules */
    autoAssign?: boolean;
    /** All agents for auto-assignment routing */
    allAgents?: AppUser[];
  },
): Promise<FacebookImportLog> {
  const onDuplicate = options?.onDuplicate ?? "skip";
  const autoAssign = options?.autoAssign ?? false;
  const allAgents = options?.allAgents ?? [];

  const startedAt = Date.now();

  // Create the running log entry first
  const logId = await createDocumentWithUser<FacebookImportLog>(
    FACEBOOK_IMPORT_LOGS_COLLECTION,
    {
      settingsId,
      startedAt,
      status: "running",
      totalFetched: leads.length,
      imported: 0,
      skipped: 0,
      flagged: 0,
      errors: 0,
      errorMessages: [],
      leadIds: [],
      brokerId,
    },
    userId,
  );

  const log: FacebookImportLog = {
    id: logId,
    settingsId,
    startedAt,
    status: "running",
    totalFetched: leads.length,
    imported: 0,
    skipped: 0,
    flagged: 0,
    errors: 0,
    errorMessages: [],
    leadIds: [],
    brokerId,
    createdBy: userId,
    createdAt: startedAt,
  };

  for (const fbLead of leads) {
    try {
      const leadData = parseFacebookLeadToLeadData(fbLead.field_data);

      // Skip leads without any name — they're unusable
      if (!leadData.name) {
        log.errors++;
        log.errorMessages.push(
          `Facebook lead ${fbLead.id}: missing name, skipping`,
        );
        continue;
      }

      // ── Run deduplication ──────────────────────────────────────
      const dedup = await deduplicateLead(leadData);

      if (dedup.isDuplicate) {
        if (onDuplicate === "skip") {
          // a) Skip — discard the incoming lead entirely
          log.skipped++;
          continue;
        }

        if (onDuplicate === "update" && dedup.existingLeadId) {
          // c) Update — merge incoming data into existing lead
          const merged = mergeLeadData(
            { id: dedup.existingLeadId, ...leadData } as Partial<Lead>,
            leadData,
          );
          await updateDocument<Lead>(COLLECTIONS.LEADS, dedup.existingLeadId, {
            ...merged,
            source: "facebook",
          } as Partial<Lead>);
          log.imported++;
          log.leadIds!.push(dedup.existingLeadId);

          if (autoAssign) {
            await autoAssignLead(dedup.existingLeadId, leadData, allAgents);
          }
          continue;
        }

        if (onDuplicate === "flag") {
          // d) Flag — create lead with duplicate warning in notes
          const flagNote = leadData.notes
            ? `${leadData.notes}\n---\n[DUPLICATE FLAG] Possible duplicate of ${dedup.existingLeadId} (match: ${dedup.matchMethod}, confidence: ${dedup.confidence})`
            : `[DUPLICATE FLAG] Possible duplicate of ${dedup.existingLeadId} (match: ${dedup.matchMethod}, confidence: ${dedup.confidence})`;

          const newLeadId = await createDocumentWithUser<Lead>(
            COLLECTIONS.LEADS,
            buildLeadPayload(leadData, { notes: flagNote }),
            userId,
          );

          log.flagged++;
          log.leadIds!.push(newLeadId);

          if (autoAssign) {
            await autoAssignLead(newLeadId, leadData, allAgents);
          }
          continue;
        }
      }

      // e) Not a duplicate — create a brand new lead
      const newLeadId = await createDocumentWithUser<Lead>(
        COLLECTIONS.LEADS,
        buildLeadPayload(leadData),
        userId,
      );

      log.imported++;
      log.leadIds!.push(newLeadId);

      if (autoAssign) {
        await autoAssignLead(newLeadId, leadData, allAgents);
      }
    } catch (err) {
      log.errors++;
      const message =
        err instanceof Error ? err.message : "Unknown error";
      log.errorMessages.push(
        `Error processing Facebook lead ${fbLead.id}: ${message}`,
      );
    }
  }

  // ── Finalize the import log ───────────────────────────────────
  const finalStatus =
    log.errors > 0 && log.imported > 0
      ? "partial"
      : log.errors > 0
        ? "failed"
        : "completed";

  log.status = finalStatus;
  log.completedAt = Date.now();

  // Trim error messages to at most 10 for storage
  if (log.errorMessages.length > 10) {
    log.errorMessages = log.errorMessages.slice(0, 10);
  }

  await updateDocument<FacebookImportLog>(
    FACEBOOK_IMPORT_LOGS_COLLECTION,
    logId,
    {
      status: log.status,
      completedAt: log.completedAt,
      imported: log.imported,
      skipped: log.skipped,
      flagged: log.flagged,
      errors: log.errors,
      errorMessages: log.errorMessages,
      leadIds: log.leadIds,
    } as Partial<FacebookImportLog>,
  );

  return log;
}

// ─── FacebookSettings CRUD ────────────────────────────────────────

/**
 * Subscribe to FacebookSettings for a broker in real time.
 */
export function subscribeFacebookSettings(
  brokerId: string,
  callback: (settings: FacebookSettings[]) => void,
) {
  const constraints: QueryConstraint[] = [
    where("brokerId", "==", brokerId),
  ];

  return subscribeToQuery<FacebookSettings>(
    FACEBOOK_SETTINGS_COLLECTION,
    constraints,
    callback,
  );
}

/**
 * Create or update FacebookSettings.
 *
 * If `settings.id` is present — updates the existing document.
 * Otherwise — creates a new document with the provided userId.
 */
export async function saveFacebookSettings(
  settings: FacebookSettings,
  userId: string,
): Promise<string> {
  if (settings.id) {
    const { id, createdBy, createdAt, ...updateData } = settings;
    await updateDocument<FacebookSettings>(
      FACEBOOK_SETTINGS_COLLECTION,
      id,
      updateData,
    );
    return id;
  }

  const { id: _id, ...createData } = settings;
  return createDocumentWithUser<FacebookSettings>(
    FACEBOOK_SETTINGS_COLLECTION,
    createData as Omit<
      FacebookSettings,
      "id" | "createdAt" | "updatedAt" | "createdBy"
    >,
    userId,
  );
}

// ─── ImportLog Subscriptions ──────────────────────────────────────

/**
 * Subscribe to import logs for a specific FacebookSettings entry.
 * Returns logs ordered by startedAt descending (newest first).
 */
export function subscribeImportLogs(
  settingsId: string,
  callback: (logs: FacebookImportLog[]) => void,
) {
  const constraints: QueryConstraint[] = [
    where("settingsId", "==", settingsId),
    orderBy("startedAt", "desc"),
  ];

  return subscribeToQuery<FacebookImportLog>(
    FACEBOOK_IMPORT_LOGS_COLLECTION,
    constraints,
    callback,
  );
}
