import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ReminderPrefs {
  followUpInactiveLeads: boolean;
  viewingFeedbackReminders: boolean;
  documentExpiryAlerts: boolean;
  leadReminderDays: number;
  documentExpiryDays: number;
}

const STORAGE_KEY = 'smart-reminder-prefs';

function loadPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    followUpInactiveLeads: true,
    viewingFeedbackReminders: true,
    documentExpiryAlerts: true,
    leadReminderDays: 3,
    documentExpiryDays: 7,
  };
}

function savePrefs(prefs: ReminderPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function RemindersPage() {
  const [prefs, setPrefs] = useState<ReminderPrefs>(loadPrefs);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof ReminderPrefs) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      savePrefs(next);
      return next;
    });
  };

  const handleChange = (key: keyof ReminderPrefs, value: number) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      savePrefs(next);
      return next;
    });
  };

  const handleSave = () => {
    savePrefs(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Smart Reminder Preferences</h1>
        <p className="text-muted-foreground">
          Configure which automated reminders appear on the calendar
        </p>
      </div>

      {/* Toggle cards */}
      <div className="space-y-3">
        <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Follow up with inactive leads</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Remind you to reach out to leads who haven't been contacted recently
            </p>
          </div>
          <button
            onClick={() => toggle('followUpInactiveLeads')}
            className={cn(
              'inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4',
              prefs.followUpInactiveLeads ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                prefs.followUpInactiveLeads ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>

        <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Viewing feedback reminders</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prompt you to collect feedback after completed viewings
            </p>
          </div>
          <button
            onClick={() => toggle('viewingFeedbackReminders')}
            className={cn(
              'inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4',
              prefs.viewingFeedbackReminders ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                prefs.viewingFeedbackReminders ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>

        <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Document expiry alerts</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Warn you when documents are about to expire
            </p>
          </div>
          <button
            onClick={() => toggle('documentExpiryAlerts')}
            className={cn(
              'inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4',
              prefs.documentExpiryAlerts ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                prefs.documentExpiryAlerts ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>
      </div>

      {/* Configurable thresholds */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold">Reminder Thresholds</h3>

        <div>
          <label className="block text-sm font-medium mb-1">
            Lead inactivity threshold (days)
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={prefs.leadReminderDays}
            onChange={(e) => handleChange('leadReminderDays', parseInt(e.target.value) || 3)}
            className="w-24 rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leads inactive for this many days will trigger a follow-up reminder
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Document expiry warning (days before)
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={prefs.documentExpiryDays}
            onChange={(e) => handleChange('documentExpiryDays', parseInt(e.target.value) || 7)}
            className="w-24 rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Alerts will appear this many days before a document expires
          </p>
        </div>
      </div>

      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">Preferences saved!</p>
      )}

      <button
        onClick={handleSave}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Save Preferences
      </button>
    </div>
  );
}
