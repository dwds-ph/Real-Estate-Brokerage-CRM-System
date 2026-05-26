import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { createDoc, updateDocById } from '@/hooks/useFirestore';
import { Viewing, ViewingStatus } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';

export default function ViewingsPage() {
  const { userProfile } = useAuth();
  const { data: viewings } = useCollection<Viewing>('viewings', []);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    leadId: '',
    listingId: '',
    scheduledAt: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    await createDoc('viewings', {
      ...form,
      scheduledAt: new Date(form.scheduledAt).getTime(),
      agentId: userProfile.id,
      status: 'scheduled',
      photos: [],
      createdAt: Date.now(),
    });
    setShowForm(false);
    setForm({ leadId: '', listingId: '', scheduledAt: '', notes: '' });
  };

  const handleStatusChange = async (id: string, status: ViewingStatus) => {
    await updateDocById('viewings', id, { status });
  };

  const upcoming = viewings
    .filter((v) => (v as Viewing).status === 'scheduled')
    .sort((a, b) => (a as Viewing).scheduledAt - (b as Viewing).scheduledAt);

  const past = viewings
    .filter((v) => (v as Viewing).status !== 'scheduled')
    .sort((a, b) => (b as Viewing).scheduledAt - (a as Viewing).scheduledAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Viewings</h1>
          <p className="text-muted-foreground">{viewings.length} total viewings</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {showForm ? 'Cancel' : '+ Schedule Viewing'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4 max-w-md">
          <h3 className="font-semibold">Schedule Viewing</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Lead ID</label>
            <input type="text" required value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Lead document ID" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Listing ID</label>
            <input type="text" required value={form.listingId} onChange={(e) => setForm({ ...form, listingId: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Listing document ID" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={2} />
          </div>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Schedule</button>
        </form>
      )}

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">No upcoming viewings</div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((v) => {
              const viewing = v as Viewing;
              return (
                <div key={viewing.id} className="rounded-lg border bg-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{formatDateTime(viewing.scheduledAt)}</p>
                    <p className="text-xs text-muted-foreground">Lead: {viewing.leadId} | Listing: {viewing.listingId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusChange(viewing.id, 'done')} className="rounded-lg bg-green-100 px-3 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">✓ Done</button>
                    <button onClick={() => handleStatusChange(viewing.id, 'cancelled')} className="rounded-lg bg-red-100 px-3 py-1 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">✕ Cancel</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Past ({past.length})</h2>
        <div className="space-y-2">
          {past.map((v) => {
            const viewing = v as Viewing;
            return (
              <div key={viewing.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{formatDateTime(viewing.scheduledAt)}</p>
                    <p className="text-xs text-muted-foreground">Lead: {viewing.leadId} | Listing: {viewing.listingId}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', {
                    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300': viewing.status === 'done',
                    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': viewing.status === 'cancelled',
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400': viewing.status === 'no-show',
                  })}>
                    {viewing.status}
                  </span>
                </div>
                {viewing.feedback && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Interest: {viewing.feedback.interestLevel}</p>
                    {viewing.feedback.concerns && <p>Concerns: {viewing.feedback.concerns}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
