/**
 * Commission calculation engine (client-side).
 * Raw deal data is the source of truth — calculations are for display/reference.
 */

export interface CommissionInput {
  dealPrice: number;
  commissionPercent: number;
  /** For co-broking: what percent goes to the other agent (50 = 50%) */
  coBrokingSplit?: number;
  /** For tiered splits: which tier applies */
  tier?: { minVolume: number; percent: number };
  /** For referral fee */
  referralFee?: number;
  /** Current volume this month (for escalating tiers) */
  currentVolume?: number;
}

export interface CommissionBreakdown {
  grossCommission: number;
  vat: number;
  withholdingTax: number;
  netCommission: number;
  brokerShare: number;
  agentShare: number;
  agent2Share: number;
  totalDeductions: number;
}

export function calcGrossCommission(dealPrice: number, percent: number): number {
  return dealPrice * (percent / 100);
}

export function calcVat(amount: number): number {
  return amount * 0.12;
}

export function calcWithholdingTax(amount: number): number {
  return amount * 0.01;
}

export function calcCapitalGainsTax(dealPrice: number): number {
  return dealPrice * 0.06;
}

export function calcDocumentaryStampTax(dealPrice: number): number {
  return dealPrice * 0.015;
}

export function calcCreditableWithholding(dealPrice: number): number {
  return dealPrice * 0.01;
}

export function calculateFullCommission(input: CommissionInput): CommissionBreakdown {
  const gross = calcGrossCommission(input.dealPrice, input.commissionPercent);
  const vat = calcVat(gross);
  const withholding = calcWithholdingTax(gross);
  const net = gross - vat - withholding;

  const totalDeductions = vat + withholding;

  // Default: broker and agent share evenly after deductions
  let brokerShare = net * 0.5;
  let agentShare = net * 0.5;
  let agent2Share = 0;

  if (input.coBrokingSplit) {
    // Co-broking: split the agent share with another agent
    agentShare = net * (1 - input.coBrokingSplit / 100);
    agent2Share = net * (input.coBrokingSplit / 100);
  }

  if (input.referralFee) {
    // Referral fee: fixed amount
    agentShare = net - input.referralFee;
    brokerShare = input.referralFee;
  }

  return {
    grossCommission: gross,
    vat,
    withholdingTax: withholding,
    netCommission: net,
    brokerShare,
    agentShare,
    agent2Share,
    totalDeductions,
  };
}

/**
 * Pag-IBIG monthly amortization: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calcMonthlyAmortization(
  loanAmount: number,
  annualRate: number,
  termYears: number
): number {
  if (loanAmount <= 0 || termYears <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  if (monthlyRate <= 0) return loanAmount / numPayments;
  return (
    loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}
