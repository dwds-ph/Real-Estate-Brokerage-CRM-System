import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useCollection } from "@/hooks/useFirestore";
import { where, orderBy, limit } from "firebase/firestore";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import { AuditLogViewer, DataIntegrityReport } from "@/components/audit";
import type { AuditLogEntry } from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function AuditPage() {
  const { userProfile } = useAuth();
  const { canViewAudit } = usePermissions();
  const orgId = userProfile?.id || userProfile?.brokerId || "";

  const constraints = useMemo(() => {
    if (!canViewAudit || !orgId) {return [];}
    return [
      where("orgId", "==", orgId),
      orderBy("timestamp", "desc"),
      limit(200),
    ];
  }, [canViewAudit, orgId]);

  const {
    data: logs,
    loading,
    error,
  } = useCollection<AuditLogEntry>(
    "auditLogs",
    constraints,
  );

  // ─── CSV Export ────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = [
      "Timestamp",
      "User Name",
      "User Email",
      "User ID",
      "Action",
      "Entity",
      "Doc ID",
      "IP",
    ];

    const rows = logs.map((log) => [
      formatDateTime(log.timestamp),
      log.userName || "",
      log.userEmail || "",
      log.userId,
      log.action,
      log.collection,
      log.docId,
      log.metadata?.ip || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Access Denied ─────────────────────────────────────────────

  if (!canViewAudit) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">Immutable change log for your organization</p>
        </div>
        <EmptyState
          icon="🔒"
          title="Access Restricted"
          description="Only brokers and compliance officers can view the audit trail. Contact your broker for access."
        />
      </div>
    );
  }

  // ─── Loading / Error ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">Immutable change log for your organization</p>
        </div>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">Immutable change log for your organization</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-600 dark:text-red-400">
          Failed to load audit logs. {error}
        </div>
      </div>
    );
  }

  // ─── Main View ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">
            Immutable change log for your organization
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={logs.length === 0}
          className="rounded-lg border bg-card px-4 py-2 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          ⬇ Export CSV
        </button>
      </div>

      <AuditLogViewer logs={logs} loading={false} error={null} />

      {/* ─── Data Integrity Report ──────────────────────────── */}
      <DataIntegrityReport />
    </div>
  );
}
