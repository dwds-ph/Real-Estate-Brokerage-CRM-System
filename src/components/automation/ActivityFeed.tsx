import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection } from "@/hooks/useFirestore";
import { AuditLog, AppUser } from "@/types";
import { timeAgo } from "@/lib/utils";

type ActionFilter = "all" | "create" | "update" | "delete";

export interface ActivityFeedProps {
  compact?: boolean;
}

export default function ActivityFeed({ compact }: ActivityFeedProps) {
  const navigate = useNavigate();
  const {
    data: activities,
    loading,
    error,
  } = useCollection<AuditLog>("auditLogs");
  const { data: users } = useCollection<AppUser>("users");
  const [filter, setFilter] = useState<ActionFilter>("all");

  const filtered =
    filter === "all"
      ? activities
      : activities.filter((a) => a.action?.toLowerCase().includes(filter));

  const displayActivities = compact ? filtered.slice(0, 10) : filtered;

  const getUserName = (userId: string): string => {
    const u = users.find((u) => u.id === userId);
    return u ? u.displayName || u.id.slice(0, 8) : userId.slice(0, 8);
  };

  const getActionIcon = (action: string): string => {
    const a = action?.toLowerCase() || "";
    if (a.includes("create") || a.includes("added")) return "➕";
    if (a.includes("update") || a.includes("changed") || a.includes("moved"))
      return "✏️";
    if (a.includes("delete") || a.includes("removed")) return "🗑️";
    if (a.includes("call") || a.includes("text") || a.includes("logged"))
      return "📝";
    return "🔄";
  };

  const content = (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Activity Feed</h2>
          {activities.length > 10 && (
            <button
              onClick={() => navigate("/activity")}
              className="text-xs text-primary hover:underline"
            >
              View All →
            </button>
          )}
        </div>
      )}

      {/* Filter */}
      {!compact && (
        <div className="flex gap-2">
          {(["all", "create", "update", "delete"] as ActionFilter[]).map(
            (f) => (
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
            ),
          )}
        </div>
      )}

      {compact && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
          <button
            onClick={() => navigate("/activity")}
            className="text-xs text-primary hover:underline"
          >
            View All →
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">Failed to load activity</p>
      ) : displayActivities.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {filter !== "all"
            ? "No activity for this filter."
            : "No activity yet."}
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {displayActivities.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
            >
              <span className="text-lg shrink-0 mt-0.5">
                {getActionIcon(entry.action)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">
                    {getUserName(entry.userId)}
                  </span>{" "}
                  {entry.action || "performed an action"}
                  {entry.targetCollection && (
                    <span className="text-muted-foreground">
                      {" "}
                      on {entry.targetCollection}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo(entry.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All */}
      {compact && activities.length > 10 && (
        <div className="text-center pt-2">
          <button
            onClick={() => navigate("/activity")}
            className="text-sm text-primary hover:underline"
          >
            View All Activity →
          </button>
        </div>
      )}
    </div>
  );

  if (compact) {
    return content;
  }

  return <div className="rounded-lg border bg-card p-6">{content}</div>;
}
