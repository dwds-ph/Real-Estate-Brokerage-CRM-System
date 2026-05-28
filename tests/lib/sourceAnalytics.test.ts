import { describe, it, expect } from "vitest";
import {
  computeSourceAnalytics,
  computeGoalProgress,
} from "@/lib/sourceAnalytics";
import type { AgentGoal } from "@/types";
import type { SourceDealData } from "@/lib/sourceAnalytics";

// ─── computeSourceAnalytics ─────────────────────────────────────────────

describe("computeSourceAnalytics", () => {
  it("returns empty array when no leads", () => {
    const result = computeSourceAnalytics([], []);
    expect(result).toEqual([]);
  });

  it("groups leads by source and counts them", () => {
    const leads = [
      { source: "facebook", createdAt: 1000 },
      { source: "facebook", createdAt: 2000 },
      { source: "referral", createdAt: 3000 },
    ];
    const result = computeSourceAnalytics(leads, []);
    expect(result).toHaveLength(2);
    const fb = result.find((r) => r.source === "facebook");
    const ref = result.find((r) => r.source === "referral");
    expect(fb?.leadCount).toBe(2);
    expect(ref?.leadCount).toBe(1);
    expect(fb?.dealCount).toBe(0);
    expect(fb?.conversionRate).toBe(0);
  });

  it('uses "unknown" for leads without a source', () => {
    const leads = [{ createdAt: 1000 }, { source: undefined, createdAt: 2000 }];
    const result = computeSourceAnalytics(leads, []);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("unknown");
    expect(result[0].leadCount).toBe(2);
  });

  it("computes conversion rate as deals/leads", () => {
    const leads = [
      { source: "facebook", createdAt: 1000 },
      { source: "facebook", createdAt: 2000 },
      { source: "facebook", createdAt: 3000 },
      { source: "facebook", createdAt: 4000 },
    ];
    const deals: SourceDealData[] = [
      { source: "facebook", createdAt: 5000 },
      { source: "facebook", createdAt: 6000 },
    ];
    const result = computeSourceAnalytics(leads, deals);
    const fb = result.find((r) => r.source === "facebook");
    expect(fb?.conversionRate).toBe(0.5); // 2 deals / 4 leads
  });

  it("computes total commission per source", () => {
    const leads = [{ source: "facebook", createdAt: 1000 }];
    const deals: SourceDealData[] = [
      { source: "facebook", commission: 50000, createdAt: 2000 },
      { source: "facebook", commission: 30000, createdAt: 3000 },
    ];
    const result = computeSourceAnalytics(leads, deals);
    const fb = result.find((r) => r.source === "facebook");
    expect(fb?.totalCommission).toBe(80000);
  });

  it("computes average deal value per source", () => {
    const leads = [{ source: "facebook", createdAt: 1000 }];
    const deals: SourceDealData[] = [
      { source: "facebook", dealValue: 2000000, createdAt: 2000 },
      { source: "facebook", dealValue: 4000000, createdAt: 3000 },
    ];
    const result = computeSourceAnalytics(leads, deals);
    const fb = result.find((r) => r.source === "facebook");
    expect(fb?.avgDealValue).toBe(3000000);
  });

  it("returns 0 avgDealValue when no deals", () => {
    const leads = [{ source: "facebook", createdAt: 1000 }];
    const result = computeSourceAnalytics(leads, []);
    const fb = result.find((r) => r.source === "facebook");
    expect(fb?.avgDealValue).toBe(0);
  });

  it("computes average days to deal", () => {
    const leads = [{ source: "facebook", createdAt: 1000 }];
    // lead at 1000, deal at 86401000 (1 day later in ms)
    const deals: SourceDealData[] = [
      { source: "facebook", dealValue: 1000000, createdAt: 86401000 },
    ];
    const result = computeSourceAnalytics(leads, deals);
    const fb = result.find((r) => r.source === "facebook");
    expect(fb?.avgDaysToDeal).toBeCloseTo(1, 0);
  });

  it("returns 0 avgDaysToDeal when no deals", () => {
    const leads = [{ source: "facebook", createdAt: 1000 }];
    const result = computeSourceAnalytics(leads, []);
    const fb = result.find((r) => r.source === "facebook");
    expect(fb?.avgDaysToDeal).toBe(0);
  });

  it("returns 0 avgDaysToDeal when no leads have timestamps", () => {
    const leads = [
      { source: "facebook", createdAt: undefined as unknown as number },
    ];
    const deals: SourceDealData[] = [
      { source: "facebook", dealValue: 1000000, createdAt: 1000 },
    ];
    const result = computeSourceAnalytics(leads, deals);
    const fb = result.find((r) => r.source === "facebook");
    // leadTimes will have undefined values, computeAvgDays will get 0 from filter
    expect(fb?.avgDaysToDeal).toBe(0);
  });

  it("sorts results by leadCount descending", () => {
    const leads = [
      { source: "referral", createdAt: 1000 },
      { source: "facebook", createdAt: 2000 },
      { source: "facebook", createdAt: 3000 },
      { source: "facebook", createdAt: 4000 },
      { source: "website", createdAt: 5000 },
      { source: "website", createdAt: 6000 },
    ];
    const result = computeSourceAnalytics(leads, []);
    expect(result[0].source).toBe("facebook");
    expect(result[0].leadCount).toBe(3);
    expect(result[1].source).toBe("website");
    expect(result[1].leadCount).toBe(2);
    expect(result[2].source).toBe("referral");
    expect(result[2].leadCount).toBe(1);
  });

  it("only counts deals that match existing lead sources", () => {
    const leads = [{ source: "facebook", createdAt: 1000 }];
    const deals: SourceDealData[] = [
      { source: "facebook", dealValue: 100000, createdAt: 2000 },
      { source: "referral", dealValue: 200000, createdAt: 3000 }, // no matching lead -> ignored
    ];
    const result = computeSourceAnalytics(leads, deals);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("facebook");
  });

  it("counts multiple sources correctly", () => {
    const leads = [
      { source: "facebook", createdAt: 1000 },
      { source: "referral", createdAt: 2000 },
      { source: "website", createdAt: 3000 },
    ];
    const deals: SourceDealData[] = [
      { source: "facebook", createdAt: 4000 },
      { source: "referral", createdAt: 5000 },
    ];
    const result = computeSourceAnalytics(leads, deals);
    expect(result).toHaveLength(3);
    const fb = result.find((r) => r.source === "facebook");
    expect(fb?.dealCount).toBe(1);
    expect(fb?.conversionRate).toBe(1);
    const ref = result.find((r) => r.source === "referral");
    expect(ref?.dealCount).toBe(1);
    expect(ref?.conversionRate).toBe(1);
    const web = result.find((r) => r.source === "website");
    expect(web?.dealCount).toBe(0);
    expect(web?.conversionRate).toBe(0);
  });
});

// ─── computeGoalProgress ────────────────────────────────────────────────

describe("computeGoalProgress", () => {
  const baseGoal: AgentGoal = {
    id: "goal-1",
    agentId: "agent-1",
    period: "monthly",
    periodStart: 1000000,
    periodEnd: 2000000,
    targetDeals: 5,
    targetCommission: 500000,
    createdBy: "broker-1",
    createdAt: 500,
    updatedAt: 500,
  };

  it("returns mapped goal with zero progress when no deals match", () => {
    const result = computeGoalProgress([baseGoal], []);
    expect(result).toHaveLength(1);
    expect(result[0].goal).toEqual(baseGoal);
    expect(result[0].dealsClosed).toBe(0);
    expect(result[0].commission).toBe(0);
    expect(result[0].dealProgress).toBe(0);
    expect(result[0].commissionProgress).toBe(0);
  });

  it("counts only deals within the goal period", () => {
    const deals: SourceDealData[] = [
      { createdAt: 500000, status: "closed", commission: 100000 }, // before period
      { createdAt: 1500000, status: "closed", commission: 100000 }, // within
      { createdAt: 2500000, status: "closed", commission: 100000 }, // after period
    ];
    const result = computeGoalProgress([baseGoal], deals);
    expect(result[0].dealsClosed).toBe(1); // only the one within period and closed
    expect(result[0].commission).toBe(100000);
  });

  it('counts deals with status "closed" or "sold" as closed', () => {
    const deals: SourceDealData[] = [
      { createdAt: 1500000, status: "closed", commission: 100000 },
      { createdAt: 1600000, status: "sold", commission: 200000 },
      { createdAt: 1700000, status: "cancelled", commission: 100000 }, // not closed/sold
    ];
    const result = computeGoalProgress([baseGoal], deals);
    expect(result[0].dealsClosed).toBe(2);
  });

  it("sums commission from ALL matching period deals regardless of status", () => {
    const deals: SourceDealData[] = [
      { createdAt: 1500000, status: "pending", commission: 30000 },
      { createdAt: 1600000, status: "cancelled", commission: 20000 },
    ];
    const result = computeGoalProgress([baseGoal], deals);
    expect(result[0].commission).toBe(50000);
    expect(result[0].dealsClosed).toBe(0); // neither closed/sold
  });

  it("computes dealProgress as ratio of closed deals to target", () => {
    const deals: SourceDealData[] = Array.from({ length: 3 }, (_, i) => ({
      createdAt: 1500000 + i * 100000,
      status: "closed",
      commission: 100000,
    }));
    const result = computeGoalProgress([baseGoal], deals);
    expect(result[0].dealsClosed).toBe(3);
    expect(result[0].dealProgress).toBe(0.6); // 3/5
  });

  it("computes commissionProgress as ratio to target", () => {
    const deals: SourceDealData[] = [
      { createdAt: 1500000, status: "closed", commission: 100000 },
      { createdAt: 1600000, status: "closed", commission: 150000 },
    ];
    const result = computeGoalProgress([baseGoal], deals);
    expect(result[0].commission).toBe(250000);
    expect(result[0].commissionProgress).toBe(0.5); // 250000/500000
  });

  it("returns 0 for dealProgress when targetDeals is 0", () => {
    const goalWithNoTarget: AgentGoal = { ...baseGoal, targetDeals: 0 };
    const result = computeGoalProgress([goalWithNoTarget], []);
    expect(result[0].dealProgress).toBe(0);
  });

  it("returns 0 for commissionProgress when targetCommission is 0", () => {
    const goalWithNoTarget: AgentGoal = { ...baseGoal, targetCommission: 0 };
    const result = computeGoalProgress([goalWithNoTarget], []);
    expect(result[0].commissionProgress).toBe(0);
  });

  it("handles multiple goals", () => {
    const goal1 = {
      ...baseGoal,
      id: "goal-1",
      periodStart: 1000,
      periodEnd: 2000,
    };
    const goal2 = {
      ...baseGoal,
      id: "goal-2",
      periodStart: 3000,
      periodEnd: 4000,
    };
    const deals: SourceDealData[] = [
      { createdAt: 1500, status: "closed", commission: 50000 },
      { createdAt: 3500, status: "closed", commission: 75000 },
    ];
    const result = computeGoalProgress([goal1, goal2], deals);
    expect(result).toHaveLength(2);
    expect(result[0].goal.id).toBe("goal-1");
    expect(result[0].commission).toBe(50000);
    expect(result[1].goal.id).toBe("goal-2");
    expect(result[1].commission).toBe(75000);
  });

  it("uses 0 for createdAt when undefined", () => {
    const deals: SourceDealData[] = [
      { status: "closed", commission: 100000 }, // createdAt undefined
    ];
    const result = computeGoalProgress([baseGoal], deals);
    // undefined createdAt -> 0, which is < periodStart, so not counted
    expect(result[0].dealsClosed).toBe(0);
    expect(result[0].commission).toBe(0);
  });
});
