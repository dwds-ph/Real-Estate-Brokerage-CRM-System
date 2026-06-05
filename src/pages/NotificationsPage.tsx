import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection, updateDocById } from "@/hooks/useFirestore";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import { AppNotification } from "@/types";
import { formatDateTime, timeAgo, cn } from "@/lib/utils";
import { getVirtualListStyle } from "@/lib/virtualList";

const NOTIF_TYPES = [
  { type: "lead", label: "Lead Updates", icon: "👥" },
  { type: "viewing", label: "Viewing Reminders", icon: "📅" },
  { type: "commission", label: "Commission Updates", icon: "💰" },
  { type: "task", label: "Task Assignments", icon: "✅" },
  { type: "mention", label: "@Mentions", icon: "@" },
  { type: "deal", label: "Deal Updates", icon: "🏆" },
  { type: "general", label: "General", icon: "📢" },
];

export default function NotificationsPage() {
  const { userProfile } = useAuth();
  const { data: notifications, loading } = useCollection<AppNotification>(
    "notifications",
    [],
  );
  const [filter, setFilter] = useState<string>("all");

  const myNotifications = notifications
    .filter((n) => (n as AppNotification).userId === userProfile?.id)
    .sort(
      (a, b) =>
        (b as AppNotification).createdAt - (a as AppNotification).createdAt,
    );

  const filtered =
    filter === "all"
      ? myNotifications
      : myNotifications.filter((n) => (n as AppNotification).type === filter);

  const unreadCount = myNotifications.filter(
    (n) => !(n as AppNotification).read,
  ).length;
  const countByType = (type: string) =>
    myNotifications.filter((n) => (n as AppNotification).type === type).length;

  const markAsRead = async (id: string) => {
    await updateDocById("notifications", id, { read: true });
  };

  const markAllRead = async () => {
    const unread = myNotifications.filter((n) => !(n as AppNotification).read);
    await Promise.all(
      unread.map((n) => updateDocById("notifications", n.id, { read: true })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 self-start sm:self-auto"
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border",
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-muted",
          )}
        >
          All ({myNotifications.length})
        </button>
        {NOTIF_TYPES.map((nt) => (
          <button
            key={nt.type}
            onClick={() => setFilter(nt.type)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border",
              filter === nt.type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted",
            )}
          >
            {nt.icon} {nt.label} ({countByType(nt.type)})
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <LoadingSpinner size="md" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No notifications here yet." />
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {filtered.map((n, index) => {
            const notif = n as AppNotification;
            return (
              <div
                key={notif.id}
                style={getVirtualListStyle(index)}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={cn(
                  "rounded-lg border p-4 cursor-pointer transition-colors",
                  !notif.read
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card hover:bg-muted/50",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">
                    {notif.type === "lead"
                      ? "👥"
                      : notif.type === "viewing"
                        ? "📅"
                        : notif.type === "commission"
                          ? "💰"
                          : notif.type === "task"
                            ? "✅"
                            : notif.type === "mention"
                              ? "@"
                              : notif.type === "deal"
                                ? "🏆"
                                : "📢"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{notif.title}</p>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notif.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDateTime(notif.createdAt)} ·{" "}
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
