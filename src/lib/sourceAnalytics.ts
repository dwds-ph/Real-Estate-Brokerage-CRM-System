import type { SourceAnalytics, AgentGoal } from "@/types";

interface SourceLeadData {
  source?: string;
  createdAt?: number;
}

export interface SourceDealData {
  source?: string;
  commission?: number;
  dealValue?: number;
  createdAt?: number;
  status?: string;
}

export function computeSourceAnalytics(
  leads: SourceLeadData[],
  deals: SourceDealData[],
): SourceAnalytics[] {
  const sourceMap = new Map<
    string,
    {
      leads: number;
      deals: number;
      commission: number;
      dealValues: number[];
      leadTimestamps: number[];
      dealTimestamps: number[];
    }
  >();

  for (const lead of leads) {
    const src = lead.source || "unknown";
    if (!sourceMap.has(src))
      sourceMap.set(src, {
        leads: 0,
        deals: 0,
        commission: 0,
        dealValues: [],
        leadTimestamps: [],
        dealTimestamps: [],
      });
    sourceMap.get(src)!.leads++;
    sourceMap.get(src)!.leadTimestamps.push(lead.createdAt!);
  }

  for (const deal of deals) {
    const src = deal.source || "unknown";
    if (sourceMap.has(src)) {
      const entry = sourceMap.get(src)!;
      entry.deals++;
      entry.commission += deal.commission || 0;
      entry.dealValues.push(deal.dealValue || 0);
      entry.dealTimestamps.push(deal.createdAt!);
    }
  }

  return Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      leadCount: data.leads,
      dealCount: data.deals,
      conversionRate: data.leads > 0 ? data.deals / data.leads : 0,
      totalCommission: data.commission,
      avgDealValue:
        data.dealValues.length > 0
          ? data.dealValues.reduce((a, b) => a + b, 0) / data.dealValues.length
          : 0,
      avgDaysToDeal: computeAvgDays(data.leadTimestamps, data.dealTimestamps),
    }))
    .sort((a, b) => b.leadCount - a.leadCount);
}

function computeAvgDays(leadTimes: number[], dealTimes: number[]): number {
  if (leadTimes.length === 0 || dealTimes.length === 0) return 0;
  let total = 0;
  let count = 0;
  for (const dt of dealTimes) {
    const closest = leadTimes.reduce((best, lt) => {
      const diff = Math.abs(dt - lt);
      return diff < Math.abs(dt - best) ? lt : best;
    }, leadTimes[0]);
    if (closest && dt > closest) {
      total += (dt - closest) / 86400000;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

export function computeGoalProgress(
  goals: AgentGoal[],
  deals: SourceDealData[],
) {
  return goals.map((goal) => {
    const periodDeals = deals.filter((d) => {
      const created = d.createdAt || 0;
      return created >= goal.periodStart && created <= goal.periodEnd;
    });
    const dealsClosed = periodDeals.filter(
      (d) => d.status === "closed" || d.status === "sold",
    ).length;
    const commission = periodDeals.reduce(
      (sum, d) => sum + (d.commission || 0),
      0,
    );
    return {
      goal,
      dealsClosed,
      commission,
      dealProgress: goal.targetDeals > 0 ? dealsClosed / goal.targetDeals : 0,
      commissionProgress:
        goal.targetCommission > 0 ? commission / goal.targetCommission : 0,
    };
  });
}
