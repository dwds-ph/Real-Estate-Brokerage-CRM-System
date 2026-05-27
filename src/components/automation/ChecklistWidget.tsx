import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { ChecklistInstance, ChecklistTemplate } from "@/types";
import {
  fetchChecklistTemplates,
  fetchChecklistInstances,
  createChecklistInstance,
  updateChecklistInstance,
} from "@/services/checklistService";

export interface ChecklistWidgetProps {
  scopeType: "lead" | "listing" | "deal";
  scopeId: string;
  compact?: boolean;
}

export default function ChecklistWidget({
  scopeType,
  scopeId,
  compact,
}: ChecklistWidgetProps) {
  const { userProfile } = useAuth();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [instances, setInstances] = useState<ChecklistInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tpls, insts] = await Promise.all([
        fetchChecklistTemplates(),
        fetchChecklistInstances(scopeType, scopeId),
      ]);
      setTemplates(tpls.filter((t) => t.scope === scopeType));
      setInstances(insts);
    } catch (err) {
      setError("Failed to load checklists");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [scopeType, scopeId]);

  useEffect(() => {
    setTimeout(() => loadData(), 0);
  }, [loadData]);

  const handleAddChecklist = async () => {
    if (!selectedTemplateId || !userProfile) return;
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    setCreating(true);
    try {
      await createChecklistInstance({
        templateId: template.id,
        templateName: template.name,
        scopeType,
        scopeId,
        items: template.items.map((item) => ({ ...item, done: false })),
        progress: 0,
      });
      setSelectedTemplateId(null);
      setShowPicker(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleItem = async (instanceId: string, itemIndex: number) => {
    const instance = instances.find((i) => i.id === instanceId);
    if (!instance) return;

    const newItems = instance.items.map((item, idx) =>
      idx === itemIndex ? { ...item, done: !item.done } : item,
    );
    const doneCount = newItems.filter((i) => i.done).length;
    const progress =
      newItems.length > 0 ? Math.round((doneCount / newItems.length) * 100) : 0;

    try {
      await updateChecklistInstance(instanceId, { items: newItems, progress });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : instances.length === 0 ? (
          <p className="text-xs text-muted-foreground">No checklists</p>
        ) : (
          instances.map((inst) => (
            <div key={inst.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">
                  {inst.templateName}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {inst.progress}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${inst.progress}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Checklist</h2>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs text-primary hover:underline"
        >
          {showPicker ? "Cancel" : "+ Add Checklist"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {/* Template Picker */}
      {showPicker && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 space-y-2">
          <select
            value={selectedTemplateId || ""}
            onChange={(e) => setSelectedTemplateId(e.target.value || null)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.items.length} items)
              </option>
            ))}
          </select>
          <button
            onClick={handleAddChecklist}
            disabled={!selectedTemplateId || creating}
            className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
          >
            {creating ? "Adding..." : "Add Checklist"}
          </button>
        </div>
      )}

      {/* Checklist Instances */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No checklists attached yet. Add one to track progress.
        </div>
      ) : (
        <div className="space-y-4">
          {instances.map((inst) => {
            const doneCount = inst.items.filter((i) => i.done).length;
            return (
              <div key={inst.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{inst.templateName}</h3>
                  <span className="text-xs text-muted-foreground">
                    {inst.progress}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${inst.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {doneCount}/{inst.items.length} done
                </p>
                <div className="space-y-1.5">
                  {inst.items.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleItem(inst.id, idx)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span
                        className={`text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.label}
                        {item.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
