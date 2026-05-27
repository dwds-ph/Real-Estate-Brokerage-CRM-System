import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CommTemplate } from '@/types';
import {
  fetchCommTemplates,
  createCommTemplate,
  updateCommTemplate,
  deleteCommTemplate,
} from '@/services/commTemplates';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect?: (template: CommTemplate) => void;
}

export default function CommTemplateManager({ open, onClose, onSelect }: Props) {
  const { userProfile } = useAuth();
  const [templates, setTemplates] = useState<CommTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'call' as CommTemplate['type'], body: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadTemplates();
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommTemplates();
      setTemplates(data);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', type: 'call', body: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !form.name.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateCommTemplate(editingId, form);
      } else {
        await createCommTemplate({ ...form, createdBy: userProfile.id });
      }
      resetForm();
      await loadTemplates();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await deleteCommTemplate(id);
      await loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const editTemplate = (tpl: CommTemplate) => {
    setForm({ name: tpl.name, type: tpl.type, body: tpl.body });
    setEditingId(tpl.id);
    setShowForm(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Communication Templates</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        {/* Template List */}
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : templates.length === 0 && !showForm ? (
          <div className="text-center py-6 text-sm text-muted-foreground">No templates yet. Create your first one!</div>
        ) : (
          <div className="space-y-2 mb-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tpl.name}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground capitalize">{tpl.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">{tpl.body}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {onSelect && (
                      <button
                        onClick={() => onSelect(tpl)}
                        className="rounded px-2 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Use
                      </button>
                    )}
                    <button onClick={() => editTemplate(tpl)} className="rounded p-1 text-xs text-muted-foreground hover:text-foreground">✏️</button>
                    <button onClick={() => handleDelete(tpl.id)} className="rounded p-1 text-xs text-red-500 hover:text-red-700">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toggle Form */}
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="w-full rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-solid transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Template'}
        </button>

        {/* Create/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Follow-up Call"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CommTemplate['type'] })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="call">📞 Call</option>
                <option value="text">💬 Text</option>
                <option value="meeting">🤝 Meeting</option>
                <option value="email">📧 Email</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Body</label>
              <textarea
                required
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Template message content..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
