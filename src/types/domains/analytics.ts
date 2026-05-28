export interface AgentScore {
  agentId: string;
  displayName: string;
  role: string;
  photoURL?: string;
  dealsClosed: number;
  totalCommission: number;
  leadConversionRate: number;
  averageDealSize: number;
  viewingToDealRatio: number;
  totalViewings: number;
  totalLeadsAssigned: number;
  dealsTrend: "up" | "down" | "stable";
  commissionTrend: "up" | "down" | "stable";
  score: number;
  badges: AchievementBadge[];
}

export type AchievementBadgeId =
  | "first-deal"
  | "million-club"
  | "perfect-month"
  | "high-converter"
  | "top-viewer"
  | "veteran"
  | "riser"
  | "team-player";

export interface AchievementBadge {
  id: AchievementBadgeId;
  name: string;
  description: string;
  icon: string;
  earnedAt?: number;
}

export type GoalPeriod = "monthly" | "quarterly" | "yearly";

export interface AgentGoal {
  id: string;
  agentId: string;
  agentName?: string;
  period: GoalPeriod;
  periodStart: number;
  periodEnd: number;
  targetDeals: number;
  targetCommission: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SourceAnalytics {
  source: string;
  leadCount: number;
  dealCount: number;
  conversionRate: number;
  totalCommission: number;
  avgDealValue: number;
  avgDaysToDeal: number;
}
