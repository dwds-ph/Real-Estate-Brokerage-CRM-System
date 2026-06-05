/**
 * reportScheduler.ts — Scheduled report delivery service.
 *
 * Stores scheduled report configurations in Firestore so that a future
 * Cloud Function (or a client-side check on app open) can trigger delivery.
 *
 * Since this is a client-only app without Cloud Functions, the actual
 * scheduled delivery isn't possible server-side. Instead, a client-side
 * check runs when the user opens the app: it detects overdue schedules and
 * prompts the user to generate them.
 */

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore";
import type { ReportFilter } from "@/lib/reportEngine";

// ─── Types ────────────────────────────────────────────────────────────

export type ReportFrequency = "daily" | "weekly" | "monthly";
export type ReportFormat = "csv" | "pdf";

export interface ScheduledReport {
  id: string;
  userId: string;
  title: string;
  module: ReportFilter["module"];
  groupBy: ReportFilter["groupBy"];
  frequency: ReportFrequency;
  /** Day of week (0=Sunday, only for weekly). */
  dayOfWeek?: number;
  /** Day of month (1-31, only for monthly). */
  dayOfMonth?: number;
  format: ReportFormat;
  recipients: string[];
  isActive: boolean;
  lastSentAt?: number;
  nextScheduledAt?: number;
  createdAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────

/** Compute the next scheduled timestamp based on frequency config. */
export function computeNextSchedule(
  frequency: ReportFrequency,
  dayOfWeek?: number,
  dayOfMonth?: number,
  after?: number,
): number {
  const now = after ?? Date.now();
  const d = new Date(now);

  switch (frequency) {
    case "daily": {
      // Next occurrence: tomorrow at 00:00 local
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    case "weekly": {
      if (dayOfWeek === undefined) {
        throw new Error("dayOfWeek is required for weekly frequency");
      }
      // Find the next occurrence of the target day
      const currentDay = d.getDay(); // 0=Sun
      let daysUntil = dayOfWeek - currentDay;
      if (daysUntil <= 0) {
        daysUntil += 7; // Move to next week
      }
      d.setDate(d.getDate() + daysUntil);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    case "monthly": {
      if (dayOfMonth === undefined) {
        throw new Error("dayOfMonth is required for monthly frequency");
      }
      // Try this month first
      const candidate = new Date(d.getFullYear(), d.getMonth(), dayOfMonth);
      // If that's already passed (or today), go to next month
      if (candidate.getTime() <= now) {
        candidate.setMonth(candidate.getMonth() + 1);
      }
      candidate.setHours(0, 0, 0, 0);
      return candidate.getTime();
    }
  }
}

/** Build a human-readable label for the frequency config. */
export function frequencyLabel(
  frequency: ReportFrequency,
  dayOfWeek?: number,
  dayOfMonth?: number,
): string {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  switch (frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return `Weekly on ${dayNames[dayOfWeek ?? 0]}`;
    case "monthly":
      return `Monthly on day ${dayOfMonth ?? 1}`;
  }
}

// ─── CRUD Operations ──────────────────────────────────────────────────

/**
 * Save a new scheduled report to Firestore.
 * Automatically computes `nextScheduledAt` and sets `createdAt`.
 */
export async function scheduleReport(
  data: Omit<ScheduledReport, "id" | "createdAt">,
): Promise<string> {
  const nextScheduledAt = computeNextSchedule(
    data.frequency,
    data.dayOfWeek,
    data.dayOfMonth,
  );

  const docRef = await addDoc(
    collection(db, COLLECTIONS.SCHEDULED_REPORTS),
    {
      ...data,
      nextScheduledAt,
      createdAt: Date.now(),
    },
  );
  return docRef.id;
}

/**
 * Load all scheduled reports for a given user.
 */
export async function getScheduledReports(
  userId: string,
): Promise<ScheduledReport[]> {
  const q = query(
    collection(db, COLLECTIONS.SCHEDULED_REPORTS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = { id: d.id, ...d.data() } as unknown as ScheduledReport;
    // Ensure recipients is always an array
    if (typeof data.recipients === "string") {
      data.recipients = (data.recipients as string).split(",").map((s) => s.trim());
    }
    return data;
  });
}

/**
 * Delete a scheduled report by ID.
 */
export async function deleteScheduledReport(reportId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.SCHEDULED_REPORTS, reportId));
}

/**
 * Toggle the active state of a scheduled report.
 */
export async function toggleScheduledReport(
  reportId: string,
  isActive: boolean,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.SCHEDULED_REPORTS, reportId), {
    isActive,
  });
}

/**
 * Update the lastSentAt timestamp and recompute nextScheduledAt.
 */
export async function markReportSent(reportId: string): Promise<void> {
  const report = await getScheduledReportById(reportId);
  if (!report) return;

  const nextScheduledAt = computeNextSchedule(
    report.frequency,
    report.dayOfWeek,
    report.dayOfMonth,
  );

  await updateDoc(doc(db, COLLECTIONS.SCHEDULED_REPORTS, reportId), {
    lastSentAt: Date.now(),
    nextScheduledAt,
  });
}

/**
 * Fetch a single scheduled report by ID.
 */
export async function getScheduledReportById(
  reportId: string,
): Promise<ScheduledReport | null> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.SCHEDULED_REPORTS),
      where("__name__", "==", reportId),
    ),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as unknown as ScheduledReport;
}

/**
 * Client-side check: find any scheduled reports that are due for delivery.
 * Returns reports where `nextScheduledAt <= now` and `isActive === true`.
 *
 * The app should call this on mount and prompt the user to generate overdue
 * reports.
 *
 * NOTE: If the number of scheduled reports grows large, consider adding a
 * composite index on [isActive, nextScheduledAt] in the Firebase console.
 */
export async function getOverdueScheduledReports(
  userId: string,
): Promise<ScheduledReport[]> {
  // Fetch all active reports for the user, then filter client-side
  // to avoid requiring a composite index on [isActive, nextScheduledAt].
  const q = query(
    collection(db, COLLECTIONS.SCHEDULED_REPORTS),
    where("userId", "==", userId),
    where("isActive", "==", true),
  );
  const snapshot = await getDocs(q);
  const now = Date.now();
  const overdue: ScheduledReport[] = [];
  for (const d of snapshot.docs) {
    const data = d.data();
    if (data.nextScheduledAt && data.nextScheduledAt <= now) {
      overdue.push({ id: d.id, ...data } as unknown as ScheduledReport);
    }
  }
  // Normalize recipients
  for (const r of overdue) {
    if (typeof r.recipients === "string") {
      r.recipients = (r.recipients as string).split(",").map((s) => s.trim());
    }
  }
  return overdue.sort((a, b) => (a.nextScheduledAt ?? 0) - (b.nextScheduledAt ?? 0));
}
