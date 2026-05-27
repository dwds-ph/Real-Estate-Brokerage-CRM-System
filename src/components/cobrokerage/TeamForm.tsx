import { useState } from "react";
import type { AgentTeam } from "@/types";

interface Props {
  agents: { id: string; displayName: string }[];
  initial?: AgentTeam;
  onSubmit: (data: { name: string; description?: string; teamLeadId: string; memberIds: string[] }) => void;
  onCancel: () => void;
}

export default function TeamForm({ agents, initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [teamLeadId, setTeamLeadId] = useState(initial?.teamLeadId || "");
  const [memberIds, setMemberIds] = useState<string[]>(initial?.memberIds || []);

  const toggleMember = (id: string) => {
    setMemberIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description: description || undefined, teamLeadId, memberIds });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1">Team Name *</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" required />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" rows={2} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Team Lead *</label>
        <select value={teamLeadId} onChange={(e) => setTeamLeadId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" required>
          <option value="">Select team lead...</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Members</label>
        <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border p-2">
          {agents.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={memberIds.includes(a.id)} onChange={() => toggleMember(a.id)} className="h-3.5 w-3.5 rounded" />
              {a.displayName}
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">{initial ? "Update" : "Create"} Team</button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-1.5 text-sm font-medium">Cancel</button>
      </div>
    </form>
  );
}
