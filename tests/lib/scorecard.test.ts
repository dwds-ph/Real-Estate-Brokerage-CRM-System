import { describe, it, expect } from "vitest";
import { computeScorecard, getPeriodLabel } from "@/lib/scorecard";
import type { AppUser, Deal, Lead, Viewing } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

/** Create a minimal agent. */
function makeAgent(overrides: Partial<AppUser> = {}): AppUser {
  return {
    id: "agent-1",
    role: "agent",
    displayName: "Alice Agent",
    email: "alice@example.com",
    photoURL: "https://example.com/alice.jpg",
    isActive: true,
    createdAt: now - 365 * DAY,
    ...overrides,
  };
}

/** Create a minimal deal. */
function makeDeal(overrides: Partial<Deal> & { createdBy: string }): Deal {
  return {
    id: `deal-${Math.random().toString(36).slice(2, 8)}`,
    clientName: "Client",
    clientContact: "client@example.com",
    dealPrice: 3_000_000,
    status: "closed",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Create a minimal lead. */
function makeLead(overrides: Partial<Lead> & { assignedTo: string }): Lead {
  return {
    id: `lead-${Math.random().toString(36).slice(2, 8)}`,
    name: "Lead Name",
    source: "referral",
    status: "new",
    score: "warm",
    communicationLog: [],
    activityTimeline: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Create a minimal viewing. */
function makeViewing(
  overrides: Partial<Viewing> & { agentId: string },
): Viewing {
  return {
    id: `viewing-${Math.random().toString(36).slice(2, 8)}`,
    leadId: "lead-1",
    listingId: "listing-1",
    status: "done",
    scheduledAt: now,
    createdAt: now,
    photos: [],
    ...overrides,
  };
}

// ─── computeScorecard ─────────────────────────────────────────────────

describe("computeScorecard", () => {
  // ── Filtering & Basic Structure ─────────────────────────────────────

  it("returns an empty array when no agents are provided", () => {
    const result = computeScorecard({
      agents: [],
      deals: [],
      leads: [],
      viewings: [],
    });
    expect(result).toEqual([]);
  });

  it("returns an empty array when all agents are brokers (filtered out)", () => {
    const agents: AppUser[] = [
      makeAgent({ id: "broker-1", role: "broker", displayName: "Broker Bob" }),
      makeAgent({
        id: "broker-2",
        role: "broker",
        displayName: "Broker Betty",
      }),
    ];
    const result = computeScorecard({
      agents,
      deals: [],
      leads: [],
      viewings: [],
    });
    expect(result).toEqual([]);
  });

  it("filters out brokers but includes agents and sub-agents", () => {
    const agents: AppUser[] = [
      makeAgent({ id: "broker-1", role: "broker", displayName: "Broker" }),
      makeAgent({ id: "agent-1", role: "agent", displayName: "Alice" }),
      makeAgent({ id: "sub-1", role: "sub-agent", displayName: "Subby" }),
    ];
    const result = computeScorecard({
      agents,
      deals: [],
      leads: [],
      viewings: [],
    });
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.agentId)).toEqual(["agent-1", "sub-1"]);
  });

  it("returns an AgentScore object with correct shape", () => {
    const agent = makeAgent();
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings: [],
    });
    expect(result).toHaveLength(1);
    const entry = result[0];
    expect(entry).toMatchObject({
      agentId: "agent-1",
      displayName: "Alice Agent",
      role: "agent",
      photoURL: "https://example.com/alice.jpg",
    });
    expect(entry).toHaveProperty("dealsClosed");
    expect(entry).toHaveProperty("totalCommission");
    expect(entry).toHaveProperty("leadConversionRate");
    expect(entry).toHaveProperty("averageDealSize");
    expect(entry).toHaveProperty("viewingToDealRatio");
    expect(entry).toHaveProperty("totalViewings");
    expect(entry).toHaveProperty("totalLeadsAssigned");
    expect(entry).toHaveProperty("dealsTrend");
    expect(entry).toHaveProperty("commissionTrend");
    expect(entry).toHaveProperty("score");
    expect(entry).toHaveProperty("badges");
    expect(Array.isArray(entry.badges)).toBe(true);
  });

  // ── Sorting ─────────────────────────────────────────────────────────

  it("sorts agents by score descending", () => {
    const agents: AppUser[] = [
      makeAgent({ id: "a", displayName: "Low" }),
      makeAgent({ id: "b", displayName: "High" }),
    ];
    // Give agent-b a closed deal so they score higher
    const deals: Deal[] = [
      makeDeal({
        createdBy: "b",
        status: "closed",
        dealPrice: 10_000_000,
        createdAt: now,
      }),
    ];
    const result = computeScorecard({ agents, deals, leads: [], viewings: [] });
    expect(result[0].agentId).toBe("b");
    expect(result[1].agentId).toBe("a");
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  // ── Deals Metrics ───────────────────────────────────────────────────

  it("counts only closed deals from the last 30 days", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({ createdBy: "a", status: "closed", createdAt: now - 5 * DAY }), // this month
      makeDeal({ createdBy: "a", status: "closed", createdAt: now - 40 * DAY }), // previous month
      makeDeal({ createdBy: "a", status: "pending", createdAt: now }), // not closed
      makeDeal({ createdBy: "a", status: "closed", createdAt: now - 70 * DAY }), // too old, ignored
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].dealsClosed).toBe(1); // only the first deal
  });

  it("computes totalCommission from agentShare (preferred) or total fallback", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 5_000_000,
        createdAt: now,
        commission: {
          total: 150_000,
          brokerShare: 45_000,
          agentShare: 105_000,
        },
      }),
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 3_000_000,
        createdAt: now,
        commission: { total: 90_000, brokerShare: 27_000, agentShare: 63_000 },
      }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].totalCommission).toBe(105_000 + 63_000);
  });

  it("falls back to commission.total when agentShare is undefined", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 5_000_000,
        createdAt: now,
        commission: { total: 150_000, brokerShare: 45_000 },
        // agentShare is undefined
      }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].totalCommission).toBe(150_000);
  });

  it("uses 0 for commission when no commission object exists", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 5_000_000,
        createdAt: now,
      }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].totalCommission).toBe(0);
  });

  // ── Lead Conversion ─────────────────────────────────────────────────

  it("computes leadConversionRate as percentage of closed leads vs assigned leads", () => {
    const agent = makeAgent({ id: "a" });
    const leads: Lead[] = [
      makeLead({ assignedTo: "a", status: "closed" }),
      makeLead({ assignedTo: "a", status: "closed" }),
      makeLead({ assignedTo: "a", status: "new" }),
      makeLead({ assignedTo: "a", status: "lost" }),
      makeLead({ assignedTo: "b", status: "closed" }), // assigned to different agent
    ];
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads,
      viewings: [],
    });
    expect(result[0].leadConversionRate).toBe(50); // 2/4 = 50%
    expect(result[0].totalLeadsAssigned).toBe(4);
  });

  it("returns 0% lead conversion rate when no leads assigned", () => {
    const agent = makeAgent({ id: "a" });
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings: [],
    });
    expect(result[0].leadConversionRate).toBe(0);
    expect(result[0].totalLeadsAssigned).toBe(0);
  });

  // ── Average Deal Size ───────────────────────────────────────────────

  it("computes averageDealSize across all closed deals (not just this month)", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 2_000_000,
        createdAt: now - 5 * DAY,
      }),
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 4_000_000,
        createdAt: now - 40 * DAY,
      }),
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 6_000_000,
        createdAt: now - 400 * DAY,
      }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].averageDealSize).toBe(4_000_000); // (2M + 4M + 6M) / 3
  });

  it("returns 0 averageDealSize when no closed deals exist", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({ createdBy: "a", status: "pending", dealPrice: 5_000_000 }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].averageDealSize).toBe(0);
  });

  // ── Viewings ────────────────────────────────────────────────────────

  it("counts only 'done' viewings for totalViewings and viewingToDealRatio", () => {
    const agent = makeAgent({ id: "a" });
    const viewings: Viewing[] = [
      makeViewing({ agentId: "a", status: "done" }),
      makeViewing({ agentId: "a", status: "done" }),
      makeViewing({ agentId: "a", status: "scheduled" }),
      makeViewing({ agentId: "a", status: "cancelled" }),
    ];
    const deals: Deal[] = [
      makeDeal({ createdBy: "a", status: "closed", dealPrice: 3_000_000 }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings,
    });
    expect(result[0].totalViewings).toBe(2);
    expect(result[0].viewingToDealRatio).toBe(0.5); // 1 closed / 2 done viewings
  });

  it("returns 0 for viewingToDealRatio when no done viewings exist", () => {
    const agent = makeAgent({ id: "a" });
    const viewings: Viewing[] = [
      makeViewing({ agentId: "a", status: "scheduled" }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings,
    });
    expect(result[0].totalViewings).toBe(0);
    expect(result[0].viewingToDealRatio).toBe(0);
  });

  it("ignores viewings assigned to other agents", () => {
    const agent = makeAgent({ id: "a" });
    const viewings: Viewing[] = [
      makeViewing({ agentId: "a", status: "done" }),
      makeViewing({ agentId: "b", status: "done" }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings,
    });
    expect(result[0].totalViewings).toBe(1);
  });

  // ── Trends ──────────────────────────────────────────────────────────

  it("reports 'up' deal trend when this month > previous month", () => {
    const agent = makeAgent({ id: "a" });
    // This month: 1 deal. Prev month: 0 deals.
    const result = computeScorecard({
      agents: [agent],
      deals: [
        makeDeal({
          createdBy: "a",
          status: "closed",
          createdAt: now - 5 * DAY,
        }),
      ],
      leads: [],
      viewings: [],
    });
    expect(result[0].dealsTrend).toBe("up");
  });

  it("reports 'down' deal trend when this month < previous month", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({ createdBy: "a", status: "closed", createdAt: now - 5 * DAY }), // this month: 1
      makeDeal({ createdBy: "a", status: "closed", createdAt: now - 40 * DAY }), // prev month: 1
      makeDeal({ createdBy: "a", status: "closed", createdAt: now - 45 * DAY }), // prev month: 2
    ];
    // This month: 1, Prev month: 2 => down
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].dealsTrend).toBe("down");
  });

  it("reports 'stable' deal trend when this month == previous month", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({ createdBy: "a", status: "closed", createdAt: now - 5 * DAY }), // this month: 1
      makeDeal({ createdBy: "a", status: "closed", createdAt: now - 40 * DAY }), // prev month: 1
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].dealsTrend).toBe("stable");
  });

  it("reports 'stable' when both this month and prev month are 0", () => {
    const agent = makeAgent({ id: "a" });
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings: [],
    });
    expect(result[0].dealsTrend).toBe("stable");
  });

  it("reports commission trend correctly (up / down / stable)", () => {
    const agent = makeAgent({ id: "a" });

    // Prev month deal: lower commission
    const dealsUp: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        createdAt: now - 5 * DAY,
        commission: {
          total: 200_000,
          brokerShare: 60_000,
          agentShare: 140_000,
        },
      }),
      makeDeal({
        createdBy: "a",
        status: "closed",
        createdAt: now - 40 * DAY,
        commission: { total: 100_000, brokerShare: 30_000, agentShare: 70_000 },
      }),
    ];
    const resultUp = computeScorecard({
      agents: [agent],
      deals: dealsUp,
      leads: [],
      viewings: [],
    });
    expect(resultUp[0].commissionTrend).toBe("up");

    const dealsDown: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        createdAt: now - 5 * DAY,
        commission: { total: 50_000, brokerShare: 15_000, agentShare: 35_000 },
      }),
      makeDeal({
        createdBy: "a",
        status: "closed",
        createdAt: now - 40 * DAY,
        commission: { total: 100_000, brokerShare: 30_000, agentShare: 70_000 },
      }),
      makeDeal({
        createdBy: "a",
        status: "closed",
        createdAt: now - 45 * DAY,
        commission: { total: 100_000, brokerShare: 30_000, agentShare: 70_000 },
      }),
    ];
    const resultDown = computeScorecard({
      agents: [agent],
      deals: dealsDown,
      leads: [],
      viewings: [],
    });
    expect(resultDown[0].commissionTrend).toBe("down");
  });

  // ── Score Calculation ───────────────────────────────────────────────

  it("computes score based on weighted components", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 5_000_000,
        createdAt: now,
      }),
    ];
    const leads: Lead[] = [makeLead({ assignedTo: "a", status: "closed" })];
    const viewings: Viewing[] = Array.from({ length: 20 }, () =>
      makeViewing({ agentId: "a", status: "done" }),
    );
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads,
      viewings,
    });
    const entry = result[0];

    // With a single agent all max-ratios = 1:
    // dealsClosed/maxDeals * 30 = 1 * 30 = 30
    // totalCommission/maxCommission * 25 = 0/1 * 25 = 0  (no commission object)
    // leadConversionRate/100 * 20 = 100/100 * 20 = 20
    // averageDealSize/maxAvg * 10 = 1 * 10 = 10
    // viewingToDealRatio * 10 = (1/20) * 10 = 0.5
    // Math.min(20/20, 1) * 5 = 1 * 5 = 5
    // Total = 30 + 0 + 20 + 10 + 0.5 + 5 = 65.5 -> round to 66
    expect(entry.score).toBe(66);
  });

  it("clamps score to a maximum of 100", () => {
    const agents: AppUser[] = [makeAgent({ id: "a" })];
    // To reach 100: deals/max=1 (30) + commission/max=1 (25) + 100% conversion (20) + avg/max=1 (10) + ratio=1.0 (10) + 20+ viewings (5)
    // viewingToDealRatio = closedDeals/doneViewings = 1.0 -> need equal counts
    // totalViewings >= 20 for the min(x/20,1) * 5 component
    const deals: Deal[] = Array.from({ length: 20 }, () =>
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 100_000_000,
        createdAt: now,
        commission: {
          total: 3_000_000,
          brokerShare: 900_000,
          agentShare: 2_100_000,
        },
      }),
    );
    const leads: Lead[] = Array.from({ length: 10 }, () =>
      makeLead({ assignedTo: "a", status: "closed" }),
    );
    const viewings: Viewing[] = Array.from({ length: 20 }, () =>
      makeViewing({ agentId: "a", status: "done" }),
    );
    const result = computeScorecard({ agents, deals, leads, viewings });
    expect(result[0].score).toBe(100);
  });

  it("score is at least 0 for agents with no activity", () => {
    const agent = makeAgent({ id: "a" });
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings: [],
    });
    expect(result[0].score).toBeGreaterThanOrEqual(0);
    expect(result[0].score).toBe(0);
  });

  // ── Badges ──────────────────────────────────────────────────────────

  it("awards 'first-deal' badge when agent has at least 1 closed deal", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [makeDeal({ createdBy: "a", status: "closed" })];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).toContain("first-deal");
  });

  it("does not award 'first-deal' when agent has 0 closed deals", () => {
    const agent = makeAgent({ id: "a" });
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).not.toContain("first-deal");
  });

  it("awards 'million-club' when total deal volume >= ₱1,000,000", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({ createdBy: "a", status: "closed", dealPrice: 600_000 }),
      makeDeal({ createdBy: "a", status: "closed", dealPrice: 500_000 }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).toContain("million-club");
  });

  it("does not award 'million-club' when total volume < ₱1,000,000", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({ createdBy: "a", status: "closed", dealPrice: 500_000 }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).not.toContain("million-club");
  });

  it("awards 'perfect-month' when agent has 3+ closed deals", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = Array.from({ length: 3 }, () =>
      makeDeal({ createdBy: "a", status: "closed" }),
    );
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).toContain("perfect-month");
  });

  it("does not award 'perfect-month' when agent has < 3 closed deals", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = Array.from({ length: 2 }, () =>
      makeDeal({ createdBy: "a", status: "closed" }),
    );
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).not.toContain("perfect-month");
  });

  it("awards 'high-converter' when conversion rate >= 50%", () => {
    const agent = makeAgent({ id: "a" });
    const leads: Lead[] = [
      makeLead({ assignedTo: "a", status: "closed" }),
      makeLead({ assignedTo: "a", status: "closed" }),
      makeLead({ assignedTo: "a", status: "new" }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads,
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).toContain("high-converter");
  });

  it("does not award 'high-converter' when conversion rate < 50%", () => {
    const agent = makeAgent({ id: "a" });
    const leads: Lead[] = [
      makeLead({ assignedTo: "a", status: "closed" }),
      makeLead({ assignedTo: "a", status: "new" }),
      makeLead({ assignedTo: "a", status: "lost" }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads,
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).not.toContain("high-converter");
  });

  it("awards 'top-viewer' when done viewings >= 20", () => {
    const agent = makeAgent({ id: "a" });
    const viewings: Viewing[] = Array.from({ length: 20 }, () =>
      makeViewing({ agentId: "a", status: "done" }),
    );
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings,
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).toContain("top-viewer");
  });

  it("does not award 'top-viewer' when done viewings < 20", () => {
    const agent = makeAgent({ id: "a" });
    const viewings: Viewing[] = Array.from({ length: 19 }, () =>
      makeViewing({ agentId: "a", status: "done" }),
    );
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings,
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).not.toContain("top-viewer");
  });

  it("awards 'veteran' badge when agent has 10+ closed deals", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = Array.from({ length: 10 }, () =>
      makeDeal({ createdBy: "a", status: "closed" }),
    );
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).toContain("veteran");
  });

  it("does not award 'veteran' when closed deals < 10", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = Array.from({ length: 9 }, () =>
      makeDeal({ createdBy: "a", status: "closed" }),
    );
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).not.toContain("veteran");
  });

  it("awards 'team-player' badge when agent has a co-broking deal", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        coBroking: {
          enabled: true,
          agent2Id: "b",
          agent2Name: "Bob",
          splitPercent: 50,
        },
      }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).toContain("team-player");
  });

  it("does not award 'team-player' when no co-broking deals", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [makeDeal({ createdBy: "a", status: "closed" })];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).not.toContain("team-player");
  });

  it("awards 'team-player' when co-broking deal exists even if not closed", () => {
    // The computeBadges function receives allAgentDeals (not just closed ones)
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "pending",
        coBroking: {
          enabled: true,
          agent2Id: "b",
          agent2Name: "Bob",
          splitPercent: 50,
        },
      }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    const badgeIds = result[0].badges.map((b) => b.id);
    expect(badgeIds).toContain("team-player");
  });

  it("awards multiple badges when conditions are met", () => {
    const agent = makeAgent({ id: "a" });
    // 10+ deals, volume > 1M, 3+ deals, co-broking
    const deals: Deal[] = Array.from({ length: 10 }, (_, i) =>
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 200_000,
        coBroking:
          i === 0
            ? {
                enabled: true,
                agent2Id: "b",
                agent2Name: "Bob",
                splitPercent: 50,
              }
            : undefined,
      }),
    );
    const leads: Lead[] = Array.from({ length: 4 }, () =>
      makeLead({ assignedTo: "a", status: "closed" }),
    );
    const viewings: Viewing[] = Array.from({ length: 25 }, () =>
      makeViewing({ agentId: "a", status: "done" }),
    );
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads,
      viewings,
    });
    const badgeIds = result[0].badges.map((b) => b.id);

    // All non-riser badges except maybe high-converter (need to check)
    // conversion: 4/4 = 100% >= 50 -> high-converter ✓
    expect(badgeIds).toContain("first-deal");
    expect(badgeIds).toContain("million-club");
    expect(badgeIds).toContain("perfect-month");
    expect(badgeIds).toContain("high-converter");
    expect(badgeIds).toContain("top-viewer");
    expect(badgeIds).toContain("veteran");
    expect(badgeIds).toContain("team-player");
    // riser is not implemented via computeBadges (it's special)
    expect(badgeIds).not.toContain("riser");
  });

  it("assigns earnedAt timestamp to each badge", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [makeDeal({ createdBy: "a", status: "closed" })];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].badges.length).toBeGreaterThan(0);
    for (const badge of result[0].badges) {
      expect(badge.earnedAt).toBeGreaterThan(0);
    }
  });

  // ── Multi-Agent Scenarios ──────────────────────────────────────────

  it("correctly handles multiple agents with different performance levels", () => {
    const agents: AppUser[] = [
      makeAgent({ id: "a", displayName: "Top Agent" }),
      makeAgent({ id: "b", displayName: "Mid Agent" }),
      makeAgent({ id: "c", displayName: "No Activity" }),
    ];
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 10_000_000,
        createdAt: now,
      }),
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 5_000_000,
        createdAt: now,
      }),
      makeDeal({
        createdBy: "b",
        status: "closed",
        dealPrice: 3_000_000,
        createdAt: now,
      }),
    ];
    const leads: Lead[] = [
      makeLead({ assignedTo: "a", status: "closed" }),
      makeLead({ assignedTo: "a", status: "closed" }),
      makeLead({ assignedTo: "b", status: "closed" }),
      makeLead({ assignedTo: "b", status: "new" }),
    ];
    const viewings: Viewing[] = [
      ...Array.from({ length: 15 }, () =>
        makeViewing({ agentId: "a", status: "done" }),
      ),
      ...Array.from({ length: 5 }, () =>
        makeViewing({ agentId: "b", status: "done" }),
      ),
    ];

    const result = computeScorecard({ agents, deals, leads, viewings });
    expect(result).toHaveLength(3);
    // a should be first (highest score)
    expect(result[0].agentId).toBe("a");
    // b should be second
    expect(result[1].agentId).toBe("b");
    // c should be last
    expect(result[2].agentId).toBe("c");

    // Verify agent a has all the metrics
    expect(result[0].dealsClosed).toBe(2);
    expect(result[0].leadConversionRate).toBe(100); // 2/2
    expect(result[0].totalViewings).toBe(15);
    expect(result[0].badges).toHaveLength(3); // first-deal + million-club (15M volume) + high-converter

    // Agent c has all zeros
    expect(result[2].dealsClosed).toBe(0);
    expect(result[2].totalCommission).toBe(0);
    expect(result[2].leadConversionRate).toBe(0);
    expect(result[2].totalViewings).toBe(0);
    expect(result[2].badges).toHaveLength(0);
  });
});

// ─── getPeriodLabel ───────────────────────────────────────────────────

describe("getPeriodLabel", () => {
  it('returns "This Week" for days <= 7', () => {
    expect(getPeriodLabel(1)).toBe("This Week");
    expect(getPeriodLabel(7)).toBe("This Week");
    expect(getPeriodLabel(0)).toBe("This Week");
  });

  it('returns "This Month" for days in (7, 30]', () => {
    expect(getPeriodLabel(8)).toBe("This Month");
    expect(getPeriodLabel(14)).toBe("This Month");
    expect(getPeriodLabel(30)).toBe("This Month");
  });

  it('returns "This Quarter" for days in (30, 90]', () => {
    expect(getPeriodLabel(31)).toBe("This Quarter");
    expect(getPeriodLabel(60)).toBe("This Quarter");
    expect(getPeriodLabel(90)).toBe("This Quarter");
  });

  it('returns "All Time" for days > 90', () => {
    expect(getPeriodLabel(91)).toBe("All Time");
    expect(getPeriodLabel(365)).toBe("All Time");
    expect(getPeriodLabel(1_000_000)).toBe("All Time");
  });

  it("handles negative numbers (returns This Week)", () => {
    expect(getPeriodLabel(-1)).toBe("This Week");
    expect(getPeriodLabel(-100)).toBe("This Week");
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────

describe("computeScorecard – edge cases", () => {
  it("handles an agent with only pending deals (not closed)", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({ createdBy: "a", status: "pending" }),
      makeDeal({ createdBy: "a", status: "cancelled" }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].dealsClosed).toBe(0);
    expect(result[0].badges).toHaveLength(0);
  });

  it("handles an agent with only lost leads (no closed leads)", () => {
    const agent = makeAgent({ id: "a" });
    const leads: Lead[] = [
      makeLead({ assignedTo: "a", status: "lost" }),
      makeLead({ assignedTo: "a", status: "new" }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads,
      viewings: [],
    });
    expect(result[0].leadConversionRate).toBe(0);
  });

  it("handles viewingToDealRatio precision (rounded to 2 decimal places)", () => {
    const agent = makeAgent({ id: "a" });
    const viewings: Viewing[] = Array.from({ length: 7 }, () =>
      makeViewing({ agentId: "a", status: "done" }),
    );
    const deals: Deal[] = Array.from({ length: 3 }, () =>
      makeDeal({ createdBy: "a", status: "closed" }),
    );
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings,
    });
    expect(result[0].viewingToDealRatio).toBe(0.43); // 3/7 ≈ 0.4286 -> toFixed(2) = 0.43
  });

  it("treats viewings without 'done' status as not counted in ratio denominator", () => {
    const agent = makeAgent({ id: "a" });
    const viewings: Viewing[] = [
      makeViewing({ agentId: "a", status: "no-show" }),
      makeViewing({ agentId: "a", status: "scheduled" }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings,
    });
    expect(result[0].totalViewings).toBe(0);
    expect(result[0].viewingToDealRatio).toBe(0);
  });

  it("handles massive deal volumes without overflow", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 999_999_999,
        createdAt: now,
      }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    expect(result[0].averageDealSize).toBe(999_999_999);
    expect(result[0].totalCommission).toBe(0);
    expect(typeof result[0].score).toBe("number");
    expect(result[0].score).toBeGreaterThanOrEqual(0);
  });

  it("handles agent with very old deals (outside any period) – they affect avgDealSize only", () => {
    const agent = makeAgent({ id: "a" });
    const deals: Deal[] = [
      makeDeal({
        createdBy: "a",
        status: "closed",
        dealPrice: 5_000_000,
        createdAt: now - 400 * DAY,
      }),
    ];
    const result = computeScorecard({
      agents: [agent],
      deals,
      leads: [],
      viewings: [],
    });
    // dealsClosed counts only this month -> 0
    expect(result[0].dealsClosed).toBe(0);
    // But averageDealSize considers all closed deals -> 5M
    expect(result[0].averageDealSize).toBe(5_000_000);
    // No this-month deals -> dealsClosed = 0, but maxDeals ensures min 1
    expect(result[0].score).toBeGreaterThanOrEqual(0);
  });

  it("treats agents with same score as stable sort (by score desc)", () => {
    const agents: AppUser[] = [
      makeAgent({ id: "a", displayName: "A" }),
      makeAgent({ id: "b", displayName: "B" }),
    ];
    const result = computeScorecard({
      agents,
      deals: [],
      leads: [],
      viewings: [],
    });
    // Both have score 0, sort is stable
    expect(result).toHaveLength(2);
    expect(result[0].score).toBe(result[1].score);
  });

  it("handles undefined photoURL gracefully", () => {
    const agent = makeAgent({ photoURL: undefined });
    const result = computeScorecard({
      agents: [agent],
      deals: [],
      leads: [],
      viewings: [],
    });
    expect(result[0].photoURL).toBeUndefined();
  });
});
