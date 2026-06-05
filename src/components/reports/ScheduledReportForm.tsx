/**
 * ScheduledReportForm.tsx — Form for creating and editing scheduled reports.
 *
 * Features:
 *  - Title input
 *  - Module selector (same options as the dashboard)
 *  - Group-by selector
 *  - Frequency: Daily / Weekly / Monthly radio buttons
 *  - Day-of-week picker (shown when weekly is selected)
 *  - Day-of-month picker (shown when monthly is selected)
 *  - Format: CSV / PDF radio buttons
 *  - Recipients email input (comma-separated)
 *  - Save / Cancel buttons with validation
 */

import { useState, useCallback } from "react";
import type { ReportFilter } from "@/lib/reportEngine";
import type {
  ReportFrequency,
  ReportFormat,
  ScheduledReport,
} from "@/services/reportScheduler";

// ─── Constants ────────────────────────────────────────────────────────

const MODULES: { value: ReportFilter["module"]; label: string }[] = [
  { value: "leads", label: "Leads" },
  { value: "deals", label: "Deals" },
  { value: "payments", label: "Payments" },
  { value: "commissions", label: "Commissions" },
  { value: "all", label: "All Modules" },
];

const GROUP_BY_OPTIONS: { value: ReportFilter["groupBy"]; label: string }[] = [
  { value: "agent", label: "Agent" },
  { value: "branch", label: "Branch" },
  { value: "propertyType", label: "Property Type" },
  { value: "status", label: "Status" },
  { value: "month", label: "Month" },
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const FREQUENCIES: { value: ReportFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// ─── Form State Interface ─────────────────────────────────────────────

interface ScheduledReportFormData {
  title: string;
  module: ReportFilter["module"];
  groupBy: ReportFilter["groupBy"];
  frequency: ReportFrequency;
  dayOfWeek: number;
  dayOfMonth: number;
  format: ReportFormat;
  recipients: string;
}

const INITIAL_FORM: ScheduledReportFormData = {
  title: "",
  module: "leads",
  groupBy: "status",
  frequency: "weekly",
  dayOfWeek: 1, // Monday
  dayOfMonth: 1,
  format: "csv",
  recipients: "",
};

// ─── Validation ───────────────────────────────────────────────────────

interface FormErrors {
  title?: string;
  recipients?: string;
  dayOfWeek?: string;
  dayOfMonth?: string;
}

function validate(data: ScheduledReportFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim()) {
    errors.title = "Title is required";
  }
  if (!data.recipients.trim()) {
    errors.recipients = "At least one recipient is required";
  } else {
    // Basic email validation for each comma-separated entry
    const emails = data.recipients
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = emails.filter((e) => !emailRegex.test(e));
    if (invalid.length > 0) {
      errors.recipients = `Invalid email(s): ${invalid.join(", ")}`;
    }
  }
  if (data.frequency === "weekly" && (data.dayOfWeek < 0 || data.dayOfWeek > 6)) {
    errors.dayOfWeek = "Select a valid day of the week";
  }
  if (data.frequency === "monthly" && (data.dayOfMonth < 1 || data.dayOfMonth > 31)) {
    errors.dayOfMonth = "Select a valid day of the month (1-31)";
  }
  return errors;
}

// ─── Component Props ──────────────────────────────────────────────────

interface ScheduledReportFormProps {
  /** Existing report to edit (omit for create mode). */
  initial?: ScheduledReport;
  /** Called with the form data when the user saves. */
  onSave: (data: Omit<ScheduledReport, "id" | "createdAt">) => Promise<void>;
  /** Called when the user cancels. */
  onCancel: () => void;
  /** Whether a save operation is in progress. */
  saving?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────

export default function ScheduledReportForm({
  initial,
  onSave,
  onCancel,
  saving = false,
}: ScheduledReportFormProps) {
  const [form, setForm] = useState<ScheduledReportFormData>(() => {
    if (initial) {
      return {
        title: initial.title,
        module: initial.module,
        groupBy: initial.groupBy,
        frequency: initial.frequency,
        dayOfWeek: initial.dayOfWeek ?? 1,
        dayOfMonth: initial.dayOfMonth ?? 1,
        format: initial.format,
        recipients: Array.isArray(initial.recipients)
          ? initial.recipients.join(", ")
          : String(initial.recipients ?? ""),
      };
    }
    return { ...INITIAL_FORM };
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = useCallback(
    <K extends keyof ScheduledReportFormData>(
      key: K,
      value: ScheduledReportFormData[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      // Clear error for this field on change
      setErrors((prev) => {
        if (prev[key as keyof FormErrors]) {
          const next = { ...prev };
          delete next[key as keyof FormErrors];
          return next;
        }
        return prev;
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validate(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      const recipients = form.recipients
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      await onSave({
        userId: initial?.userId ?? "", // caller should set this
        title: form.title.trim(),
        module: form.module,
        groupBy: form.groupBy,
        frequency: form.frequency,
        dayOfWeek: form.frequency === "weekly" ? form.dayOfWeek : undefined,
        dayOfMonth: form.frequency === "monthly" ? form.dayOfMonth : undefined,
        format: form.format,
        recipients,
        isActive: initial?.isActive ?? true,
        lastSentAt: initial?.lastSentAt,
        nextScheduledAt: initial?.nextScheduledAt,
      });
    },
    [form, initial, onSave],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border bg-card p-5"
    >
      <h2 className="text-lg font-semibold">
        {initial ? "✏️ Edit Scheduled Report" : "🕐 New Scheduled Report"}
      </h2>

      {/* Title */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Report Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="e.g. Monthly Lead Summary"
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${
            errors.title ? "border-red-500" : ""
          }`}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Module & Group By row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Module
          </label>
          <select
            value={form.module}
            onChange={(e) =>
              updateField("module", e.target.value as ReportFilter["module"])
            }
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {MODULES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Group By
          </label>
          <select
            value={form.groupBy}
            onChange={(e) =>
              updateField("groupBy", e.target.value as ReportFilter["groupBy"])
            }
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {GROUP_BY_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          Frequency
        </label>
        <div className="flex flex-wrap gap-4">
          {FREQUENCIES.map((f) => (
            <label
              key={f.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="frequency"
                value={f.value}
                checked={form.frequency === f.value}
                onChange={() => updateField("frequency", f.value)}
                className="text-primary"
              />
              <span className="text-sm">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Day selectors */}
      {form.frequency === "weekly" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Day of Week
          </label>
          <select
            value={form.dayOfWeek}
            onChange={(e) =>
              updateField("dayOfWeek", parseInt(e.target.value, 10))
            }
            className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${
              errors.dayOfWeek ? "border-red-500" : ""
            }`}
          >
            {DAY_NAMES.map((name, idx) => (
              <option key={idx} value={idx}>
                {name}
              </option>
            ))}
          </select>
          {errors.dayOfWeek && (
            <p className="mt-1 text-xs text-red-500">{errors.dayOfWeek}</p>
          )}
        </div>
      )}

      {form.frequency === "monthly" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Day of Month
          </label>
          <select
            value={form.dayOfMonth}
            onChange={(e) =>
              updateField("dayOfMonth", parseInt(e.target.value, 10))
            }
            className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${
              errors.dayOfMonth ? "border-red-500" : ""
            }`}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          {errors.dayOfMonth && (
            <p className="mt-1 text-xs text-red-500">{errors.dayOfMonth}</p>
          )}
        </div>
      )}

      {/* Format */}
      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          Export Format
        </label>
        <div className="flex flex-wrap gap-4">
          {(["csv", "pdf"] as ReportFormat[]).map((fmt) => (
            <label
              key={fmt}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="format"
                value={fmt}
                checked={form.format === fmt}
                onChange={() => updateField("format", fmt)}
                className="text-primary"
              />
              <span className="text-sm uppercase">{fmt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Recipients */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Recipients (comma-separated emails)
        </label>
        <input
          type="text"
          value={form.recipients}
          onChange={(e) => updateField("recipients", e.target.value)}
          placeholder="agent@example.com, broker@example.com"
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${
            errors.recipients ? "border-red-500" : ""
          }`}
        />
        {errors.recipients && (
          <p className="mt-1 text-xs text-red-500">{errors.recipients}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : initial
              ? "Update Schedule"
              : "Save Schedule"}
        </button>
      </div>
    </form>
  );
}
