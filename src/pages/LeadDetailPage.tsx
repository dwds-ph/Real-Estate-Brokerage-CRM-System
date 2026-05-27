import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDoc, updateDocById } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { Lead, CommLogEntry } from "@/types";
import { timeAgo, getLeadStatusColor, getScoreColor, cn } from "@/lib/utils";
import QuickLog from "@/components/automation/QuickLog";
import ChecklistWidget from "@/components/automation/ChecklistWidget";

const STATUS_OPTIONS = [
  "new",
  "contacted",
  "viewed",
  "negotiating",
  "closed",
  "lost",
] as const;
const SCORE_OPTIONS = ["hot", "warm", "cold"] as const;

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data: lead, loading } = useDoc<Lead>("leads", id);
  const [commText, setCommText] = useState("");
  const [commType, setCommType] = useState<CommLogEntry["type"]>("call");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Lead not found
      </div>
    );
  }

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await updateDocById("leads", id, {
      status,
      activityTimeline: [
        ...(lead.activityTimeline || []),
        {
          action: `Status changed to ${status}`,
          timestamp: Date.now(),
          by: userProfile?.displayName || "Unknown",
        },
      ],
    });
  };

  const handleScoreChange = async (score: string) => {
    if (!id) return;
    await updateDocById("leads", id, { score });
  };

  const handleAddCommLog = async () => {
    if (!id || !commText.trim() || !userProfile) return;
    setSaving(true);
    const entry: CommLogEntry = {
      type: commType,
      note: commText.trim(),
      timestamp: Date.now(),
      by: userProfile.displayName,
    };
    await updateDocById("leads", id, {
      communicationLog: [...(lead.communicationLog || []), entry],
      activityTimeline: [
        ...(lead.activityTimeline || []),
        {
          action: `${commType} logged: ${commText.trim().slice(0, 50)}${commText.length > 50 ? "..." : ""}`,
          timestamp: Date.now(),
          by: userProfile.displayName,
        },
      ],
    });
    setCommText("");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/leads")}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Leads
      </button>

      {/* Header Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.name}</h1>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  getLeadStatusColor(lead.status),
                )}
              >
                {lead.status}
              </span>
              <span
                className={cn("text-sm font-medium", getScoreColor(lead.score))}
              >
                {lead.score === "hot"
                  ? "🔥"
                  : lead.score === "warm"
                    ? "👋"
                    : "❄️"}{" "}
                {lead.score}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {lead.phone && <span>📞 {lead.phone}</span>}
              {lead.email && <span>📧 {lead.email}</span>}
              <span>📋 Source: {lead.source}</span>
              {lead.propertyInterest && (
                <span>🏠 Interested in: {lead.propertyInterest}</span>
              )}
              {lead.budget && (
                <span>💰 Budget: ₱{lead.budget.toLocaleString()}</span>
              )}
              {lead.location && <span>📍 {lead.location}</span>}
            </div>
            {lead.notes && (
              <p className="text-sm text-muted-foreground mt-2">{lead.notes}</p>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            <p>Created {timeAgo(lead.createdAt)}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Status:</span>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1 text-xs"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Score:</span>
            <select
              value={lead.score}
              onChange={(e) => handleScoreChange(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1 text-xs"
            >
              {SCORE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Log */}
        <div className="space-y-4">
          <QuickLog leadId={id!} lead={lead} onLogged={() => {}} />
          {/* Activity Timeline */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {!lead.activityTimeline || lead.activityTimeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity yet
                </p>
              ) : (
                [...lead.activityTimeline].reverse().map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {i < lead.activityTimeline.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(entry.timestamp)} by {entry.by}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Communication Log */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Communication Log</h2>
            <div className="flex gap-2 mb-3">
              <select
                value={commType}
                onChange={(e) =>
                  setCommType(e.target.value as CommLogEntry["type"])
                }
                className="rounded-lg border bg-background px-2 py-1 text-xs"
              >
                <option value="call">📞 Call</option>
                <option value="text">💬 Text</option>
                <option value="meeting">🤝 Meeting</option>
                <option value="email">📧 Email</option>
              </select>
              <input
                type="text"
                value={commText}
                onChange={(e) => setCommText(e.target.value)}
                placeholder="Log a call, text, or meeting..."
                className="flex-1 rounded-lg border bg-background px-3 py-1 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddCommLog()}
              />
              <button
                onClick={handleAddCommLog}
                disabled={!commText.trim() || saving}
                className="rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
              >
                Log
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {!lead.communicationLog || lead.communicationLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No communication logged yet
                </p>
              ) : (
                [...lead.communicationLog].reverse().map((entry, i) => (
                  <div key={i} className="rounded-lg bg-muted/50 p-3 text-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span>
                        {entry.type === "call"
                          ? "📞"
                          : entry.type === "text"
                            ? "💬"
                            : entry.type === "meeting"
                              ? "🤝"
                              : "📧"}
                        {entry.type}
                      </span>
                      <span>{timeAgo(entry.timestamp)}</span>
                      <span>by {entry.by}</span>
                    </div>
                    <p>{entry.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checklist Widget */}
          {id && <ChecklistWidget scopeType="lead" scopeId={id} />}
        </div>
      </div>
    </div>
  );
}
