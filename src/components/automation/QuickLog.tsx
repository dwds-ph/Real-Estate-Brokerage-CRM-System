import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateDocById } from "@/hooks/useFirestore";
import { CommTemplate, CommLogEntry, Lead } from "@/types";
import CommTemplateManager from "./CommTemplateManager";

export interface QuickLogProps {
  leadId: string;
  lead: Lead;
  onLogged: () => void;
}

export default function QuickLog({ leadId, lead, onLogged }: QuickLogProps) {
  const { userProfile } = useAuth();
  const [showTemplates, setShowTemplates] = useState(false);
  const [commText, setCommText] = useState("");
  const [commType, setCommType] = useState<CommLogEntry["type"]>("call");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectTemplate = (tpl: CommTemplate) => {
    setCommType(tpl.type);
    setCommText(tpl.body);
    setShowTemplates(false);
  };

  const handleQuickLog = async () => {
    if (!leadId || !commText.trim() || !userProfile) return;
    setSaving(true);
    try {
      const entry: CommLogEntry = {
        type: commType,
        note: commText.trim(),
        timestamp: Date.now(),
        by: userProfile.displayName,
      };
      await updateDocById("leads", leadId, {
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
      showToast("✅ Communication logged successfully");
      onLogged();
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to log communication");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Quick Log</h3>
        <button
          onClick={() => setShowTemplates(true)}
          className="text-xs text-primary hover:underline"
        >
          Templates
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <select
          value={commType}
          onChange={(e) => setCommType(e.target.value as CommLogEntry["type"])}
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
          placeholder="Type a quick note..."
          className="flex-1 rounded-lg border bg-background px-3 py-1 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleQuickLog()}
        />
        <button
          onClick={handleQuickLog}
          disabled={!commText.trim() || saving}
          className="rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
        >
          {saving ? "..." : "Log"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="text-xs text-center text-green-600 dark:text-green-400 mt-1">
          {toast}
        </div>
      )}

      {/* Template Manager Modal */}
      <CommTemplateManager
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
}
