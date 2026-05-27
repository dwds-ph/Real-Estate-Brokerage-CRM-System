import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { type Deal, type Lead, type Viewing, type AppUser } from "@/types";
import { computeScorecard } from "@/lib/scorecard";
import { AgentLeaderboard } from "@/components/scorecard/AgentLeaderboard";
import { AgentProfileScore } from "@/components/scorecard/AgentProfileScore";

type PeriodFilter = 7 | 30 | 90 | 365;

const PERIODS: { value: PeriodFilter; label: string }[] = [
  { value: 7, label: "This Week" },
  { value: 30, label: "This Month" },
  { value: 90, label: "This Quarter" },
  { value: 365, label: "All Time" },
];

export default function LeaderboardPage() {
  const { userProfile } = useAuth();
  const { data: allAgents } = useCollection<AppUser>("users");
  const { data: allDeals } = useCollection<Deal>("deals");
  const { data: allLeads } = useCollection<Lead>("leads");
  const { data: allViewings } = useCollection<Viewing>("viewings");
  const [period, setPeriod] = useState<PeriodFilter>(30);

  // Filter by broker org
  const myAgents = useMemo(
    () =>
      allAgents.filter(
        (a) =>
          a.brokerId === userProfile?.brokerId ||
          a.brokerId === userProfile?.id,
      ),
    [allAgents, userProfile],
  );

  const scores = useMemo(
    () =>
      computeScorecard({
        agents: myAgents,
        deals: allDeals,
        leads: allLeads,
        viewings: allViewings,
      }),
    [myAgents, allDeals, allLeads, allViewings],
  );

  const myScore = scores.find((s) => s.agentId === userProfile?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">🏆 Agent Leaderboard</h1>
          <p className="text-muted-foreground">
            {myAgents.length} agents · ranked by performance
          </p>
        </div>
        {/* Period filter pills */}
        <div className="flex gap-1 rounded-lg border bg-card p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* My personal scorecard */}
      {myScore && (
        <AgentProfileScore
          score={myScore}
          rank={scores.findIndex((s) => s.agentId === myScore.agentId) + 1}
          totalAgents={scores.length}
        />
      )}

      {/* Leaderboard */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
        <AgentLeaderboard
          scores={scores}
          periodLabel={
            PERIODS.find((p) => p.value === period)?.label || "This Month"
          }
        />
      </div>
    </div>
  );
}
