import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { Lead, Viewing, VaultDocument } from '@/types';
import { formatDate } from '@/lib/utils';

interface SmartReminder {
  id: string;
  type: 'follow-up' | 'feedback' | 'document-expiry';
  title: string;
  description: string;
  sourceUrl: string;
  icon: string;
  color: string;
}

const DISMISSED_KEY = 'smart-reminders-dismissed';

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignore
  }
  return new Set();
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids)));
}

export default function SmartReminders() {
  const { userProfile } = useAuth();
  const { data: leads } = useCollection<Lead>('leads', []);
  const { data: viewings } = useCollection<Viewing>('viewings', []);
  const { data: documents } = useCollection<VaultDocument>('vaultDocuments', []);

  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed);
  const [now] = useState(() => Date.now());

  const reminders = useMemo<SmartReminder[]>(() => {
    const list: SmartReminder[] = [];

    // Leads inactive > 3 days
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    for (const lead of leads as (Lead & { id: string })[]) {
      if (!lead.assignedTo || lead.assignedTo !== userProfile?.id) continue;
      const lastActivity = lead.updatedAt || lead.createdAt;
      if (now - lastActivity > threeDays && lead.status !== 'closed' && lead.status !== 'lost') {
        list.push({
          id: `followup-${lead.id}`,
          type: 'follow-up',
          title: `Follow up with ${lead.name}`,
          description: `Lead has been inactive since ${formatDate(lastActivity)}`,
          sourceUrl: `/leads/${lead.id}`,
          icon: '👤',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        });
      }
    }

    // Viewings done with no feedback
    for (const viewing of viewings as (Viewing & { id: string })[]) {
      if (viewing.status === 'done' && !viewing.feedback) {
        list.push({
          id: `feedback-${viewing.id}`,
          type: 'feedback',
          title: `Collect feedback for viewing`,
          description: `Viewing on ${formatDate(viewing.scheduledAt)} has no feedback recorded`,
          sourceUrl: `/viewings`,
          icon: '📋',
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        });
      }
    }

    // Documents expiring in < 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    for (const doc of documents as (VaultDocument & { id: string })[]) {
      if (doc.expiryDate && doc.expiryDate - now < sevenDays && doc.expiryDate > now) {
        list.push({
          id: `doc-expiry-${doc.id}`,
          type: 'document-expiry',
          title: `Document "${doc.name}" expiring soon`,
          description: `Expires on ${formatDate(doc.expiryDate)}`,
          sourceUrl: `/vault`,
          icon: '📄',
          color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        });
      }
    }

    // Filter dismissed
    return list.filter((r) => !dismissed.has(r.id));
  }, [leads, viewings, documents, userProfile?.id, dismissed, now]);

  const handleDismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  const handleDismissAll = () => {
    const allIds = new Set(reminders.map((r) => r.id));
    setDismissed(new Set([...dismissed, ...allIds]));
    saveDismissed(new Set([...dismissed, ...allIds]));
  };

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <span>🔔</span>
          Smart Reminders
        </h3>
        <button
          onClick={handleDismissAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Dismiss all
        </button>
      </div>

      <div className="space-y-2">
        {reminders.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border p-3 flex items-start gap-3"
          >
            <span className="text-lg shrink-0 mt-0.5">{r.icon}</span>
            <div className="flex-1 min-w-0">
              <a
                href={r.sourceUrl}
                className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
              >
                {r.title}
              </a>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {r.description}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(r.id)}
              className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
