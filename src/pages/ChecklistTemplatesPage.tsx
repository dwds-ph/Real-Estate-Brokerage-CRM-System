import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { ChecklistTemplate } from "@/types";
import {
  fetchChecklistTemplates,
  createChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
} from "@/services/checklistService";

export default function ChecklistTemplatesPage() {
  const { userProfile } = useAuth();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    scope: "lead" | "listing" | "deal";
    items: { label: string; required: boolean }[];
  }>({ name: "", scope: "deal", items: [{ label: "", required: false }] });
  const [saving, setSaving] = useState(false);

  const isBroker = userProfile?.role === "broker";

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChecklistTemplates();
      setTemplates(data);
    } catch (err) {
      setError("Failed to load templates");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => loadTemplates(), 0);
  }, [loadTemplates]);

  const resetForm = () => {
    setForm({
      name: "",
      scope: "deal",
      items: [{ label: "", required: false }],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { label: "", required: false }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (
    index: number,
    field: "label" | "required",
    value: string | boolean,
  ) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value as never };
      return { ...prev, items };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !userProfile ||
      !form.name.trim() ||
      form.items.some((item) => !item.label.trim())
    )
      {return;}
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        scope: form.scope,
        items: form.items
          .filter((item) => item.label.trim())
          .map((item) => ({
            label: item.label.trim(),
            required: item.required,
          })),
        createdBy: userProfile.id,
      };

      if (editingId) {
        await updateChecklistTemplate(editingId, data);
      } else {
        await createChecklistTemplate(data);
      }
      resetForm();
      await loadTemplates();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      // eslint-disable-next-line no-alert
      !confirm(
        "Delete this checklist template? It will not affect existing instances.",
      )
    )
      {return;}
    try {
      await deleteChecklistTemplate(id);
      await loadTemplates();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const editTemplate = (tpl: ChecklistTemplate) => {
    setForm({
      name: tpl.name,
      scope: tpl.scope,
      items:
        tpl.items.length > 0 ? tpl.items : [{ label: "", required: false }],
    });
    setEditingId(tpl.id);
    setShowForm(true);
  };

  if (!isBroker) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">🔒</p>
          <p>Only brokers can manage checklist templates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checklist Templates</h1>
          <p className="text-muted-foreground">{templates.length} templates</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? "Cancel" : "+ New Template"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-card p-6 space-y-4"
        >
          <h3 className="font-semibold">
            {editingId ? "Edit Template" : "New Template"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Deal Closing Checklist"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scope</label>
              <select
                value={form.scope}
                onChange={(e) =>
                  setForm({
                    ...form,
                    scope: e.target.value as "lead" | "listing" | "deal",
                  })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="lead">Lead</option>
                <option value="listing">Listing</option>
                <option value="deal">Deal</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-primary hover:underline"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={item.label}
                    onChange={(e) =>
                      handleItemChange(i, "label", e.target.value)
                    }
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                    placeholder={`Item ${i + 1}`}
                  />
                  <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={item.required}
                      onChange={(e) =>
                        handleItemChange(i, "required", e.target.checked)
                      }
                      className="h-3 w-3 rounded border-gray-300"
                    />
                    Required
                  </label>
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(i)}
                      className="text-xs text-red-500 hover:text-red-700 shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Template List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No checklist templates yet. Create your first one!
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{tpl.name}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">
                      {tpl.scope}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tpl.items.length} items · Created by{" "}
                    {tpl.createdBy?.slice(0, 8)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => editTemplate(tpl)}
                    className="rounded p-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="rounded p-1 text-xs text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {tpl.items.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {tpl.items.map((item, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {item.label}
                      {item.required ? " *" : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
