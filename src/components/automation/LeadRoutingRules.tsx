import { useState, useEffect, useCallback } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { AppUser } from '@/types';
import { getRoutingConfig, saveRoutingConfig, RoutingConfig, LeadRoutingRule } from '@/services/leadRoutingService';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LeadRoutingRules({ open, onClose }: Props) {
  const { data: agents } = useCollection<AppUser>('users');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<RoutingConfig>({
    enabled: false,
    rules: [],
  });

  const agentList = agents.filter((a) => a.role === 'agent' || a.role === 'sub-agent');

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const existing = await getRoutingConfig();
      if (existing) {
        setConfig(existing);
      }
    } catch (err) {
      setError('Failed to load routing config');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => loadConfig(), 0);
  }, [open, loadConfig]);

  const addRule = (type: LeadRoutingRule['type']) => {
    const newRule: LeadRoutingRule = { type };
    if (type === 'round-robin') {
      newRule.agentIds = [];
      newRule.currentIndex = 0;
    } else if (type === 'specialty') {
      newRule.specialtyMap = {};
    } else if (type === 'location') {
      newRule.locationMap = {};
    }
    setConfig((prev) => ({ ...prev, rules: [...prev.rules, newRule] }));
  };

  const removeRule = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const updateRule = (index: number, updates: Partial<LeadRoutingRule>) => {
    setConfig((prev) => {
      const rules = [...prev.rules];
      rules[index] = { ...rules[index], ...updates };
      return { ...prev, rules };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveRoutingConfig(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save routing config');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-xl rounded-lg border bg-card p-6 shadow-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Lead Routing Rules</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        {success && <p className="text-sm text-green-600 dark:text-green-400 mb-3">✅ Saved successfully!</p>}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enable toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Enable automatic lead assignment</span>
            </label>

            {/* Rules */}
            <div className="space-y-3">
              {config.rules.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No rules configured. Add one below.</p>
              )}
              {config.rules.map((rule, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                        {rule.type === 'round-robin' ? '🔄 Round Robin' : rule.type === 'specialty' ? '🎯 Specialty' : '📍 Location'}
                      </span>
                      <span className="text-xs text-muted-foreground">Rule {i + 1}</span>
                    </div>
                    <button onClick={() => removeRule(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>

                  {rule.type === 'round-robin' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium">Agent Rotation Order</label>
                      <select
                        multiple
                        value={rule.agentIds || []}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                          updateRule(i, { agentIds: selected });
                        }}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[100px]"
                      >
                        {agentList.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.displayName} ({agent.role})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-muted-foreground">Hold Ctrl/Cmd to select multiple. New leads cycle through in order.</p>
                    </div>
                  )}

                  {rule.type === 'specialty' && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Leads with matching property interest are auto-assigned.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Property interest (e.g. condo)"
                          className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm"
                          id={`specialty-key-${i}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              const key = input.value.trim();
                              if (!key || !rule.specialtyMap) return;
                              const agentId = (document.getElementById(`specialty-agent-${i}`) as HTMLSelectElement)?.value;
                              if (agentId) {
                                updateRule(i, { specialtyMap: { ...rule.specialtyMap, [key]: agentId } });
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <select
                          id={`specialty-agent-${i}`}
                          className="rounded-lg border bg-background px-3 py-1.5 text-sm"
                        >
                          <option value="">Agent...</option>
                          {agentList.map((agent) => (
                            <option key={agent.id} value={agent.id}>{agent.displayName}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const input = document.getElementById(`specialty-key-${i}`) as HTMLInputElement;
                            const key = input.value.trim();
                            if (!key || !rule.specialtyMap) return;
                            const sel = document.getElementById(`specialty-agent-${i}`) as HTMLSelectElement;
                            if (sel.value) {
                              updateRule(i, { specialtyMap: { ...rule.specialtyMap, [key]: sel.value } });
                              input.value = '';
                            }
                          }}
                          className="rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground"
                        >
                          Add
                        </button>
                      </div>
                      {rule.specialtyMap && Object.entries(rule.specialtyMap).length > 0 && (
                        <div className="space-y-1">
                          {Object.entries(rule.specialtyMap).map(([interest, agentId]) => {
                            const agent = agentList.find((a) => a.id === agentId);
                            return (
                              <div key={interest} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs">
                                <span>🏠 <strong>{interest}</strong> → {agent?.displayName || 'Unknown'}</span>
                                <button
                                  onClick={() => {
                                    if (!rule.specialtyMap) return;
                                    const { [interest]: _, ...rest } = rule.specialtyMap;
                                    updateRule(i, { specialtyMap: rest });
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {rule.type === 'location' && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Leads with matching location are auto-assigned.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Location (e.g. BGC)"
                          className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm"
                          id={`loc-key-${i}`}
                        />
                        <select
                          id={`loc-agent-${i}`}
                          className="rounded-lg border bg-background px-3 py-1.5 text-sm"
                        >
                          <option value="">Agent...</option>
                          {agentList.map((agent) => (
                            <option key={agent.id} value={agent.id}>{agent.displayName}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const input = document.getElementById(`loc-key-${i}`) as HTMLInputElement;
                            const key = input.value.trim();
                            if (!key || !rule.locationMap) return;
                            const sel = document.getElementById(`loc-agent-${i}`) as HTMLSelectElement;
                            if (sel.value) {
                              updateRule(i, { locationMap: { ...rule.locationMap, [key]: sel.value } });
                              input.value = '';
                            }
                          }}
                          className="rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground"
                        >
                          Add
                        </button>
                      </div>
                      {rule.locationMap && Object.entries(rule.locationMap).length > 0 && (
                        <div className="space-y-1">
                          {Object.entries(rule.locationMap).map(([location, agentId]) => {
                            const agent = agentList.find((a) => a.id === agentId);
                            return (
                              <div key={location} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs">
                                <span>📍 <strong>{location}</strong> → {agent?.displayName || 'Unknown'}</span>
                                <button
                                  onClick={() => {
                                    if (!rule.locationMap) return;
                                    const { [location]: _, ...rest } = rule.locationMap;
                                    updateRule(i, { locationMap: rest });
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Rule Button */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => addRule('round-robin')}
                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                + Round Robin
              </button>
              <button
                onClick={() => addRule('specialty')}
                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                + By Specialty
              </button>
              <button
                onClick={() => addRule('location')}
                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                + By Location
              </button>
            </div>

            {/* Save Button */}
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Rules'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
