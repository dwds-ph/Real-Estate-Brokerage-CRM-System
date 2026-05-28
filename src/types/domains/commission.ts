export type CommissionPlanType = "fixed" | "tiered" | "referral" | "escalating";

export interface CommissionPlan {
  id: string;
  name: string;
  type: CommissionPlanType;
  brokerId: string;
  rules: {
    percent?: number;
    tiers?: { minVolume: number; percent: number }[];
    referralFee?: number;
    minVolumeForEscalation?: number;
  };
  assignedTo: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Payout {
  id: string;
  dealId: string;
  agentId: string;
  agentName?: string;
  brokerId: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "cancelled";
  paidAt?: number;
  paidBy?: string;
  approvedAt?: number;
  approvedBy?: string;
  receiptUrl?: string;
  notes?: string;
  dealClientName?: string;
  dealPrice?: number;
  commissionPercent?: number;
  periodLabel?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CommissionSplitConfig {
  brokerRate: number;
  agentRate: number;
  coBroking?: {
    enabled: boolean;
    agent2Id: string;
    agent2Name: string;
    splitPercent: number;
  };
  referralPercent?: number;
  referralName?: string;
}

export interface CommissionBreakdownLineItem {
  label: string;
  amount: number;
  type: "gross" | "deduction" | "tax" | "split" | "net";
}

export interface CommissionBreakdown {
  dealPrice: number;
  grossCommission: number;
  effectiveRate: number;
  brokerShare: number;
  agentShare: number;
  agent2Share?: number;
  referralFee?: number;
  taxes: {
    vat: number;
    withholding: number;
    cgt: number;
    dst: number;
    totalTax: number;
  };
  netCommission: number;
  breakdown: CommissionBreakdownLineItem[];
}

export interface CommissionPeriodSummary {
  period: "week" | "month" | "quarter" | "year";
  label: string;
  totalGrossCommission: number;
  totalNetCommission: number;
  totalDealVolume: number;
  dealCount: number;
  agentShares: Array<{
    agentId: string;
    agentName: string;
    grossCommission: number;
    netCommission: number;
    dealCount: number;
  }>;
}
