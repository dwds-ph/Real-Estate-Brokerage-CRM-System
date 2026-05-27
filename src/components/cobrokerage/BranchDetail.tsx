import { formatCurrency } from "@/lib/utils";
import { type Branch } from "@/types";

interface Props {
  branch: Branch;
  agents: any[];
  deals: any[];
  onBack: () => void;
}

export default function BranchDetail({ branch, agents, deals, onBack }: Props) {
  const branchAgents = agents.filter((a: any) => a.officeId === branch.id || a.officeName === branch.name);
  const branchDeals = deals.filter((d: any) => branchAgents.some((a: any) => a.id === d.agentId || a.id === d.createdBy));
  const totalCommission = branchDeals.reduce((s: number, d: any) => s + (d.commission || 0), 0);

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-xs text-primary hover:underline">← Back to Branches</button>
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{branch.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{branch.type.replace("-", " ")}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${branch.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{branch.isActive ? "Active" : "Inactive"}</span>
        </div>
        <p className="text-xs text-muted-foreground">{branch.address}, {branch.city}, {branch.province}</p>
        {branch.phone && <p className="text-xs">📞 {branch.phone}</p>}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold">{branchAgents.length}</p>
            <p className="text-[10px] text-muted-foreground">Agents</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold">{branchDeals.length}</p>
            <p className="text-[10px] text-muted-foreground">Deals</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold text-primary">{formatCurrency(totalCommission)}</p>
            <p className="text-[10px] text-muted-foreground">Commission</p>
          </div>
        </div>
      </div>
    </div>
  );
}
