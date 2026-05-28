import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface NotificationPreferences {
  inApp: Record<string, boolean>;
  push: Record<string, boolean>;
  email: Record<string, boolean>;
}

const NOTIFICATION_TYPES = [
  { key: "lead", label: "Lead Updates", icon: "👥" },
  { key: "viewing", label: "Viewing Reminders", icon: "📅" },
  { key: "commission", label: "Commission Updates", icon: "💰" },
  { key: "task", label: "Task Assignments", icon: "✅" },
  { key: "mention", label: "@Mentions", icon: "@" },
  { key: "deal", label: "Deal Updates", icon: "🏆" },
  { key: "general", label: "General", icon: "📢" },
];

const CHANNELS = [
  {
    key: "inApp",
    label: "In-App",
    description: "Notifications inside the app",
  },
  {
    key: "push",
    label: "Push",
    description: "Push notifications on your device",
  },
  { key: "email", label: "Email", description: "Email notifications" },
] as const;

function defaultPrefs(): NotificationPreferences {
  const all: Record<string, boolean> = {};
  NOTIFICATION_TYPES.forEach((t) => (all[t.key] = true));
  return { inApp: { ...all }, push: { ...all }, email: { ...all } };
}

export default function NotificationPreferencesPage() {
  const { userProfile } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) {return;}
    const loadPrefs = async () => {
      try {
        const snap = await getDoc(
          doc(db, "notificationPreferences", userProfile.id),
        );
        if (snap.exists()) {
          setPrefs(snap.data() as NotificationPreferences);
        } else {
          setPrefs(defaultPrefs());
        }
      } catch {
        setPrefs(defaultPrefs());
      } finally {
        setLoading(false);
      }
    };
    loadPrefs();
  }, [userProfile?.id]);

  const toggle = (channel: "inApp" | "push" | "email", key: string) => {
    setPrefs((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], [key]: !prev[channel][key] },
    }));
  };

  const toggleChannelAll = (
    channel: "inApp" | "push" | "email",
    value: boolean,
  ) => {
    const updated: Record<string, boolean> = {};
    NOTIFICATION_TYPES.forEach((t) => (updated[t.key] = value));
    setPrefs((prev) => ({ ...prev, [channel]: updated }));
  };

  const handleSave = async () => {
    if (!userProfile?.id) {return;}
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, "notificationPreferences", userProfile.id), prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Control how you receive notifications
        </p>
      </div>

      {/* Channel columns */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 pr-4 font-medium">Type</th>
              {CHANNELS.map((ch) => (
                <th key={ch.key} className="text-center py-3 px-2 font-medium">
                  <div>{ch.label}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {ch.description}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_TYPES.map((nt) => (
              <tr key={nt.key} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <span className="mr-2">{nt.icon}</span>
                  {nt.label}
                </td>
                {CHANNELS.map((ch) => (
                  <td key={ch.key} className="text-center py-3 px-2">
                    <button
                      onClick={() => toggle(ch.key, nt.key)}
                      className={cn(
                        "inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        prefs[ch.key][nt.key]
                          ? "bg-primary"
                          : "bg-gray-300 dark:bg-gray-600",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          prefs[ch.key][nt.key]
                            ? "translate-x-6"
                            : "translate-x-1",
                        )}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary toggles per channel */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((ch) => {
          const enabledCount = Object.values(prefs[ch.key]).filter(
            Boolean,
          ).length;
          const total = NOTIFICATION_TYPES.length;
          const allOn = enabledCount === total;
          const allOff = enabledCount === 0;
          return (
            <div key={ch.key} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{ch.label}</p>
                <span className="text-xs text-muted-foreground">
                  {enabledCount}/{total}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleChannelAll(ch.key, true)}
                  className={cn(
                    "rounded px-2 py-1 text-xs border",
                    allOn
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted",
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => toggleChannelAll(ch.key, false)}
                  className={cn(
                    "rounded px-2 py-1 text-xs border",
                    allOff
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "hover:bg-muted",
                  )}
                >
                  None
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Preferences saved!
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </div>
  );
}
