import { useState } from "react";
import { useCollection } from "@/hooks/useFirestore";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import { AuditLog, AppUser } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { getVirtualListStyle } from "@/lib/virtualList";

type ActionFilter = "all" | "create" | "update" | "delete";

export default function ActivityPage() {
  const {
    data: activities,
    loading,
    error,
  } = useCollection<AuditLog>("auditLogs");
  const { data: users } = useCollection<AppUser>("users");
  const [filter, setFilter] = useState<ActionFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = activities
    .filter((a) => filter === "all" || a.action?.toLowerCase().includes(filter))
    .filter((a) => {
      if (!search) {return true;}
      const s = search.toLowerCase();
      return (
        a.action?.toLowerCase().includes(s) ||
        a.targetCollection?.toLowerCase().includes(s) ||
        a.userId?.toLowerCase().includes(s)
      );
    });

  const getUserName = (userId: string): string => {
    const u = users.find((u) => u.id === userId);
    return u ? u.displayName || userId.slice(0, 8) : userId.slice(0, 8);
  };

  const getActionIcon = (action: string): string => {
    const a = action?.toLowerCase() || "";
    if (a.includes("create") || a.includes("added")) {return "➕";}
    if (a.includes("update") || a.includes("changed") || a.includes("moved"))
      {return "✏️";}
    if (a.includes("delete") || a.includes("removed")) {return "🗑️";}
    if (a.includes("call") || a.includes("text") || a.includes("logged"))
      {return "📝";}
    return "🔄";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Feed</h1>
        <p className="text-muted-foreground">
          {activities.length} total events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(["all", "create", "update", "delete"] as ActionFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activity..."
          className="rounded-lg border bg-background px-3 py-1.5 text-xs w-full sm:w-48"
        />
      </div>

      {/* Activity List */}
      {loading ? (
        <LoadingSpinner size="md" />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-600 dark:text-red-400">
          Failed to load activity feed. {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? "No activity matches your search." : "No activity yet."}
        />
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {filtered.map((entry, index) => (
            <div
              key={entry.id}
              style={getVirtualListStyle(index)}
              className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">
                  {getActionIcon(entry.action)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {getUserName(entry.userId)}
                    </span>
                    <span className="text-sm">
                      {entry.action || "performed an action"}
                    </span>
                    {entry.targetCollection && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {entry.targetCollection}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatDateTime(entry.timestamp)}</span>
                    {entry.targetDocId && (
                      <span className="truncate">
                        Doc: {entry.targetDocId.slice(0, 16)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
