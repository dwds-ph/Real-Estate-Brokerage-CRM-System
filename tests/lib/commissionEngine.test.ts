import { describe, it, expect } from "vitest";
import {
  BIR_TAX_RATES,
  DEFAULT_COMMISSION_PERCENT,
  DEFAULT_BROKER_SPLIT,
  DEFAULT_AGENT_SPLIT,
  DEFAULT_COBROKING_SPLIT,
  computeGrossCommission,
  computeSplits,
  computeTaxes,
  computeNetCommission,
  computeFullBreakdown,
  formatCommissionPercent,
  getDefaultSplitConfig,
} from "@/lib/commissionEngine";
import type { CommissionPlan, CommissionSplitConfig } from "@/types";

// ─── BIR_TAX_RATES ───────────────────────────────────────────────────

describe("BIR_TAX_RATES", () => {
  it("exports correct VAT rate of 12%", () => {
    expect(BIR_TAX_RATES.VAT).toBe(0.12);
  });

  it("exports correct withholding tax rates", () => {
    expect(BIR_TAX_RATES.WITHHOLDING_INDIVIDUAL).toBe(0.01);
    expect(BIR_TAX_RATES.WITHHOLDING_CORPORATE).toBe(0.02);
  });

  it("exports correct CGT rate of 6%", () => {
    expect(BIR_TAX_RATES.CGT).toBe(0.06);
  });

  it("exports correct DST rate of 1.5%", () => {
    expect(BIR_TAX_RATES.DST).toBe(0.015);
  });
});

// ─── DEFAULT COMMISSION CONSTANTS ────────────────────────────────────

describe("default commission constants", () => {
  it("DEFAULT_COMMISSION_PERCENT is 3", () => {
    expect(DEFAULT_COMMISSION_PERCENT).toBe(3);
  });

  it("DEFAULT_BROKER_SPLIT is 0.3 and DEFAULT_AGENT_SPLIT is 0.7", () => {
    expect(DEFAULT_BROKER_SPLIT).toBe(0.3);
    expect(DEFAULT_AGENT_SPLIT).toBe(0.7);
  });

  it("DEFAULT_COBROKING_SPLIT is 0.5", () => {
    expect(DEFAULT_COBROKING_SPLIT).toBe(0.5);
  });
});

// ─── computeGrossCommission ──────────────────────────────────────────

describe("computeGrossCommission", () => {
  // ── Default (no plan, no custom percent) ──────────────────────────
  it("uses default 3% when no plan and no custom percent given", () => {
    const result = computeGrossCommission(10_000_000);
    expect(result).toBe(300_000); // 10M * 3%
  });

  it("uses default 3% when plan is null", () => {
    const result = computeGrossCommission(5_000_000, null);
    expect(result).toBe(150_000); // 5M * 3%
  });

  // ── Custom percent ────────────────────────────────────────────────
  it("accepts a custom percent (e.g., 5%)", () => {
    const result = computeGrossCommission(2_000_000, undefined, 5);
    expect(result).toBe(100_000); // 2M * 5%
  });

  it("accepts a custom percent with null plan", () => {
    const result = computeGrossCommission(1_000_000, null, 2.5);
    expect(result).toBe(25_000); // 1M * 2.5%
  });

  // ── Zero and edge cases ───────────────────────────────────────────
  it("returns 0 for a deal price of 0", () => {
    expect(computeGrossCommission(0)).toBe(0);
    expect(computeGrossCommission(0, null, 5)).toBe(0);
  });

  it("handles very small deal prices", () => {
    const result = computeGrossCommission(1);
    expect(result).toBe(0.03); // 1 * 3%
  });

  it("handles very large deal prices without overflow", () => {
    const result = computeGrossCommission(1_000_000_000);
    expect(result).toBe(30_000_000); // 1B * 3%
  });

  // ── Commission plans ──────────────────────────────────────────────
  describe("with a CommissionPlan", () => {
    it("supports fixed-type plan", () => {
      const plan: CommissionPlan = {
        id: "p1",
        name: "Fixed 5%",
        type: "fixed",
        brokerId: "b1",
        rules: { percent: 5 },
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      };
      const result = computeGrossCommission(10_000_000, plan);
      expect(result).toBe(500_000); // 10M * 5%
    });

    it("fixed plan falls back to default percent when rules.percent is missing", () => {
      const plan: CommissionPlan = {
        id: "p2",
        name: "Fixed no percent",
        type: "fixed",
        brokerId: "b1",
        rules: {},
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      };
      const result = computeGrossCommission(10_000_000, plan);
      expect(result).toBe(300_000); // 10M * 3%
    });

    it("supports tiered plan and picks the best matching tier", () => {
      const plan: CommissionPlan = {
        id: "p3",
        name: "Tiered",
        type: "tiered",
        brokerId: "b1",
        rules: {
          tiers: [
            { minVolume: 0, percent: 2 },
            { minVolume: 5_000_000, percent: 3 },
            { minVolume: 10_000_000, percent: 4 },
          ],
        },
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      };
      // Deal above 10M -> 4%
      expect(computeGrossCommission(12_000_000, plan)).toBe(480_000);
      // Deal between 5M and 10M -> 3%
      expect(computeGrossCommission(7_000_000, plan)).toBe(210_000);
      // Deal below 5M -> 2%
      expect(computeGrossCommission(1_000_000, plan)).toBe(20_000);
    });

    it("tiered plan falls back to default percent when tiers list is empty", () => {
      const plan: CommissionPlan = {
        id: "p4",
        name: "Empty tiers",
        type: "tiered",
        brokerId: "b1",
        rules: { tiers: [] },
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      };
      // Default is 3% since no tier matched; first tier with minVolume 0 would match
      // but there are no tiers, so falls through to default 3%
      expect(computeGrossCommission(10_000_000, plan)).toBe(300_000);
    });

    it("supports escalating plan below threshold", () => {
      const plan: CommissionPlan = {
        id: "p5",
        name: "Escalating 3% -> 4.5%",
        type: "escalating",
        brokerId: "b1",
        rules: { percent: 3, minVolumeForEscalation: 5_000_000 },
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      };
      // Below 5M -> base rate 3%
      expect(computeGrossCommission(4_000_000, plan)).toBe(120_000);
    });

    it("supports escalating plan at and above threshold (factor 1.5)", () => {
      const plan: CommissionPlan = {
        id: "p6",
        name: "Escalating 3% -> 4.5%",
        type: "escalating",
        brokerId: "b1",
        rules: { percent: 3, minVolumeForEscalation: 5_000_000 },
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      };
      // At threshold -> 3% * 1.5 = 4.5%
      expect(computeGrossCommission(5_000_000, plan)).toBe(225_000); // 5M * 4.5%
      // Above threshold -> 4.5%
      expect(computeGrossCommission(10_000_000, plan)).toBe(450_000); // 10M * 4.5%
    });

    it("escalating plan falls back to default percent and default minVolume", () => {
      const plan: CommissionPlan = {
        id: "p7",
        name: "Escalating minimal",
        type: "escalating",
        brokerId: "b1",
        rules: {},
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      };
      // Below 5M (default minVolume) -> base default 3%
      expect(computeGrossCommission(4_000_000, plan)).toBe(120_000);
      // Above 5M -> 3% * 1.5 = 4.5%
      expect(computeGrossCommission(6_000_000, plan)).toBe(270_000); // 6M * 4.5%
    });

    it("supports referral-type plan", () => {
      const plan: CommissionPlan = {
        id: "p8",
        name: "Referral 1%",
        type: "referral",
        brokerId: "b1",
        rules: { referralFee: 1 },
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      };
      const result = computeGrossCommission(10_000_000, plan);
      expect(result).toBe(100_000); // 10M * 1%
    });

    it("referral plan falls back to default percent when referralFee is missing", () => {
      const plan: CommissionPlan = {
        id: "p9",
        name: "Referral no fee",
        type: "referral",
        brokerId: "b1",
        rules: {},
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      };
      const result = computeGrossCommission(10_000_000, plan);
      expect(result).toBe(300_000); // 10M * 3%
    });

    it("handles unknown plan type by falling back to default percent", () => {
      const plan = {
        id: "p10",
        name: "Unknown",
        type: "invalid-type",
        brokerId: "b1",
        rules: { percent: 5 },
        assignedTo: [],
        createdAt: 0,
        updatedAt: 0,
      } as unknown as CommissionPlan;
      const result = computeGrossCommission(10_000_000, plan);
      expect(result).toBe(300_000); // fallback to 3%
    });
  });
});

// ─── computeSplits ───────────────────────────────────────────────────

describe("computeSplits", () => {
  // ── Default splits ────────────────────────────────────────────────
  it("uses default broker/agent split when no config given", () => {
    const result = computeSplits(100_000);
    expect(result.brokerShare).toBe(30_000); // 30%
    expect(result.agentShare).toBe(70_000); // 70%
    expect(result.agent2Share).toBeUndefined();
    expect(result.referralFee).toBeUndefined();
  });

  it("uses default split when config is null", () => {
    const result = computeSplits(100_000, null);
    expect(result.brokerShare).toBe(30_000);
    expect(result.agentShare).toBe(70_000);
  });

  // ── Custom splits ─────────────────────────────────────────────────
  it("accepts custom broker/agent rates", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.4,
      agentRate: 0.6,
    };
    const result = computeSplits(100_000, config);
    expect(result.brokerShare).toBe(40_000); // 100K * 0.4
    expect(result.agentShare).toBe(60_000); // 100K * 0.6
    expect(result.agent2Share).toBeUndefined();
    expect(result.referralFee).toBeUndefined();
  });

  it("normalizes broker+agent rates to sum 1.0", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.25,
      agentRate: 0.75,
    };
    const result = computeSplits(100_000, config);
    expect(result.brokerShare).toBe(25_000);
    expect(result.agentShare).toBe(75_000);
  });

  // ── Referral fees ─────────────────────────────────────────────────
  it("deducts referral fee before splitting", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.3,
      agentRate: 0.7,
      referralPercent: 10,
    };
    const result = computeSplits(100_000, config);
    // After referral: 100K * (1 - 0.10) = 90K
    // broker: 90K * (0.3 / (0.3 + 0.7)) = 27K
    // agent: 90K * (0.7 / (0.3 + 0.7)) = 63K
    // referralFee: 10K
    expect(result.brokerShare).toBeCloseTo(27_000);
    expect(result.agentShare).toBeCloseTo(63_000);
    expect(result.referralFee).toBe(10_000);
    expect(result.agent2Share).toBeUndefined();
  });

  it("does not include referralFee if referralPercent is 0", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.3,
      agentRate: 0.7,
      referralPercent: 0,
    };
    const result = computeSplits(100_000, config);
    expect(result.referralFee).toBeUndefined();
    expect(result.brokerShare).toBe(30_000);
    expect(result.agentShare).toBe(70_000);
  });

  it("does not include referralFee if referralPercent is negative", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.3,
      agentRate: 0.7,
      referralPercent: -5,
    };
    const result = computeSplits(100_000, config);
    expect(result.referralFee).toBeUndefined();
    expect(result.brokerShare).toBe(30_000);
    expect(result.agentShare).toBe(70_000);
  });

  // ── Co-broking ────────────────────────────────────────────────────
  it("splits between two agents with co-broking enabled (default broker rate)", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.3,
      agentRate: 0.7,
      coBroking: {
        enabled: true,
        agent2Id: "agent2",
        agent2Name: "Agent Two",
        splitPercent: 50,
      },
    };
    const result = computeSplits(100_000, config);
    // Agent1 share: 100K * (1 - 0.5) = 50K
    // Agent2 share: 100K * 0.5 = 50K
    // Broker: 50K * 0.3 + 50K * 0.3 = 30K
    // Agent1 net: 50K * 0.7 = 35K
    // Agent2 net: 50K * 0.7 = 35K
    expect(result.brokerShare).toBeCloseTo(30_000);
    expect(result.agentShare).toBeCloseTo(35_000);
    expect(result.agent2Share).toBeCloseTo(35_000);
    expect(result.referralFee).toBeUndefined();
  });

  it("co-broking splits with referral fee also applied", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.3,
      agentRate: 0.7,
      referralPercent: 10,
      coBroking: {
        enabled: true,
        agent2Id: "agent2",
        agent2Name: "Agent Two",
        splitPercent: 40,
      },
    };
    const result = computeSplits(100_000, config);
    // After referral: 100K * 0.9 = 90K
    // Agent1 share: 90K * 0.6 = 54K
    // Agent2 share: 90K * 0.4 = 36K
    // Broker: 54K * 0.3 + 36K * 0.3 = 27K
    // Agent1 net: 54K * 0.7 = 37.8K
    // Agent2 net: 36K * 0.7 = 25.2K
    expect(result.referralFee).toBe(10_000);
    expect(result.brokerShare).toBeCloseTo(27_000);
    expect(result.agentShare).toBeCloseTo(37_800);
    expect(result.agent2Share).toBeCloseTo(25_200);
  });

  it("co-broking with custom broker rate", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.2,
      agentRate: 0.8,
      coBroking: {
        enabled: true,
        agent2Id: "agent2",
        agent2Name: "Agent Two",
        splitPercent: 50,
      },
    };
    const result = computeSplits(100_000, config);
    // Agent1 gross: 50K; Agent2 gross: 50K
    // Broker: 50K * 0.2 + 50K * 0.2 = 20K
    // Agent1 net: 50K * 0.8 = 40K
    // Agent2 net: 50K * 0.8 = 40K
    expect(result.brokerShare).toBeCloseTo(20_000);
    expect(result.agentShare).toBeCloseTo(40_000);
    expect(result.agent2Share).toBeCloseTo(40_000);
  });

  it("does not enter co-broking branch when coBroking is not enabled", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.3,
      agentRate: 0.7,
      coBroking: {
        enabled: false,
        agent2Id: "agent2",
        agent2Name: "Agent Two",
        splitPercent: 50,
      },
    };
    const result = computeSplits(100_000, config);
    // Normal split
    expect(result.agent2Share).toBeUndefined();
    expect(result.brokerShare).toBe(30_000);
    expect(result.agentShare).toBe(70_000);
  });

  it("does not enter co-broking branch when splitPercent is 0", () => {
    const config: CommissionSplitConfig = {
      brokerRate: 0.3,
      agentRate: 0.7,
      coBroking: {
        enabled: true,
        agent2Id: "agent2",
        agent2Name: "Agent Two",
        splitPercent: 0,
      },
    };
    const result = computeSplits(100_000, config);
    expect(result.agent2Share).toBeUndefined();
    expect(result.brokerShare).toBe(30_000);
    expect(result.agentShare).toBe(70_000);
  });
});

// ─── computeTaxes ────────────────────────────────────────────────────

describe("computeTaxes", () => {
  // ── Default options (VAT registered, individual, CGT+DST on) ─────
  it("computes all taxes with default options", () => {
    const result = computeTaxes(100_000, 5_000_000);
    expect(result.vat).toBe(12_000); // 100K * 0.12
    expect(result.withholding).toBe(1_000); // 100K * 0.01 (individual)
    expect(result.cgt).toBe(300_000); // 5M * 0.06
    expect(result.dst).toBe(75_000); // 5M * 0.015
    expect(result.totalTax).toBe(388_000);
  });

  // ── Edge: grossCommission = 0 ─────────────────────────────────────
  it("returns zero taxes when gross commission is zero", () => {
    const result = computeTaxes(0, 5_000_000);
    expect(result.vat).toBe(0);
    expect(result.withholding).toBe(0);
    expect(result.cgt).toBe(300_000); // CGT is based on dealPrice
    expect(result.dst).toBe(75_000); // DST based on dealPrice
    expect(result.totalTax).toBe(375_000);
  });

  // ── Deal price = 0 ────────────────────────────────────────────────
  it("returns zero CGT and DST when deal price is zero", () => {
    const result = computeTaxes(100_000, 0);
    expect(result.vat).toBe(12_000);
    expect(result.withholding).toBe(1_000);
    expect(result.cgt).toBe(0);
    expect(result.dst).toBe(0);
    expect(result.totalTax).toBe(13_000);
  });

  // ── Non-VAT registered ────────────────────────────────────────────
  it("skips VAT when isVatRegistered is false", () => {
    const result = computeTaxes(100_000, 5_000_000, { isVatRegistered: false });
    expect(result.vat).toBe(0);
    expect(result.totalTax).toBe(1_000 + 300_000 + 75_000);
  });

  // ── Corporate withholding ─────────────────────────────────────────
  it("applies corporate withholding when isCorporate is true", () => {
    const result = computeTaxes(100_000, 5_000_000, { isCorporate: true });
    expect(result.withholding).toBe(2_000); // 100K * 0.02
  });

  // ── Excluding CGT ─────────────────────────────────────────────────
  it("excludes CGT when includeCgt is false", () => {
    const result = computeTaxes(100_000, 5_000_000, { includeCgt: false });
    expect(result.cgt).toBe(0);
    expect(result.totalTax).toBe(12_000 + 1_000 + 75_000);
  });

  // ── Excluding DST ─────────────────────────────────────────────────
  it("excludes DST when includeDst is false", () => {
    const result = computeTaxes(100_000, 5_000_000, { includeDst: false });
    expect(result.dst).toBe(0);
    expect(result.totalTax).toBe(12_000 + 1_000 + 300_000);
  });

  // ── Custom loan amount for DST ────────────────────────────────────
  it("uses loanAmount for DST when provided", () => {
    const result = computeTaxes(100_000, 5_000_000, { loanAmount: 3_000_000 });
    expect(result.dst).toBe(45_000); // 3M * 0.015
  });

  // ── All taxes off (VAT registered, individual, no CGT/DST) ───────
  it("computes only VAT + withholding when CGT and DST are excluded", () => {
    const result = computeTaxes(100_000, 5_000_000, {
      includeCgt: false,
      includeDst: false,
    });
    expect(result.vat).toBe(12_000);
    expect(result.withholding).toBe(1_000);
    expect(result.cgt).toBe(0);
    expect(result.dst).toBe(0);
    expect(result.totalTax).toBe(13_000);
  });
});

// ─── computeNetCommission ────────────────────────────────────────────

describe("computeNetCommission", () => {
  it("subtracts all taxes and referral fee from gross commission", () => {
    const splits = {
      brokerShare: 30_000,
      agentShare: 70_000,
      referralFee: 10_000,
    };
    const taxes = {
      vat: 12_000,
      withholding: 1_000,
      cgt: 300_000,
      dst: 75_000,
      totalTax: 388_000,
    };
    const net = computeNetCommission(100_000, splits, taxes);
    // 100K - (12K + 1K + 300K + 75K + 10K) = 100K - 398K = -298K
    expect(net).toBe(-298_000);
  });

  it("returns gross commission when taxes and referral are all zero", () => {
    const splits = { brokerShare: 30_000, agentShare: 70_000 };
    const taxes = { vat: 0, withholding: 0, cgt: 0, dst: 0, totalTax: 0 };
    const net = computeNetCommission(100_000, splits, taxes);
    expect(net).toBe(100_000);
  });

  it("handles missing referralFee gracefully", () => {
    const splits = { brokerShare: 30_000, agentShare: 70_000 };
    const taxes = {
      vat: 12_000,
      withholding: 1_000,
      cgt: 0,
      dst: 0,
      totalTax: 13_000,
    };
    const net = computeNetCommission(100_000, splits, taxes);
    expect(net).toBe(87_000); // 100K - 13K
  });

  it("handles zero gross commission", () => {
    const splits = { brokerShare: 0, agentShare: 0 };
    const taxes = { vat: 0, withholding: 0, cgt: 0, dst: 0, totalTax: 0 };
    const net = computeNetCommission(0, splits, taxes);
    expect(net).toBe(0);
  });
});

// ─── computeFullBreakdown ────────────────────────────────────────────

describe("computeFullBreakdown", () => {
  it("returns a complete CommissionBreakdown for a basic deal", () => {
    const result = computeFullBreakdown({
      dealPrice: 10_000_000,
      dealId: "deal-1",
      dealClientName: "Juan",
    });

    expect(result.dealPrice).toBe(10_000_000);
    expect(result.grossCommission).toBe(300_000); // 10M * 3%
    expect(result.effectiveRate).toBe(3);
    expect(result.brokerShare).toBe(90_000); // 300K * 0.3
    expect(result.agentShare).toBe(210_000); // 300K * 0.7
    expect(result.agent2Share).toBeUndefined();
    expect(result.referralFee).toBeUndefined();
    expect(result.netCommission).toBe(
      300_000 - (36_000 + 3_000 + 600_000 + 150_000),
    );

    expect(result.taxes).toBeDefined();
    expect(result.taxes.vat).toBe(36_000); // 300K * 0.12
    expect(result.taxes.withholding).toBe(3_000); // 300K * 0.01
    expect(result.taxes.cgt).toBe(600_000); // 10M * 0.06
    expect(result.taxes.dst).toBe(150_000); // 10M * 0.015
    expect(result.taxes.totalTax).toBe(789_000);

    // Items: Gross, VAT, Withholding, CGT, DST, Broker, Agent, Net = 8
    expect(result.breakdown).toHaveLength(8);
    // Verify breakdown structure
    expect(result.breakdown[0]).toEqual({
      label: "Gross Commission",
      amount: 300_000,
      type: "gross",
    });
    expect(result.breakdown[result.breakdown.length - 1]).toEqual({
      label: "Net Commission",
      amount: result.netCommission,
      type: "net",
    });
  });

  it("includes referral fee in breakdown when referralPercent is set", () => {
    const splitConfig: CommissionSplitConfig = {
      brokerRate: 0.3,
      agentRate: 0.7,
      referralPercent: 10,
    };
    const result = computeFullBreakdown({
      dealPrice: 5_000_000,
      splitConfig,
    });

    expect(result.referralFee).toBe(15_000); // 150K * 0.1
    // Referral should appear as a deduction in breakdown
    const referralItem = result.breakdown.find(
      (item) => item.label === "Referral Fee",
    );
    expect(referralItem).toBeDefined();
    expect(referralItem!.amount).toBe(15_000);
    expect(referralItem!.type).toBe("deduction");
  });

  it("includes co-broker share when co-broking is enabled", () => {
    const splitConfig: CommissionSplitConfig = {
      brokerRate: 0.3,
      agentRate: 0.7,
      coBroking: {
        enabled: true,
        agent2Id: "agent2",
        agent2Name: "Co-Broker",
        splitPercent: 40,
      },
    };
    const result = computeFullBreakdown({
      dealPrice: 5_000_000,
      splitConfig,
    });

    // gross = 150K. After 40/60 co-broking: A1 = 150K*0.6=90K, A2 = 150K*0.4=60K
    // Broker: 90K*0.3+60K*0.3=45K, A1 net: 90K*0.7=63K, A2 net: 60K*0.7=42K
    expect(result.agentShare).toBeCloseTo(63_000);
    expect(result.agent2Share).toBeCloseTo(42_000);

    const coBrokerItem = result.breakdown.find(
      (item) => item.label === "Co-Broker Share",
    );
    expect(coBrokerItem).toBeDefined();
    expect(coBrokerItem!.amount).toBeCloseTo(42_000);
  });

  it("uses custom commission percent", () => {
    const result = computeFullBreakdown({
      dealPrice: 2_000_000,
      customPercent: 5,
    });

    expect(result.grossCommission).toBe(100_000); // 2M * 5%
    expect(result.effectiveRate).toBe(5);
  });

  it("applies commission plan overrides", () => {
    const plan: CommissionPlan = {
      id: "p1",
      name: "Tiered Plan",
      type: "tiered",
      brokerId: "b1",
      rules: {
        tiers: [
          { minVolume: 0, percent: 2 },
          { minVolume: 10_000_000, percent: 4 },
        ],
      },
      assignedTo: [],
      createdAt: 0,
      updatedAt: 0,
    };
    const result = computeFullBreakdown({
      dealPrice: 15_000_000,
      commissionPlan: plan,
    });

    expect(result.grossCommission).toBe(600_000); // 15M * 4%
    expect(result.effectiveRate).toBe(4);
  });

  it("applies tax options correctly (non-VAT, no CGT, no DST)", () => {
    const result = computeFullBreakdown({
      dealPrice: 5_000_000,
      customPercent: 3,
      taxOptions: {
        isVatRegistered: false,
        includeCgt: false,
        includeDst: false,
      },
    });

    // Gross = 150K, Only withholding applies (1%)
    expect(result.taxes.vat).toBe(0);
    expect(result.taxes.cgt).toBe(0);
    expect(result.taxes.dst).toBe(0);
    expect(result.taxes.withholding).toBe(1_500);
    expect(result.taxes.totalTax).toBe(1_500);

    // Net = 150K - 1500 = 148500
    expect(result.netCommission).toBe(148_500);
  });

  it("handles zero deal price gracefully", () => {
    const result = computeFullBreakdown({
      dealPrice: 0,
    });

    expect(result.dealPrice).toBe(0);
    expect(result.grossCommission).toBe(0);
    expect(result.effectiveRate).toBe(0);
    expect(result.brokerShare).toBe(0);
    expect(result.agentShare).toBe(0);
    expect(result.netCommission).toBe(0);
  });
});

// ─── formatCommissionPercent ─────────────────────────────────────────

describe("formatCommissionPercent", () => {
  it("formats a normal commission as a percentage string", () => {
    expect(formatCommissionPercent(10_000_000, 300_000)).toBe("3.00%");
  });

  it("handles fractional percentages", () => {
    expect(formatCommissionPercent(10_000_000, 150_000)).toBe("1.50%");
  });

  it("handles non-integer percentages", () => {
    // 100000/7000000*100 = 1.428571... → toFixed(2) = "1.43"
    expect(formatCommissionPercent(7_000_000, 100_000)).toBe("1.43%");
  });

  it("returns '0%' when deal price is zero", () => {
    expect(formatCommissionPercent(0, 100_000)).toBe("0%");
  });

  it("returns '0%' when deal price is negative", () => {
    expect(formatCommissionPercent(-100, 5)).toBe("0%");
  });

  it("formats 0% commission correctly", () => {
    expect(formatCommissionPercent(10_000_000, 0)).toBe("0.00%");
  });
});

// ─── getDefaultSplitConfig ───────────────────────────────────────────

describe("getDefaultSplitConfig", () => {
  it("returns default brokerRate and agentRate when called without args", () => {
    const config = getDefaultSplitConfig();
    expect(config.brokerRate).toBe(DEFAULT_BROKER_SPLIT);
    expect(config.agentRate).toBe(DEFAULT_AGENT_SPLIT);
  });

  it("overrides brokerRate when passed as argument", () => {
    const config = getDefaultSplitConfig(0.5);
    expect(config.brokerRate).toBe(0.5);
    expect(config.agentRate).toBe(DEFAULT_AGENT_SPLIT);
  });

  it("overrides both rates when both arguments provided", () => {
    const config = getDefaultSplitConfig(0.4, 0.6);
    expect(config.brokerRate).toBe(0.4);
    expect(config.agentRate).toBe(0.6);
  });

  it("returns a CommissionSplitConfig object with correct types", () => {
    const config = getDefaultSplitConfig();
    // Verify it satisfies the CommissionSplitConfig interface shape
    expect(config).toHaveProperty("brokerRate");
    expect(config).toHaveProperty("agentRate");
    expect(typeof config.brokerRate).toBe("number");
    expect(typeof config.agentRate).toBe("number");
  });
});
