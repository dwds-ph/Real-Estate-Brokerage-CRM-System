import { type ActivityLog, type ActivityType } from "@/types";
import { timeAgo } from "@/lib/utils";

const activityIcons: Record<ActivityType, string> = {
  call: "📞",
  meeting: "🤝",
  email: "✉️",
  note: "📝",
  status_change: "🔄",
  task: "✅",
  tour: "📍",
  document: "📄",
};

interface ActivityTimelineProps {
  activities: ActivityLog[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  maxHeight?: string;
}

export default function ActivityTimeline({
  activities,
  loading,
  onDelete,
  maxHeight = "400px",
}: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0" style={{ maxHeight, overflowY: "auto" }}>
      {activities.map((activity, i) => (
        <div key={activity.id} className="relative flex gap-3 pb-4">
          {/* Timeline line */}
          {i < activities.length - 1 && (
            <div className="absolute left-[14px] top-7 bottom-0 w-px bg-border" />
          )}

          {/* Icon */}
          <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
            {activityIcons[activity.type] || "📌"}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{activity.title}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-muted-foreground">
                  {timeAgo(activity.createdAt)}
                </span>
                {onDelete && (
                  <button
                    onClick={() => onDelete(activity.id)}
                    className="text-[11px] text-muted-foreground hover:text-red-500 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            {activity.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {activity.description}
              </p>
            )}
            {activity.duration && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                ⏱ {activity.duration} min
              </p>
            )}
            {activity.createdByName && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                by {activity.createdByName}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
