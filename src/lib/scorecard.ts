import {
  type Deal,
  type Lead,
  type Viewing,
  type AppUser,
  type AgentScore,
  type AchievementBadge,
  type AchievementBadgeId,
} from "@/types";

// ─── Scoring weights ────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  dealsClosed: 30,
  totalCommission: 25,
  leadConversionRate: 20,
  averageDealSize: 10,
  viewingToDealRatio: 10,
  totalViewings: 5,
} as const;

// ─── Badge definitions ──────────────────────────────────────────────

const BADGE_DEFS: Record<
  AchievementBadgeId,
  Omit<AchievementBadge, "earnedAt">
> = {
  "first-deal": {
    id: "first-deal",
    name: "First Deal",
    description: "Closed your first deal",
    icon: "🌟",
  },
  "million-club": {
    id: "million-club",
    name: "Million-Peso Club",
    description: "Closed deals worth ₱1M+ total",
    icon: "💎",
  },
  "perfect-month": {
    id: "perfect-month",
    name: "Perfect Month",
    description: "Closed 3+ deals in a single month",
    icon: "🏅",
  },
  "high-converter": {
    id: "high-converter",
    name: "High Converter",
    description: "Lead conversion rate above 50%",
    icon: "🎯",
  },
  "top-viewer": {
    id: "top-viewer",
    name: "Top Viewer",
    description: "Conducted 20+ property viewings",
    icon: "👁️",
  },
  veteran: {
    id: "veteran",
    name: "Veteran",
    description: "Closed 10+ deals total",
    icon: "🏆",
  },
  riser: {
    id: "riser",
    name: "Riser",
    description: "Highest month-over-month growth",
    icon: "📈",
  },
  "team-player": {
    id: "team-player",
    name: "Team Player",
    description: "Participated in a co-broking deal",
    icon: "🤝",
  },
};

// ─── Engine ──────────────────────────────────────────────────────────

interface ScoreInput {
  agents: AppUser[];
  deals: Deal[];
  leads: Lead[];
  viewings: Viewing[];
}

export function computeScorecard(input: ScoreInput): AgentScore[] {
  const { agents, deals, leads, viewings } = input;
  const now = Date.now();
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const prevMonthAgo = now - 60 * 24 * 60 * 60 * 1000;

  return agents
    .filter((a) => a.role !== "broker")
    .map((agent) => {
      // ── Agent's data ──
      const agentDeals = deals.filter((d) => d.createdBy === agent.id);
      const agentLeads = leads.filter((l) => l.assignedTo === agent.id);
      const agentViewings = viewings.filter((v) => v.agentId === agent.id);

      // ── Current period (last 30 days) ──
      const closedDeals = agentDeals.filter((d) => d.status === "closed");
      const closedThisMonth = closedDeals.filter(
        (d) => d.createdAt >= monthAgo,
      );
      const closedPrevMonth = closedDeals.filter(
        (d) => d.createdAt >= prevMonthAgo && d.createdAt < monthAgo,
      );

      const dealsClosed = closedThisMonth.length;

      const totalCommission = closedThisMonth.reduce(
        (sum, d) =>
          sum + (d.commission?.agentShare ?? d.commission?.total ?? 0),
        0,
      );
      const prevCommission = closedPrevMonth.reduce(
        (sum, d) =>
          sum + (d.commission?.agentShare ?? d.commission?.total ?? 0),
        0,
      );

      // Lead conversion
      const closedLeads = agentLeads.filter((l) => l.status === "closed");
      const leadConversionRate =
        agentLeads.length > 0
          ? Math.round((closedLeads.length / agentLeads.length) * 100)
          : 0;

      // Average deal size
      const avgDeal = closedDeals.reduce((sum, d) => sum + d.dealPrice, 0);
      const averageDealSize =
        closedDeals.length > 0 ? Math.round(avgDeal / closedDeals.length) : 0;

      // Viewings
      const doneViewings = agentViewings.filter((v) => v.status === "done");
      const totalViewings = doneViewings.length;
      const viewingToDealRatio =
        doneViewings.length > 0
          ? parseFloat((closedDeals.length / doneViewings.length).toFixed(2))
          : 0;

      // ── Trends ──
      const dealsTrend: "up" | "down" | "stable" =
        dealsClosed > closedPrevMonth.length
          ? "up"
          : dealsClosed < closedPrevMonth.length
            ? "down"
            : "stable";
      const commissionTrend: "up" | "down" | "stable" =
        totalCommission > prevCommission
          ? "up"
          : totalCommission < prevCommission
            ? "down"
            : "stable";

      // ── Score (0–100) ──
      const maxDeals = Math.max(
        ...input.agents
          .filter((a) => a.role !== "broker")
          .map(
            (a) =>
              deals.filter(
                (d) =>
                  d.createdBy === a.id &&
                  d.status === "closed" &&
                  d.createdAt >= monthAgo,
              ).length,
          ),
        1,
      );
      const maxCommission = Math.max(
        ...input.agents
          .filter((a) => a.role !== "broker")
          .map((a) =>
            deals
              .filter(
                (d) =>
                  d.createdBy === a.id &&
                  d.status === "closed" &&
                  d.createdAt >= monthAgo,
              )
              .reduce(
                (s, d) =>
                  s + (d.commission?.agentShare ?? d.commission?.total ?? 0),
                0,
              ),
          ),
        1,
      );

      const score = Math.round(
        (dealsClosed / maxDeals) * SCORE_WEIGHTS.dealsClosed +
          (totalCommission / maxCommission) * SCORE_WEIGHTS.totalCommission +
          (leadConversionRate / 100) * SCORE_WEIGHTS.leadConversionRate +
          (averageDealSize /
            Math.max(
              ...input.agents
                .filter((a) => a.role !== "broker")
                .map((a) => {
                  const d = deals.filter(
                    (de) => de.createdBy === a.id && de.status === "closed",
                  );
                  return d.length > 0
                    ? d.reduce((s, de) => s + de.dealPrice, 0) / d.length
                    : 0;
                }),
              1,
            )) *
            SCORE_WEIGHTS.averageDealSize +
          viewingToDealRatio * SCORE_WEIGHTS.viewingToDealRatio +
          Math.min(totalViewings / 20, 1) * SCORE_WEIGHTS.totalViewings,
      );

      // ── Badges ──
      const badges = computeBadges(
        closedDeals,
        leadConversionRate,
        totalViewings,
        agentDeals,
      );

      return {
        agentId: agent.id,
        displayName: agent.displayName,
        role: agent.role,
        photoURL: agent.photoURL,
        dealsClosed,
        totalCommission,
        leadConversionRate,
        averageDealSize,
        viewingToDealRatio,
        totalViewings: doneViewings.length,
        totalLeadsAssigned: agentLeads.length,
        dealsTrend,
        commissionTrend,
        score: Math.min(score, 100),
        badges,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── Badge computation ──────────────────────────────────────────────

function computeBadges(
  closedDeals: Deal[],
  conversionRate: number,
  viewingsCount: number,
  allAgentDeals: Deal[],
): AchievementBadge[] {
  const badges: AchievementBadge[] = [];

  if (closedDeals.length >= 1) {
    badges.push({ ...BADGE_DEFS["first-deal"], earnedAt: Date.now() });
  }

  const totalVolume = closedDeals.reduce((s, d) => s + d.dealPrice, 0);
  if (totalVolume >= 1_000_000) {
    badges.push({ ...BADGE_DEFS["million-club"], earnedAt: Date.now() });
  }

  if (closedDeals.length >= 3) {
    badges.push({ ...BADGE_DEFS["perfect-month"], earnedAt: Date.now() });
  }

  if (conversionRate >= 50) {
    badges.push({ ...BADGE_DEFS["high-converter"], earnedAt: Date.now() });
  }

  if (viewingsCount >= 20) {
    badges.push({ ...BADGE_DEFS["top-viewer"], earnedAt: Date.now() });
  }

  if (closedDeals.length >= 10) {
    badges.push({ ...BADGE_DEFS.veteran, earnedAt: Date.now() });
  }

  const hasCoBroking = allAgentDeals.some((d) => d.coBroking?.enabled);
  if (hasCoBroking) {
    badges.push({ ...BADGE_DEFS["team-player"], earnedAt: Date.now() });
  }

  return badges;
}

// ─── Period label helper ────────────────────────────────────────────

export function getPeriodLabel(days: number): string {
  if (days <= 7) return "This Week";
  if (days <= 30) return "This Month";
  if (days <= 90) return "This Quarter";
  return "All Time";
}
