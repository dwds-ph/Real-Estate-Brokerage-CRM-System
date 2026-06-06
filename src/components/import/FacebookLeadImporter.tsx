/**
 * FacebookLeadImporter.tsx — Facebook & Instagram Lead Import Panel
 *
 * Sections:
 *   1. Connection — Facebook Page ID / Access Token input + form selector
 *   2. Settings — auto-poll, dedup strategy, auto-assign
 *   3. Import — manual import trigger + history table
 *   4. Field Mapping — view/edit default field mappings
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import {
  type FacebookSettings,
  type FacebookImportLog,
  type FacebookLeadForm,
  type FacebookFieldMapping,
  DEFAULT_FIELD_MAPPINGS,
} from "@/types/domains/facebook";
import {
  subscribeFacebookSettings,
  saveFacebookSettings,
  subscribeImportLogs,
  fetchLeadGenForms,
  importFacebookLeads,
} from "@/services/facebookLeadService";
// ─── Constants ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_OPTIONS = [
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "60 minutes" },
] as const;

const DUPLICATE_STRATEGIES: { value: FacebookSettings["onDuplicate"]; label: string }[] = [
  { value: "skip", label: "Skip" },
  { value: "update", label: "Update" },
  { value: "flag", label: "Flag" },
];

const DEFAULT_SETTINGS: Omit<FacebookSettings, "id" | "brokerId" | "createdBy" | "createdAt" | "updatedAt"> = {
  autoPollEnabled: false,
  pollIntervalMinutes: 15,
  onDuplicate: "skip",
  autoAssign: false,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function statusBadgeClasses(status: FacebookImportLog["status"]): string {
  switch (status) {
    case "running":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    case "partial":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  }
}

function statusLabel(status: FacebookImportLog["status"]): string {
  switch (status) {
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "partial":
      return "Partial";
  }
}

// ─── Toggle Switch (local, matches EmailPreferences pattern) ───────────────

function ToggleSwitch({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function FacebookLeadImporter() {
  const { t } = useTranslation();
  const { user, userProfile } = useAuth();

  // ── Connection state ──────────────────────────────────────────────
  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [leadForms, setLeadForms] = useState<FacebookLeadForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [fetchingForms, setFetchingForms] = useState(false);
  const [formFetchError, setFormFetchError] = useState("");

  const isConnected = !!(pageId && pageAccessToken);

  // ── Settings state ────────────────────────────────────────────────
  const [settingsDoc, setSettingsDoc] = useState<FacebookSettings | null>(null);
  const [autoPollEnabled, setAutoPollEnabled] = useState(DEFAULT_SETTINGS.autoPollEnabled);
  const [pollInterval, setPollInterval] = useState(DEFAULT_SETTINGS.pollIntervalMinutes);
  const [onDuplicate, setOnDuplicate] = useState<FacebookSettings["onDuplicate"]>(DEFAULT_SETTINGS.onDuplicate);
  const [autoAssign, setAutoAssign] = useState(DEFAULT_SETTINGS.autoAssign);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Import state ──────────────────────────────────────────────
  const [importing, setImporting] = useState(false);
  const [importLogs, setImportLogs] = useState<FacebookImportLog[]>([]);
  const [importError, setImportError] = useState("");

  // ── Field mapping state ───────────────────────────────────────
  const [fieldMappings, setFieldMappings] = useState<FacebookFieldMapping[]>(DEFAULT_FIELD_MAPPINGS);

  // ── Subscriptions ────────────────────────────────────────────────

  useEffect(() => {
    if (!userProfile?.brokerId) {return;}

    const unsub = subscribeFacebookSettings(userProfile.brokerId, (settings) => {
      if (settings.length > 0) {
        const doc = settings[0];
        setSettingsDoc(doc);
        setPageId(doc.pageId ?? "");
        setPageAccessToken(doc.pageAccessToken ?? "");
        setSelectedFormId(doc.leadFormId ?? "");
        setAutoPollEnabled(doc.autoPollEnabled);
        setPollInterval(doc.pollIntervalMinutes);
        setOnDuplicate(doc.onDuplicate);
        setAutoAssign(doc.autoAssign);
      }
    });

    return () => unsub();
  }, [userProfile?.brokerId]);

  // Subscribe to import logs when a settings doc exists
  useEffect(() => {
    if (!settingsDoc?.id) {return;}

    const unsub = subscribeImportLogs(settingsDoc.id, (logs) => {
      setImportLogs(logs);
    });

    return () => unsub();
  }, [settingsDoc?.id]);

  // ── Connection handlers ──────────────────────────────────────────

  const handleFetchForms = useCallback(async () => {
    if (!pageId.trim() || !pageAccessToken.trim()) {
      setFormFetchError("Please enter both Page ID and Access Token.");
      return;
    }

    setFetchingForms(true);
    setFormFetchError("");

    try {
      const forms = await fetchLeadGenForms(pageId.trim(), pageAccessToken.trim());
      setLeadForms(forms);
      if (forms.length > 0 && !selectedFormId) {
        setSelectedFormId(forms[0].formId);
      }
    } catch (err) {
      setFormFetchError(err instanceof Error ? err.message : "Failed to fetch lead forms.");
    } finally {
      setFetchingForms(false);
    }
  }, [pageId, pageAccessToken, selectedFormId]);

  // ── Settings handlers ────────────────────────────────────────────

  const handleSaveSettings = useCallback(async () => {
    if (!user || !userProfile?.brokerId) return;

    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const payload: FacebookSettings = {
        id: settingsDoc?.id ?? "",
        pageId: pageId.trim() || undefined,
        pageAccessToken: pageAccessToken.trim() || undefined,
        leadFormId: selectedFormId || undefined,
        autoPollEnabled,
        pollIntervalMinutes: pollInterval,
        onDuplicate,
        autoAssign,
        brokerId: userProfile.brokerId,
        createdBy: settingsDoc?.createdBy ?? user.uid,
        createdAt: settingsDoc?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };

      const docId = await saveFacebookSettings(payload, user.uid);
      if (!settingsDoc?.id) {
        // If this was a new doc, update our local doc ref
        setSettingsDoc((prev) => (prev ? { ...prev, id: docId } : { ...payload, id: docId }));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }, [
    settingsDoc,
    pageId,
    pageAccessToken,
    selectedFormId,
    autoPollEnabled,
    pollInterval,
    onDuplicate,
    autoAssign,
    user,
    userProfile?.brokerId,
  ]);

  // ── Import handler ────────────────────────────────────────────────

  const handleImportNow = useCallback(async () => {
    if (!settingsDoc?.id || !user || !userProfile?.brokerId) return;
    if (!pageId.trim() || !pageAccessToken.trim()) {
      setImportError("Configure your Facebook connection and save settings first.");
      return;
    }

    setImporting(true);
    setImportError("");

    try {
      // Fetch leads from the selected form (or first available form)
      const formToUse = selectedFormId || leadForms[0]?.formId;
      if (!formToUse) {
        setImportError("No lead form selected. Fetch forms and select one first.");
        setImporting(false);
        return;
      }

      // Dynamic import to avoid circular dependency — fetchLeadsFromForm is
      // used directly via the service's exported helper
      const { fetchLeadsFromForm } = await import("@/services/facebookLeadService");
      const rawLeads = await fetchLeadsFromForm(formToUse, pageAccessToken.trim());

      if (rawLeads.length === 0) {
        setImportError("No new leads found from the selected form.");
        setImporting(false);
        return;
      }

      await importFacebookLeads(
        settingsDoc.id,
        rawLeads,
        userProfile.brokerId,
        user.uid,
        { onDuplicate, autoAssign },
      );
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed unexpectedly.");
    } finally {
      setImporting(false);
    }
  }, [settingsDoc?.id, pageId, pageAccessToken, selectedFormId, leadForms, onDuplicate, autoAssign, user, userProfile?.brokerId]);

  // ── Field mapping handlers ────────────────────────────────────────

  const handleMappingChange = useCallback((index: number, newCrmField: string) => {
    setFieldMappings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], crmField: newCrmField };
      return next;
    });
  }, []);

  // ── Guard: no user ────────────────────────────────────────────────

  if (!user || !userProfile) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Please sign in to configure Facebook Lead Import.</p>
      </section>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  const lastSync = settingsDoc?.lastSyncAt;

  return (
    <section className="space-y-6">
      {/* ============================================================ */}
      {/* 1. Connection Section                                        */}
      {/* ============================================================ */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("facebookLeadImporter.connection", "Facebook Connection")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("facebookLeadImporter.connectionDesc", "Connect your Facebook Page to import lead ads.")}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              isConnected
                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-gray-400",
              )}
              aria-hidden="true"
            />
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="space-y-3">
          {/* Page ID */}
          <div>
            <label htmlFor="fb-page-id" className="block text-sm font-medium mb-1">
              Facebook Page ID
            </label>
            <input
              id="fb-page-id"
              type="text"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="e.g. 123456789012345"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Page Access Token */}
          <div>
            <label htmlFor="fb-access-token" className="block text-sm font-medium mb-1">
              Page Access Token
            </label>
            <input
              id="fb-access-token"
              type="password"
              value={pageAccessToken}
              onChange={(e) => setPageAccessToken(e.target.value)}
              placeholder="EAAx... long-lived token"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Fetch forms button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFetchForms}
              disabled={fetchingForms || !pageId.trim() || !pageAccessToken.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {fetchingForms ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Fetching...
                </span>
              ) : (
                "Fetch Lead Forms"
              )}
            </button>

            {leadForms.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {leadForms.length} form{leadForms.length !== 1 ? "s" : ""} found
              </span>
            )}
          </div>

          {formFetchError && (
            <p className="text-sm text-destructive">{formFetchError}</p>
          )}

          {/* Lead form selector */}
          {leadForms.length > 0 && (
            <div>
              <label htmlFor="fb-lead-form" className="block text-sm font-medium mb-1">
                Lead Gen Form
              </label>
              <select
                id="fb-lead-form"
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {leadForms.map((form) => (
                  <option key={form.id} value={form.formId}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Settings Section                                          */}
      {/* ============================================================ */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("facebookLeadImporter.settings", "Import Settings")}</h2>

        {/* Auto-poll toggle + interval */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Auto-poll</p>
            <p className="text-xs text-muted-foreground">
              Automatically fetch new leads on a schedule
            </p>
          </div>
          <ToggleSwitch
            enabled={autoPollEnabled}
            onChange={setAutoPollEnabled}
            label="Toggle auto-poll"
          />
        </div>

        {autoPollEnabled && (
          <div>
            <label htmlFor="poll-interval" className="block text-sm font-medium mb-1">
              Poll Interval
            </label>
            <select
              id="poll-interval"
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {POLL_INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Duplicate handling */}
        <div>
          <label htmlFor="dup-strategy" className="block text-sm font-medium mb-1">
            Duplicate Handling
          </label>
          <select
            id="dup-strategy"
            value={onDuplicate}
            onChange={(e) => setOnDuplicate(e.target.value as FacebookSettings["onDuplicate"])}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {DUPLICATE_STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            {onDuplicate === "skip" && "Skip importing duplicate leads"}
            {onDuplicate === "update" && "Update existing lead data with incoming values"}
            {onDuplicate === "flag" && "Import as new lead with a duplicate flag in notes"}
          </p>
        </div>

        {/* Auto-assign toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Auto-assign Leads</p>
            <p className="text-xs text-muted-foreground">
              Automatically route imported leads via assignment rules
            </p>
          </div>
          <ToggleSwitch
            enabled={autoAssign}
            onChange={setAutoAssign}
            label="Toggle auto-assign"
          />
        </div>

        {/* Save button */}
        <div className="pt-2 border-t">
          {saveError && <p className="text-sm text-destructive mb-2">{saveError}</p>}
          {saveSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-2">
              Settings saved successfully!
            </p>
          )}
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Import Section                                            */}
      {/* ============================================================ */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("facebookLeadImporter.importLeads", "Import Leads")}</h2>

          {/* Last sync */}
          {lastSync && (
            <span className="text-xs text-muted-foreground" title={formatDateTime(lastSync)}>
              Last sync: {timeAgo(lastSync)}
            </span>
          )}
        </div>

        {/* Import button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleImportNow}
            disabled={importing || !settingsDoc?.id}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {importing ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Importing...
              </span>
            ) : (
              "Import Now"
            )}
          </button>

          {!settingsDoc?.id && (
            <span className="text-xs text-muted-foreground">
              Save settings before importing
            </span>
          )}
        </div>

        {importError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {importError}
          </div>
        )}

        {/* Import history table */}
        {importLogs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="pb-2 pr-3">Started</th>
                  <th className="pb-2 pr-3">Completed</th>
                  <th className="pb-2 pr-3 text-right">Imported</th>
                  <th className="pb-2 pr-3 text-right">Skipped</th>
                  <th className="pb-2 pr-3 text-right">Flagged</th>
                  <th className="pb-2 pr-3 text-right">Errors</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {importLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-3 text-xs whitespace-nowrap" title={formatDateTime(log.startedAt)}>
                      {timeAgo(log.startedAt)}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.completedAt ? timeAgo(log.completedAt) : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right text-xs font-medium tabular-nums">
                      {log.imported}
                    </td>
                    <td className="py-2 pr-3 text-right text-xs tabular-nums">
                      {log.skipped}
                    </td>
                    <td className="py-2 pr-3 text-right text-xs tabular-nums">
                      {log.flagged}
                    </td>
                    <td className="py-2 pr-3 text-right text-xs tabular-nums">
                      {log.errors}
                    </td>
                    <td className="py-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          statusBadgeClasses(log.status),
                        )}
                      >
                        {log.status === "running" && (
                          <span className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                        )}
                        {statusLabel(log.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {importLogs.length === 0 && (
          <p className="text-sm text-muted-foreground py-3">
            No import history yet. Configure your connection and run your first import.
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. Field Mapping Section                                     */}
      {/* ============================================================ */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("facebookLeadImporter.fieldMapping", "Field Mapping")}</h2>
          <span className="text-xs text-muted-foreground">
            {fieldMappings.length} fields
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Map Facebook lead form fields to CRM lead fields.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <th className="pb-2 pr-3">Facebook Field</th>
                <th className="pb-2 pr-3">CRM Field</th>
                <th className="pb-2">Required</th>
              </tr>
            </thead>
            <tbody>
              {fieldMappings.map((mapping, index) => (
                <tr key={mapping.fbField} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-2 pr-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {mapping.fbField}
                    </code>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={mapping.crmField}
                      onChange={(e) => handleMappingChange(index, e.target.value)}
                      className="w-full rounded border bg-background px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="py-2">
                    {mapping.required ? (
                      <span className="text-xs text-destructive font-medium">Required</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Optional</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Changes to field mappings apply immediately to subsequent imports.
        </p>
      </div>
    </section>
  );
}
