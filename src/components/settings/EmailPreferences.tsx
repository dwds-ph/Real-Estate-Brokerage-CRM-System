import { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { EmailPreferences as EmailPreferencesType, NotificationType } from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────

type ToggleType = "email" | "inApp";

interface ToggleOption {
  key: NotificationType;
  label: string;
  description: string;
}

const NOTIFICATION_OPTIONS: ToggleOption[] = [
  { key: "deal_updates", label: "Deal Updates", description: "Notify when deal status changes" },
  { key: "payment_reminders", label: "Payment Reminders", description: "Reminders for upcoming and overdue payments" },
  { key: "document_sharing", label: "Document Sharing", description: "Notify when documents are uploaded or shared" },
  { key: "broker_notifications", label: "Broker Notifications", description: "Notifications from your broker" },
  { key: "tour_confirmations", label: "Tour Confirmations", description: "Confirmations for scheduled property tours" },
  { key: "new_lead_alerts", label: "New Lead Alerts", description: "Alerts when new leads are assigned" },
];

const DEFAULT_PREFS: Omit<EmailPreferencesType, "id" | "userId" | "updatedAt"> = {
  deal_updates: { email: true, inApp: true },
  payment_reminders: { email: true, inApp: true },
  document_sharing: { email: true, inApp: true },
  broker_notifications: { email: true, inApp: true },
  tour_confirmations: { email: true, inApp: true },
  new_lead_alerts: { email: true, inApp: true },
};

// ─── Toggle Switch Component ──────────────────────────────────────────

function ToggleSwitch({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export default function EmailPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Omit<EmailPreferencesType, "id" | "userId" | "updatedAt">>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Load preferences from Firestore
  useEffect(() => {
    if (!user) return;

    const prefsDocRef = doc(db, "emailPreferences", user.uid);

    const unsubscribe = onSnapshot(
      prefsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<EmailPreferencesType>;
          setPreferences((prev) => ({
            ...prev,
            deal_updates: data.deal_updates ?? prev.deal_updates,
            payment_reminders: data.payment_reminders ?? prev.payment_reminders,
            document_sharing: data.document_sharing ?? prev.document_sharing,
            broker_notifications: data.broker_notifications ?? prev.broker_notifications,
            tour_confirmations: data.tour_confirmations ?? prev.tour_confirmations,
            new_lead_alerts: data.new_lead_alerts ?? prev.new_lead_alerts,
          }));
        }
        setLoading(false);
      },
      (err) => {
        console.error("[EmailPreferences] Error loading preferences:", err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  // Update a single toggle
  const handleToggle = (type: NotificationType, toggle: ToggleType) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [toggle]: !prev[type][toggle],
      },
    }));
  };

  // Save all preferences to Firestore
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await setDoc(doc(db, "emailPreferences", user.uid), {
        userId: user.uid,
        ...preferences,
        updatedAt: Date.now(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setError(fbErr.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Email & In-App Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose how you receive notifications for each event type.
        Toggle Email, In-App, or both per category.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-2 py-2 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div>Notification Type</div>
            <div className="text-center w-14">Email</div>
            <div className="text-center w-14">In-App</div>
          </div>

          {/* Rows */}
          {NOTIFICATION_OPTIONS.map((option) => (
            <div
              key={option.key}
              className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
              <div className="flex justify-center w-14">
                <ToggleSwitch
                  enabled={preferences[option.key].email}
                  onChange={() => handleToggle(option.key, "email")}
                  label={`${option.label} email notifications`}
                />
              </div>
              <div className="flex justify-center w-14">
                <ToggleSwitch
                  enabled={preferences[option.key].inApp}
                  onChange={() => handleToggle(option.key, "inApp")}
                  label={`${option.label} in-app notifications`}
                />
              </div>
            </div>
          ))}

          {/* Save button & status */}
          <div className="pt-4 border-t">
            {error && <p className="text-sm text-destructive mb-2">{error}</p>}
            {saved && (
              <p className="text-sm text-green-600 dark:text-green-400 mb-2">
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
        </div>
      )}
    </section>
  );
}
