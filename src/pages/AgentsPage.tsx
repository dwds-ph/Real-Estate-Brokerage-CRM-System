import { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useAgents } from "@/hooks/useFirestore";
import { AppUser } from "@/types";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const { userProfile } = useAuth();
  const { data: agents, loading, error: agentsError } = useAgents(userProfile?.id);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isBroker = userProfile?.role === "broker";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {return;}
    setError("");
    setSaving(true);
    try {
      // Check if email already exists as a user
      const q = query(
        collection(db, "users"),
        where("email", "==", inviteEmail),
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        setError("This email is already registered");
        setSaving(false);
        return;
      }

      // Create an invitation document
      await addDoc(collection(db, "invitations"), {
        brokerId: userProfile.id,
        brokerName: userProfile.displayName,
        email: inviteEmail,
        name: inviteName,
        status: "pending",
        createdAt: Date.now(),
      });

      setInviteSent(true);
      setInviteEmail("");
      setInviteName("");
      setTimeout(() => {
        setInviteSent(false);
        setShowInvite(false);
      }, 3000);
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setError(fbErr.message || "Failed to send invitation");
    } finally {
      setSaving(false);
    }
  };

  if (!isBroker) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Team</h1>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            You are under broker:{" "}
            {userProfile?.brokerId
              ? "Connected"
              : "Not yet connected to a broker"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-muted-foreground">Manage your team of agents</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 self-start sm:self-auto"
        >
          {showInvite ? "Cancel" : "+ Invite Agent"}
        </button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="rounded-lg border bg-card p-6 space-y-4 max-w-md"
        >
          <h3 className="font-semibold">Invite Agent</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Agent Name</label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="Maria Santos"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Agent Email
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="maria@example.com"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {inviteSent && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Invitation created!
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Sending..." : "Send Invitation"}
          </button>
        </form>
      )}

      {/* Error State */}
      {agentsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:bg-red-950/20">
          <p className="text-red-700 dark:text-red-400 mb-3">
            Failed to load agents: {agentsError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Team List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No agents yet. Invite your first agent!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const a = agent as AppUser;
            return (
              <div
                key={a.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {a.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {a.role}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{a.email}</p>
                  {a.phone && <p>{a.phone}</p>}
                  {a.licenseNumber && <p>License: {a.licenseNumber}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      a.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    {a.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
