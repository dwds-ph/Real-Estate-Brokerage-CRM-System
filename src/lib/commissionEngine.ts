/**
 * Smart Commission Engine
 *
 * PH-specific commission computations:
 * - Gross commission (flat %, tiered, escalating)
 * - Agent-Broker splits
 * - Co-broking splits
 * - Referral fees
 * - BIR taxes (VAT 12%, WT 1-2%, CGT 6%, DST 1.5%)
 * - Net commission after all deductions
 */

import type {
  CommissionPlan,
  CommissionBreakdown,
  CommissionSplitConfig,
} from "@/types";

// ─── Constants ────────────────────────────────────────────────────────

export const BIR_TAX_RATES = {
  /** Value-Added Tax on commission income (if VAT-registered) */
  VAT: 0.12,
  /** Withholding Tax on compensation — 1% for individuals, 2% for corps */
  WITHHOLDING_INDIVIDUAL: 0.01,
  WITHHOLDING_CORPORATE: 0.02,
  /** Capital Gains Tax on sale of real property (seller's cost) */
  CGT: 0.06,
  /** Documentary Stamp Tax on mortgage/loan (1.5% of loan or consideration) */
  DST: 0.015,
} as const;

export const DEFAULT_COMMISSION_PERCENT = 3;
export const DEFAULT_BROKER_SPLIT = 0.3; // 30% broker, 70% agent
export const DEFAULT_AGENT_SPLIT = 0.7;
export const DEFAULT_COBROKING_SPLIT = 0.5; // 50/50 between agents

// ─── Gross Commission ────────────────────────────────────────────────

export function computeGrossCommission(
  dealPrice: number,
  plan?: CommissionPlan | null,
  customPercent?: number,
): number {
  if (plan) {
    switch (plan.type) {
      case "fixed":
        return dealPrice * ((plan.rules.percent ?? DEFAULT_COMMISSION_PERCENT) / 100);
      case "tiered": {
        const tiers = (plan.rules.tiers ?? []).sort((a, b) => a.minVolume - b.minVolume);
        let rate = DEFAULT_COMMISSION_PERCENT;
        for (const tier of tiers) {
          if (dealPrice >= tier.minVolume) {
            rate = tier.percent;
          }
        }
        return dealPrice * (rate / 100);
      }
      case "escalating": {
        const baseRate = plan.rules.percent ?? DEFAULT_COMMISSION_PERCENT;
        const minVol = plan.rules.minVolumeForEscalation ?? 5_000_000;
        const factor = dealPrice >= minVol ? 1.5 : 1.0;
        return dealPrice * ((baseRate * factor) / 100);
      }
      case "referral":
        return dealPrice * ((plan.rules.referralFee ?? DEFAULT_COMMISSION_PERCENT) / 100);
      default:
        return dealPrice * (DEFAULT_COMMISSION_PERCENT / 100);
    }
  }
  return dealPrice * ((customPercent ?? DEFAULT_COMMISSION_PERCENT) / 100);
}

// ─── Split Logic ─────────────────────────────────────────────────────

export interface SplitResult {
  brokerShare: number;
  agentShare: number;
  agent2Share?: number;
  referralFee?: number;
}

export function computeSplits(
  grossCommission: number,
  config?: CommissionSplitConfig | null,
): SplitResult {
  if (!config) {
    return {
      brokerShare: grossCommission * DEFAULT_BROKER_SPLIT,
      agentShare: grossCommission * DEFAULT_AGENT_SPLIT,
    };
  }

  let afterReferral = grossCommission;

  // Referral fee deducted first (paid from gross before splits)
  if (config.referralPercent && config.referralPercent > 0) {
    afterReferral = grossCommission * (1 - config.referralPercent / 100);
  }

  const referralFee = grossCommission - afterReferral;

  // Co-broking: two agents split the after-referral amount
  if (config.coBroking?.enabled && config.coBroking.splitPercent > 0) {
    const agent1Share = afterReferral * (1 - config.coBroking.splitPercent / 100);
    const agent2Share = afterReferral * (config.coBroking.splitPercent / 100);

    // Then apply broker split on each agent's share
    const brokerRate = config.brokerRate ?? DEFAULT_BROKER_SPLIT;
    const brokerShare = agent1Share * brokerRate + agent2Share * brokerRate;

    return {
      brokerShare,
      agentShare: agent1Share * (1 - brokerRate),
      agent2Share: agent2Share * (1 - brokerRate),
      referralFee: referralFee > 0 ? referralFee : undefined,
    };
  }

  // Standard single-agent split
  const brokerRate = config.brokerRate ?? DEFAULT_BROKER_SPLIT;
  const agentRate = config.agentRate ?? DEFAULT_AGENT_SPLIT;
  const totalSplit = brokerRate + agentRate;
  const normalizedBroker = brokerRate / totalSplit;
  const normalizedAgent = agentRate / totalSplit;

  return {
    brokerShare: afterReferral * normalizedBroker,
    agentShare: afterReferral * normalizedAgent,
    referralFee: referralFee > 0 ? referralFee : undefined,
  };
}

// ─── Tax Computations ────────────────────────────────────────────────

export interface TaxResult {
  vat: number;
  withholding: number;
  cgt: number;
  dst: number;
  totalTax: number;
}

export function computeTaxes(
  grossCommission: number,
  dealPrice: number,
  options?: {
    isVatRegistered?: boolean;
    isCorporate?: boolean;
    includeCgt?: boolean;
    includeDst?: boolean;
    loanAmount?: number;
  },
): TaxResult {
  const opts = {
    isVatRegistered: true,
    isCorporate: false,
    includeCgt: true,
    includeDst: true,
    ...options,
  };

  const vat = opts.isVatRegistered
    ? grossCommission * BIR_TAX_RATES.VAT
    : 0;

  const withholding = opts.isCorporate
    ? grossCommission * BIR_TAX_RATES.WITHHOLDING_CORPORATE
    : grossCommission * BIR_TAX_RATES.WITHHOLDING_INDIVIDUAL;

  const cgt = opts.includeCgt ? dealPrice * BIR_TAX_RATES.CGT : 0;

  const dst = opts.includeDst
    ? (opts.loanAmount ?? dealPrice) * BIR_TAX_RATES.DST
    : 0;

  return {
    vat,
    withholding,
    cgt,
    dst,
    totalTax: vat + withholding + cgt + dst,
  };
}

// ─── Net Commission ──────────────────────────────────────────────────

export function computeNetCommission(
  grossCommission: number,
  splits: SplitResult,
  taxes: TaxResult,
): number {
  const totalDeductions =
    taxes.vat +
    taxes.withholding +
    taxes.cgt +
    taxes.dst +
    (splits.referralFee ?? 0);

  return grossCommission - totalDeductions;
}

// ─── Full Breakdown ──────────────────────────────────────────────────

export function computeFullBreakdown(params: {
  dealPrice: number;
  dealId?: string;
  dealClientName?: string;
  commissionPlan?: CommissionPlan | null;
  customPercent?: number;
  splitConfig?: CommissionSplitConfig | null;
  taxOptions?: {
    isVatRegistered?: boolean;
    isCorporate?: boolean;
    includeCgt?: boolean;
    includeDst?: boolean;
    loanAmount?: number;
  };
}): CommissionBreakdown {
  const gross = computeGrossCommission(
    params.dealPrice,
    params.commissionPlan,
    params.customPercent,
  );

  const splits = computeSplits(gross, params.splitConfig);

  const taxes = computeTaxes(gross, params.dealPrice, params.taxOptions);

  const net = computeNetCommission(gross, splits, taxes);

  const effectiveRate = params.dealPrice > 0
    ? (gross / params.dealPrice) * 100
    : 0;

  return {
    dealPrice: params.dealPrice,
    grossCommission: gross,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    brokerShare: splits.brokerShare,
    agentShare: splits.agentShare,
    agent2Share: splits.agent2Share,
    referralFee: splits.referralFee,
    taxes,
    netCommission: net,
    breakdown: [
      { label: "Gross Commission", amount: gross, type: "gross" },
      ...(splits.referralFee
        ? [{ label: "Referral Fee", amount: splits.referralFee, type: "deduction" as const }]
        : []),
      { label: "VAT (12%)", amount: taxes.vat, type: "tax" as const },
      { label: "Withholding Tax", amount: taxes.withholding, type: "tax" as const },
      ...(taxes.cgt > 0
        ? [{ label: "Capital Gains Tax (6%)", amount: taxes.cgt, type: "tax" as const }]
        : []),
      ...(taxes.dst > 0
        ? [{ label: "Documentary Stamp Tax (1.5%)", amount: taxes.dst, type: "tax" as const }]
        : []),
      { label: "Broker Share", amount: splits.brokerShare, type: "split" as const },
      { label: "Agent Share", amount: splits.agentShare, type: "split" as const },
      ...(splits.agent2Share
        ? [{ label: "Co-Broker Share", amount: splits.agent2Share, type: "split" as const }]
        : []),
      { label: "Net Commission", amount: net, type: "net" as const },
    ],
  };
}

// ─── Utility ─────────────────────────────────────────────────────────

export function formatCommissionPercent(dealPrice: number, grossCommission: number): string {
  if (dealPrice <= 0) {return "0%";}
  return `${((grossCommission / dealPrice) * 100).toFixed(2)}%`;
}

export function getDefaultSplitConfig(
  brokerRate?: number,
  agentRate?: number,
): CommissionSplitConfig {
  return {
    brokerRate: brokerRate ?? DEFAULT_BROKER_SPLIT,
    agentRate: agentRate ?? DEFAULT_AGENT_SPLIT,
  };
}
