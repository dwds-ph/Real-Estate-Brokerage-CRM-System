import { useState } from "react";
import { type ChecklistTemplate } from "@/types";

interface ChecklistTemplateManagerProps {
  templates: ChecklistTemplate[];
  onCreate: (data: { name: string; description: string; items: string[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLoad: (template: ChecklistTemplate) => void;
}

export default function ChecklistTemplateManager({
  templates,
  onCreate,
  onDelete,
  onLoad,
}: ChecklistTemplateManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}
    setSaving(true);
    try {
      const items = itemsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await onCreate({ name: name.trim(), description: description.trim(), items });
      setName("");
      setDescription("");
      setItemsText("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Checklist Templates</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-primary hover:underline"
        >
          {showForm ? "Cancel" : "+ New Template"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name..."
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
            required
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Items (one per line)
            </label>
            <textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
              rows={4}
              placeholder="Call client&#10;Prepare documents&#10;Send proposal&#10;Schedule viewing"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Template"}
          </button>
        </form>
      )}

      {/* Template list */}
      {templates.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-3">
          No templates yet. Create one to quickly add checklists to tasks.
        </p>
      )}
      <div className="space-y-1 max-h-[250px] overflow-y-auto">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {t.items.length} items{t.description ? ` — ${t.description}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onLoad(t)}
                className="rounded bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/20"
              >
                Use
              </button>
              <button
                onClick={() => onDelete(t.id)}
                className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
