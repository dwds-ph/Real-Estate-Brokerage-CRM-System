import { useState, useCallback } from "react";
import { getDocs, collection, query, limit, where, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePermissions } from "@/hooks/usePermissions";
import { EmptyState, LoadingSpinner } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────

interface CollectionInfo {
  name: string;
  expectedCount: number | null;
  actualCount: number;
  status: "ok" | "warning" | "error";
  note?: string;
}

interface OrphanCheck {
  label: string;
  status: "ok" | "warning" | "error";
  orphans: number;
  detail: string;
}

interface IntegrityResult {
  collections: CollectionInfo[];
  orphans: OrphanCheck[];
  totalWarnings: number;
  totalErrors: number;
}

type CheckState = "idle" | "running" | "done" | "error";

// ─── Collections to inspect ───────────────────────────────────────

const COLLECTIONS_TO_CHECK = [
  "users",
  "leads",
  "listings",
  "deals",
  "payments",
  "payouts",
  "viewings",
  "tasks",
  "expenses",
  "notifications",
  "auditLogs",
  "documents",
  "mortgages",
  "tours",
  "licenses",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────

async function countCollection(collectionName: string): Promise<number> {
  // Firestore count queries via aggregation queries are ideal but may not be
  // available on all plans. Fallback: fetch all doc IDs with a small payload.
  // We use a query with only the document ID to minimize bandwidth.
  const snap = await getDocs(
    query(collection(db, collectionName), limit(5000)),
  );
  return snap.size;
}

async function checkOrphans(
  childCollection: string,
  childField: string,
  parentCollection: string,
  _parentField: string,
  brokerId?: string,
): Promise<{ orphans: number; detail: string }> {
  const childSnap = await getDocs(
    query(
      collection(db, childCollection),
      ...(brokerId ? [where("brokerId", "==", brokerId)] : []),
      limit(2000),
    ),
  );

  const parentIds = new Set<string>();
  const missingRefs: string[] = [];

  for (const childDoc of childSnap.docs) {
    const refId = childDoc.data()[childField] as string | undefined;
    if (!refId) {continue;}
    parentIds.add(refId);
  }

  if (parentIds.size === 0) {return { orphans: 0, detail: "No references found" };}

  // Check each parent ID in batches (Firestore 'in' supports up to 10)
  const idArray = Array.from(parentIds);
  let missingCount = 0;

  for (let i = 0; i < idArray.length; i += 10) {
    const batch = idArray.slice(i, i + 10);
    const parentSnap = await getDocs(
      query(
        collection(db, parentCollection),
        where(documentId(), "in", batch),
      ),
    );
    const foundIds = new Set(parentSnap.docs.map((d) => d.id));
    for (const id of batch) {
      if (!foundIds.has(id)) {
        missingCount++;
        if (missingRefs.length < 5) {missingRefs.push(id.slice(0, 12));}
      }
    }
  }

  const detail =
    missingCount > 0
      ? `${missingCount} orphaned reference(s)${
          missingRefs.length > 0
            ? ` (e.g. ${missingRefs.join(", ")})`
            : ""
        }`
      : "All references valid";

  return { orphans: missingCount, detail };
}

// ─── Component ────────────────────────────────────────────────────

export function DataIntegrityReport() {
  const { canViewAudit } = usePermissions();
  const [state, setState] = useState<CheckState>("idle");
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setState("running");
    setError(null);
    setResult(null);

    try {
      // 1. Count documents in each collection
      const collectionResults: CollectionInfo[] = [];
      for (const name of COLLECTIONS_TO_CHECK) {
        const count = await countCollection(name);
        collectionResults.push({
          name,
          expectedCount: null, // optional: read from a metadata doc later
          actualCount: count,
          status: count === 0 ? "warning" : "ok",
          note: count === 0 ? "Collection is empty" : undefined,
        });
      }

      // 2. Check for orphaned records
      const orphanResults: OrphanCheck[] = [];

      // Payments referencing non-existent deals
      const paymentsVsDeals = await checkOrphans(
        "payments",
        "dealId",
        "deals",
        "id",
      );
      orphanResults.push({
        label: "Payments → Deals",
        status: paymentsVsDeals.orphans > 0 ? "error" : "ok",
        orphans: paymentsVsDeals.orphans,
        detail: paymentsVsDeals.detail,
      });

      // Viewings referencing non-existent listings
      const viewingsVsListings = await checkOrphans(
        "viewings",
        "listingId",
        "listings",
        "id",
      );
      orphanResults.push({
        label: "Viewings → Listings",
        status: viewingsVsListings.orphans > 0 ? "error" : "ok",
        orphans: viewingsVsListings.orphans,
        detail: viewingsVsListings.detail,
      });

      // Viewings referencing non-existent leads
      const viewingsVsLeads = await checkOrphans(
        "viewings",
        "leadId",
        "leads",
        "id",
      );
      orphanResults.push({
        label: "Viewings → Leads",
        status: viewingsVsLeads.orphans > 0 ? "error" : "ok",
        orphans: viewingsVsLeads.orphans,
        detail: viewingsVsLeads.detail,
      });

      // Documents referencing non-existent deals
      const docsVsDeals = await checkOrphans(
        "documents",
        "dealId",
        "deals",
        "id",
      );
      orphanResults.push({
        label: "Documents → Deals",
        status: docsVsDeals.orphans > 0 ? "error" : "ok",
        orphans: docsVsDeals.orphans,
        detail: docsVsDeals.detail,
      });

      // Mortgages referencing non-existent deals
      const mortgagesVsDeals = await checkOrphans(
        "mortgages",
        "dealId",
        "deals",
        "id",
      );
      orphanResults.push({
        label: "Mortgages → Deals",
        status: mortgagesVsDeals.orphans > 0 ? "error" : "ok",
        orphans: mortgagesVsDeals.orphans,
        detail: mortgagesVsDeals.detail,
      });

      // Expenses referencing non-existent deals
      const expensesVsDeals = await checkOrphans(
        "expenses",
        "dealId",
        "deals",
        "id",
      );
      orphanResults.push({
        label: "Expenses → Deals",
        status: expensesVsDeals.orphans > 0 ? "error" : "ok",
        orphans: expensesVsDeals.orphans,
        detail: expensesVsDeals.detail,
      });

      // Compute summary
      const totalWarnings = collectionResults.filter(
        (c) => c.status === "warning",
      ).length;
      const totalErrors =
        collectionResults.filter((c) => c.status === "error").length +
        orphanResults.filter((o) => o.status === "error").length;

      setResult({
        collections: collectionResults,
        orphans: orphanResults,
        totalWarnings,
        totalErrors,
      });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }, []);

  // ─── Access Denied ─────────────────────────────────────────────

  if (!canViewAudit) {
    return (
      <EmptyState
        icon="🔒"
        title="Access Denied"
        description="Only brokers and compliance officers can view the data integrity report."
      />
    );
  }

  // ─── Idle State ────────────────────────────────────────────────

  if (state === "idle") {
    return (
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h3 className="font-semibold text-lg">Data Integrity Report</h3>
            <p className="text-sm text-muted-foreground">
              Check for orphaned records, missing references, and collection
              inconsistencies across the database.
            </p>
          </div>
        </div>
        <button
          onClick={runCheck}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          ▶ Run Integrity Check
        </button>
      </div>
    );
  }

  // ─── Running State ─────────────────────────────────────────────

  if (state === "running") {
    return (
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h3 className="font-semibold text-lg">Data Integrity Report</h3>
            <p className="text-sm text-muted-foreground">
              Scanning collections and checking references…
            </p>
          </div>
        </div>
        <LoadingSpinner size="md" message="Running integrity checks..." />
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────

  if (state === "error") {
    return (
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h3 className="font-semibold text-lg">Data Integrity Report</h3>
            <p className="text-sm text-muted-foreground">
              An error occurred while running the check.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
        <button
          onClick={runCheck}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  // ─── Done State ────────────────────────────────────────────────

  const hasIssues = result!.totalErrors > 0 || result!.totalWarnings > 0;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h3 className="font-semibold text-lg">Data Integrity Report</h3>
            <p className="text-sm text-muted-foreground">
              {hasIssues
                ? `${result!.totalErrors} error(s), ${result!.totalWarnings} warning(s) found`
                : "All checks passed — no issues found."}
            </p>
          </div>
        </div>
        <button
          onClick={runCheck}
          className="rounded-lg border bg-background px-4 py-1.5 text-xs font-medium hover:bg-muted transition-colors shrink-0"
        >
          🔄 Re-run
        </button>
      </div>

      {/* Summary banner */}
      {!hasIssues && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
          <span>✅</span>
          <span>All collections and cross-references are consistent.</span>
        </div>
      )}

      {hasIssues && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 p-4 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            {result!.totalErrors > 0
              ? `${result!.totalErrors} integrity error(s) detected that may require manual cleanup.`
              : `${result!.totalWarnings} warning(s) — mostly empty collections.`}
          </span>
        </div>
      )}

      {/* Collection Counts Table */}
      <div>
        <h4 className="text-sm font-semibold mb-3">📦 Collection Counts</h4>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                  Collection
                </th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                  Expected
                </th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                  Actual
                </th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {result!.collections.map((col) => (
                <tr
                  key={col.name}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2 font-medium">{col.name}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {col.expectedCount ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {col.actualCount}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge status={col.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {col.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orphan Checks */}
      <div>
        <h4 className="text-sm font-semibold mb-3">🔗 Cross-Reference Integrity</h4>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                  Relationship
                </th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                  Orphans
                </th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {result!.orphans.map((orphan) => (
                <tr
                  key={orphan.label}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2 font-medium">{orphan.label}</td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge status={orphan.status} />
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {orphan.orphans}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">
                    {orphan.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state when no results */}
      {result!.collections.length === 0 && result!.orphans.length === 0 && (
        <EmptyState
          icon="📊"
          title="No data to inspect"
          description="The database appears to have no collections or the query returned no results."
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function StatusBadge({ status }: { status: "ok" | "warning" | "error" }) {
  const styles = {
    ok: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const labels = { ok: "✓ OK", warning: "⚠ Warn", error: "✗ Error" };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
