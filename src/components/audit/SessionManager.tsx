import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import {
  getActiveSessions,
  getAllSessionsForBroker,
  revokeSession,
} from "@/services/sessionService";
import type { UserSession } from "@/types";
import { formatDateTime } from "@/lib/utils";

function SessionRow({
  session,
  onRevoke,
  canRevoke,
}: {
  session: UserSession;
  onRevoke: (session: UserSession) => void;
  canRevoke: boolean;
}) {
  const lastActive = formatDateTime(session.lastActiveAt);
  const created = formatDateTime(session.createdAt);

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3 text-sm font-mono max-w-[200px] truncate" title={session.deviceInfo}>
        {session.deviceInfo}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">{lastActive}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">{created}</td>
      <td className="px-4 py-3 text-sm">
        {session.revokedAt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Revoked
          </span>
        ) : session.isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Ended
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {session.isActive && canRevoke && (
          <button
            onClick={() => onRevoke(session)}
            className="rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Revoke
          </button>
        )}
      </td>
    </tr>
  );
}

export function SessionManager() {
  const { user, userProfile } = useAuth();
  const { canViewAudit } = usePermissions();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const isBroker = userProfile?.role === "broker";
  const canManage = canViewAudit;

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchSessions = useCallback(async () => {
    if (!user) {return;}
    setLoading(true);
    setError(null);

    try {
      if (isBroker && userProfile?.id) {
        // Broker sees all agents' sessions
        const all = await getAllSessionsForBroker(userProfile.id);
        setSessions(all);
      } else {
        // Regular user sees own sessions
        const own = await getActiveSessions(user.uid);
        setSessions(own);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load sessions";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, isBroker, userProfile?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (session: UserSession) => {
    if (!user || !session.isActive) {return;}
    setRevoking(session.id);
    try {
      await revokeSession(session.userId, session.id, user.uid);
      // Optimistic update
      setSessions((prev) =>
        prev.map((s) =>
          s.id === session.id
            ? { ...s, isActive: false, revokedAt: Date.now(), revokedBy: user.uid }
            : s,
        ),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke session";
      // eslint-disable-next-line no-console
      console.error("[SessionManager] Revoke error:", msg);
    } finally {
      setRevoking(null);
    }
  };

  // ─── Access Denied ───────────────────────────────────────────

  if (!canManage) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Active Sessions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isBroker
              ? "Monitor and revoke sessions across your organisation"
              : "Monitor your active browser sessions"}
          </p>
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      )}

      {error && (
        <div className="mx-6 my-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="py-8">
          <EmptyState
            icon="🔐"
            title="No Active Sessions"
            description={
              isBroker
                ? "No agents currently have active browser sessions."
                : "You don't have any active sessions."
            }
          />
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Device
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Started
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  onRevoke={handleRevoke}
                  canRevoke={canManage && !revoking}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-border px-6 py-3">
        <p className="text-xs text-muted-foreground">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} found.
          Sessions automatically end on logout or can be revoked by a broker.
        </p>
      </div>
    </div>
  );
}
