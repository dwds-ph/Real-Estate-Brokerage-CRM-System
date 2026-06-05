import { type AgentTeam } from "@/types";

interface AgentData {
  id: string;
  displayName?: string;
}

interface Props {
  teams: AgentTeam[];
  agents: AgentData[];
  onEdit: (t: AgentTeam) => void;
  onDelete: (id: string) => void;
  onViewDetail: (t: AgentTeam) => void;
}

export default function TeamList({
  teams,
  agents,
  onEdit,
  onDelete,
  onViewDetail,
}: Props) {
  if (teams.length === 0)
    {return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        No teams yet
      </div>
    );}

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {teams.map((t) => {
        const members = (t.memberIds || [])
          .map((id) => agents.find((a: AgentData) => a.id === id))
          .filter(Boolean) as AgentData[];
        return (
          <div
            key={t.id}
            className="rounded-lg border bg-card p-4 space-y-2 cursor-pointer hover:shadow-sm"
            onClick={() => onViewDetail(t)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onViewDetail(t);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  Lead: {t.teamLeadName || t.teamLeadId}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                {members.length} members
              </span>
            </div>
            {t.description && (
              <p className="text-xs text-muted-foreground">{t.description}</p>
            )}
            {members.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {members.map((m: AgentData) => (
                  <span
                    key={m.id}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                  >
                    {m.displayName}
                  </span>
                ))}
              </div>
            )}
            <div
              className="flex gap-2 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onEdit(t)}
                className="flex-1 rounded border px-2 py-1 text-[10px] font-medium hover:bg-muted"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(t.id)}
                className="rounded border border-red-200 px-2 py-1 text-[10px] text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
