import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection, updateDocById } from "@/hooks/useFirestore";
import { AppNotification } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { timeAgo, cn } from "@/lib/utils";

export default function NotificationBell() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data: notifications, loading } = useCollection<AppNotification>(
    "notifications",
    userProfile?.id ? [] : [],
  );
  const [open, setOpen] = useState(false);

  const myNotifications = notifications
    .filter((n) => (n as AppNotification).userId === userProfile?.id)
    .sort(
      (a, b) =>
        (b as AppNotification).createdAt - (a as AppNotification).createdAt,
    )
    .slice(0, 20);

  const unreadCount = myNotifications.filter(
    (n) => !(n as AppNotification).read,
  ).length;

  // Close on click outside
  useEffect(() => {
    if (!open) {return;}
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notification-bell]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAsRead = useCallback(async (id: string) => {
    await updateDocById("notifications", id, { read: true });
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = myNotifications.filter((n) => !(n as AppNotification).read);
    await Promise.all(
      unread.map((n) => updateDocById("notifications", n.id, { read: true })),
    );
  }, [myNotifications]);

  if (loading) {return null;}

  return (
    <div data-notification-bell className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-card shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {myNotifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              myNotifications.map((n) => {
                const notif = n as AppNotification;
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={cn(
                      "px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notif.read && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base mt-0.5">
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
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {notif.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="w-full text-center text-xs text-primary hover:underline"
            >
              See all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
