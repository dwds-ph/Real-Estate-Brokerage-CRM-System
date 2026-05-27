import { formatCurrency } from "@/lib/utils";
import type { AgentTeam } from "@/types";

interface TeamMemberData {
  id?: string;
  userId?: string;
  displayName?: string;
  role?: string;
}

interface TeamDeal {
  agentId?: string;
  createdBy?: string;
  commission?: number;
  status?: string;
}

interface Props {
  team: AgentTeam;
  members: TeamMemberData[];
  deals: TeamDeal[];
  onBack: () => void;
}

export default function TeamDetail({ team, members, deals, onBack }: Props) {
  const teamDeals = deals.filter((d: TeamDeal) =>
    team.memberIds.includes(d.agentId || d.createdBy || ""),
  );
  const totalCommission = teamDeals.reduce(
    (s: number, d: TeamDeal) => s + (d.commission || 0),
    0,
  );
  const closedDeals = teamDeals.filter(
    (d: TeamDeal) => d.status === "closed" || d.status === "sold",
  );

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-xs text-primary hover:underline">
        ← Back to Teams
      </button>
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div>
          <h3 className="font-semibold">{team.name}</h3>
          <p className="text-xs text-muted-foreground">
            Team Lead: {team.teamLeadName || team.teamLeadId}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold">{members.length}</p>
            <p className="text-[10px] text-muted-foreground">Members</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold">{closedDeals.length}</p>
            <p className="text-[10px] text-muted-foreground">Closed Deals</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold text-primary">
              {formatCurrency(totalCommission)}
            </p>
            <p className="text-[10px] text-muted-foreground">Commission</p>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-medium mb-2">Members</h4>
          <div className="space-y-1">
            {members.map((m: TeamMemberData) => (
              <div
                key={m.id || m.userId}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5 text-sm"
              >
                <span>{m.displayName}</span>
                <span className="text-[10px] text-muted-foreground">
                  {m.role || "agent"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
