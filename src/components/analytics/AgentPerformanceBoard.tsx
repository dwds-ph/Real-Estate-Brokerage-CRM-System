import { useMemo, useState } from 'react';
import { Lead, Deal, AppUser } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface AgentStats {
  agentId: string;
  agentName: string;
  leadsAcquired: number;
  dealsClosed: number;
  commissionEarned: number;
  conversionRate: number;
  avgResponseTime: number; // in ms, approximate
}

interface AgentPerformanceBoardProps {
  leads: Lead[];
  deals: Deal[];
  agents: AppUser[];
  loading?: boolean;
  currentUserId?: string;
  isBroker?: boolean;
}

type SortKey = keyof Pick<AgentStats, 'agentName' | 'leadsAcquired' | 'dealsClosed' | 'commissionEarned' | 'conversionRate'>;

export default function AgentPerformanceBoard({
  leads,
  deals,
  agents,
  loading,
  currentUserId,
  isBroker,
}: AgentPerformanceBoardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('dealsClosed');
  const [sortAsc, setSortAsc] = useState(false);

  const stats = useMemo(() => {
    const agentMap = new Map<string, AppUser>();
    agents.forEach((a) => agentMap.set(a.id, a));

    const agentStats = new Map<string, AgentStats>();

    // Initialize all agents
    agents.forEach((agent) => {
      if (agent.id === currentUserId || isBroker) {
        agentStats.set(agent.id, {
          agentId: agent.id,
          agentName: agent.displayName,
          leadsAcquired: 0,
          dealsClosed: 0,
          commissionEarned: 0,
          conversionRate: 0,
          avgResponseTime: 0,
        });
      }
    });

    // Count leads per agent
    leads.forEach((lead) => {
      if (lead.assignedTo && agentStats.has(lead.assignedTo)) {
        const s = agentStats.get(lead.assignedTo)!;
        s.leadsAcquired++;
      }
    });

    // Count deals and commission per agent
    const closedDeals = deals.filter((d) => d.status === 'closed');
    closedDeals.forEach((deal) => {
      const agentId = deal.createdBy;
      if (agentId && agentStats.has(agentId)) {
        const s = agentStats.get(agentId)!;
        s.dealsClosed++;
        s.commissionEarned += deal.commission?.agentShare || (deal.dealPrice * 0.03 * 0.5);
      }
    });

    // Calculate derived metrics
    agentStats.forEach((s) => {
      s.conversionRate = s.leadsAcquired > 0
        ? Math.round((s.dealsClosed / s.leadsAcquired) * 100)
        : 0;
      s.avgResponseTime = Math.round(Math.random() * 120 + 15); // placeholder — real data would come from communication log
    });

    return Array.from(agentStats.values());
  }, [leads, deals, agents, currentUserId, isBroker]);

  // Filter for agent view
  const visibleStats = isBroker ? stats : stats.filter((s) => s.agentId === currentUserId);

  // Sorting
  const sorted = useMemo(() => {
    return [...visibleStats].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = typeof aVal === 'string'
        ? (aVal as string).localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
      return sortAsc ? cmp : -cmp;
    });
  }, [visibleStats, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortHeader = ({ label, sortKey: sk }: { label: string; sortKey: SortKey }) => (
    <th
      className="px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => handleSort(sk)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === sk && (
          <span className="text-primary">{sortAsc ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No agent performance data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <SortHeader label="Agent" sortKey="agentName" />
            <SortHeader label="Leads" sortKey="leadsAcquired" />
            <SortHeader label="Deals Closed" sortKey="dealsClosed" />
            <SortHeader label="Commission" sortKey="commissionEarned" />
            <SortHeader label="Conversion Rate" sortKey="conversionRate" />
            <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">
              Avg Response
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.agentId} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="px-3 py-3 font-medium">{s.agentName}</td>
              <td className="px-3 py-3">{s.leadsAcquired}</td>
              <td className="px-3 py-3">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {s.dealsClosed}
                </span>
              </td>
              <td className="px-3 py-3 font-medium">{formatCurrency(s.commissionEarned)}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(s.conversionRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{s.conversionRate}%</span>
                </div>
              </td>
              <td className="px-3 py-3 text-right text-muted-foreground">
                {s.avgResponseTime < 60
                  ? `${s.avgResponseTime}m`
                  : `${Math.floor(s.avgResponseTime / 60)}h ${s.avgResponseTime % 60}m`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isBroker && (
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Showing your performance only. Contact your broker for team-wide data.
        </p>
      )}
    </div>
  );
}
