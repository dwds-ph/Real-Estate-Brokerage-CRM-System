import { type AgentScore } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { BadgeDisplay } from "./AchievementBadges";

interface AgentProfileScoreProps {
  score: AgentScore;
  rank: number;
  totalAgents: number;
}

export function AgentProfileScore({
  score,
  rank,
  totalAgents,
}: AgentProfileScoreProps) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {score.photoURL ? (
              <img
                src={score.photoURL}
                alt={`${score.displayName}'s avatar`}
                loading="lazy"
                className="h-12 w-12 rounded-full object-cover object-center"
              />
            ) : (
              score.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-semibold">{score.displayName}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {score.role} · #{rank} of {totalAgents}
            </p>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{score.score}</div>
          <div className="text-[10px] text-muted-foreground">Overall Score</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score.score >= 80
              ? "bg-green-500"
              : score.score >= 50
                ? "bg-yellow-500"
                : "bg-muted-foreground",
          )}
          style={{ width: `${score.score}%` }}
        />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Deals Closed"
          value={String(score.dealsClosed)}
          trend={score.dealsTrend}
          subtitle={score.dealsClosed === 1 ? "deal" : "deals"}
        />
        <MetricCard
          label="Commission Earned"
          value={formatCurrency(score.totalCommission)}
          trend={score.commissionTrend}
          subtitle="this period"
        />
        <MetricCard
          label="Lead Conversion"
          value={`${score.leadConversionRate}%`}
          subtitle={`${score.totalLeadsAssigned} leads assigned`}
        />
        <MetricCard
          label="Avg Deal Size"
          value={formatCurrency(score.averageDealSize)}
          subtitle={`${score.totalViewings} viewings`}
        />
      </div>

      {/* Viewing-to-deal ratio */}
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Viewing-to-Deal Ratio</span>
          <span className="font-semibold">{score.viewingToDealRatio}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {score.viewingToDealRatio >= 1
            ? "Great — every viewing leads to a deal"
            : "Keep following up to convert more viewings into deals"}
        </p>
      </div>

      {/* Badges */}
      {score.badges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Achievements</h4>
          <div className="flex flex-wrap gap-2">
            {score.badges.map((badge) => (
              <BadgeDisplay key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
  subtitle,
}: {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {trend && (
          <span
            className={cn(
              "text-xs",
              trend === "up" && "text-green-500",
              trend === "down" && "text-red-500",
            )}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
      <p className="text-lg font-bold mt-1">{value}</p>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
