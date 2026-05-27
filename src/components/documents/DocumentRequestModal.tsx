import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { createDocumentRequest } from '@/services/documentVault';
import { AppUser } from '@/types';

interface DocumentRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefillDealId?: string;
}

export default function DocumentRequestModal({
  open,
  onClose,
  onSuccess,
  prefillDealId,
}: DocumentRequestModalProps) {
  const { userProfile } = useAuth();
  const { data: agents, loading: agentsLoading } = useCollection<AppUser>(
    'users',
    userProfile?.role === 'broker'
      ? []
      : [],
  );

  const [toUserId, setToUserId] = useState('');
  const [dealId, setDealId] = useState(prefillDealId || '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setToUserId('');
        setDealId(prefillDealId || '');
        setDescription('');
        setError(null);
        setSubmitting(false);
      }, 0);
    }
  }, [open, prefillDealId]);

  // Filter to show only agents (not the current user)
  const availableAgents = agents.filter((a) => a.id !== userProfile?.id && a.role !== 'broker');
  const broker = agents.find((a) => a.role === 'broker');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserId || !description || !userProfile) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createDocumentRequest({
        fromUserId: userProfile.id,
        toUserId,
        dealId: dealId || undefined,
        description,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create request';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Request Document</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request To */}
          <div>
            <label className="mb-1 block text-sm font-medium">Request From *</label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Select an agent...</option>
              {userProfile?.role === 'agent' && broker && (
                <optgroup label="Broker">
                  <option value={broker.id}>
                    {broker.displayName} (Broker)
                  </option>
                </optgroup>
              )}
              {availableAgents.length > 0 && (
                <optgroup label={userProfile?.role === 'broker' ? 'Agents' : 'Other Agents'}>
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.displayName} {agent.role !== 'agent' ? `(${agent.role})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {agentsLoading && <option disabled>Loading agents...</option>}
              {!agentsLoading && availableAgents.length === 0 && (
                <option disabled>No other agents available</option>
              )}
            </select>
          </div>

          {/* Deal ID */}
          <div>
            <label className="mb-1 block text-sm font-medium">Deal ID</label>
            <input
              type="text"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              rows={3}
              placeholder="Describe what document you need..."
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              disabled={submitting || !toUserId || !description}
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
