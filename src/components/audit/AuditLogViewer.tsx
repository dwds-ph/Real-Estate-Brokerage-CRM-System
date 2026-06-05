import { useState, useMemo } from "react";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import type { AuditLogEntry, AuditAction } from "@/types";
import { formatDateTime } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
  loading: boolean;
  error: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────

const COLLECTION_OPTIONS = [
  "all",
  "leads",
  "listings",
  "deals",
  "payments",
  "payouts",
  "expenses",
  "users",
  "tours",
  "viewings",
  "tasks",
  "documents",
  "notifications",
] as const;

const ACTION_OPTIONS: (AuditAction | "all")[] = [
  "all",
  "created",
  "updated",
  "deleted",
];

function getActionBadge(action: string): string {
  switch (action) {
    case "created":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "updated":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "deleted":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

// ─── Component ────────────────────────────────────────────────────

export function AuditLogViewer({
  logs,
  loading,
  error,
}: AuditLogViewerProps) {
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (collectionFilter !== "all" && log.collection !== collectionFilter) {return false;}
      if (actionFilter !== "all" && log.action !== actionFilter) {return false;}
      if (userFilter) {
        const q = userFilter.toLowerCase();
        if (
          !log.userName?.toLowerCase().includes(q) &&
          !log.userEmail?.toLowerCase().includes(q) &&
          !log.userId?.toLowerCase().includes(q)
        ) {return false;}
      }
      if (dateFrom && log.timestamp < new Date(dateFrom).getTime()) {return false;}
      if (dateTo) {
        const endOfDay = new Date(dateTo).getTime() + 86_400_000;
        if (log.timestamp > endOfDay) {return false;}
      }
      return true;
    });
  }, [logs, collectionFilter, actionFilter, userFilter, dateFrom, dateTo]);

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    logs.forEach((l) => {
      if (!map.has(l.userId)) {
        map.set(l.userId, { name: l.userName, email: l.userEmail });
      }
    });
    return Array.from(map.entries());
  }, [logs]);

  if (loading) {
    return <LoadingSpinner size="md" message="Loading audit logs..." />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-600 dark:text-red-400">
        Failed to load audit logs. {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Collection filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Entity</label>
          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-xs"
          >
            {COLLECTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "all" ? "All Entities" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Action filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as AuditAction | "all")}
            className="rounded-lg border bg-background px-3 py-1.5 text-xs"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "all" ? "All Actions" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* User filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">User</label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-xs"
          >
            <option value="">All Users</option>
            {uniqueUsers.map(([id, u]) => (
              <option key={id} value={id}>
                {u.name || u.email || id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} of {logs.length} entries
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No audit entries match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Timestamp</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">User</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Action</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Entity</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Doc ID</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap max-w-[160px] truncate" title={`${log.userName} (${log.userEmail})`}>
                    {log.userName || log.userEmail || log.userId.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {log.collection}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-[120px] truncate font-mono text-[10px]" title={log.docId}>
                    {log.docId.slice(0, 16)}...
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      {expandedId === log.id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expanded diff view */}
      {expandedId && (() => {
        const log = logs.find((l) => l.id === expandedId);
        if (!log) {return null;}
        return (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h4 className="text-sm font-semibold">
              Change Details — {log.collection} / {log.docId.slice(0, 16)}...
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {log.before && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Before</h5>
                  <pre className="rounded bg-muted p-2 text-[10px] overflow-x-auto max-h-48">
                    {JSON.stringify(log.before, null, 2)}
                  </pre>
                </div>
              )}
              {log.after && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">After</h5>
                  <pre className="rounded bg-muted p-2 text-[10px] overflow-x-auto max-h-48">
                    {JSON.stringify(log.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              {log.metadata?.ip && <p>IP: {log.metadata.ip}</p>}
              {log.metadata?.userAgent && <p>UA: {log.metadata.userAgent}</p>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
