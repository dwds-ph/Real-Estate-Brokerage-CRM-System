import { memo } from "react";
import { type AgentScore } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

interface AgentLeaderboardProps {
  scores: AgentScore[];
  periodLabel: string;
}

const AgentLeaderboardItem = memo(function AgentLeaderboardItem({
  agent,
  index,
}: {
  agent: AgentScore;
  index: number;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors",
        index === 0 && "ring-2 ring-yellow-400 dark:ring-yellow-600",
        index === 1 && "ring-1 ring-gray-300 dark:ring-gray-600",
        index === 2 && "ring-1 ring-amber-600/40",
      )}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="shrink-0 w-8 text-center">
          {index === 0 ? (
            <span className="text-2xl">🥇</span>
          ) : index === 1 ? (
            <span className="text-2xl">🥈</span>
          ) : index === 2 ? (
            <span className="text-2xl">🥉</span>
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              #{index + 1}
            </span>
          )}
        </div>

        {/* Avatar + Name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {agent.photoURL ? (
              <img
                src={agent.photoURL}
                alt={`${agent.displayName}'s avatar`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              agent.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{agent.displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {agent.role}
            </p>
          </div>
        </div>

        {/* Score */}
        <div className="shrink-0 text-center">
          <div
            className={cn(
              "text-lg font-bold",
              agent.score >= 80
                ? "text-green-600"
                : agent.score >= 50
                  ? "text-yellow-600"
                  : "text-muted-foreground",
            )}
          >
            {agent.score}
          </div>
          <div className="text-[10px] text-muted-foreground">SCORE</div>
        </div>

        {/* Trend */}
        <div className="shrink-0 text-center hidden sm:block">
          <span
            className={cn(
              "text-lg",
              agent.dealsTrend === "up" && "text-green-500",
              agent.dealsTrend === "down" && "text-red-500",
              agent.dealsTrend === "stable" && "text-muted-foreground",
            )}
          >
            {agent.dealsTrend === "up"
              ? "▲"
              : agent.dealsTrend === "down"
                ? "▼"
                : "―"}
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Deals Closed</p>
          <p className="font-semibold">{agent.dealsClosed}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Commission</p>
          <p className="font-semibold">
            {formatCurrency(agent.totalCommission)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Conversion</p>
          <p className="font-semibold">{agent.leadConversionRate}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg Deal</p>
          <p className="font-semibold">
            {formatCurrency(agent.averageDealSize)}
          </p>
        </div>
      </div>

      {/* Badges */}
      {agent.badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.badges.map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px]"
              title={badge.description}
            >
              {badge.icon} {badge.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export function AgentLeaderboard({
  scores,
  periodLabel,
}: AgentLeaderboardProps) {
  return (
    <div className="space-y-3">
      {scores.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No agent data available for {periodLabel.toLowerCase()}.
        </div>
      )}

      {scores.map((agent, index) => (
        <AgentLeaderboardItem key={agent.agentId} agent={agent} index={index} />
      ))}
    </div>
  );
}
