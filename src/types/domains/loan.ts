export type LoanType = "pagibig" | "bank" | "in-house";

export interface LoanInput {
  loanType: LoanType;
  propertyPrice: number;
  downPayment: number;
  loanTerm: number; // years
  annualRate: number; // percentage
  grossIncome?: number;
  existingDebts?: number;
  pagibigTier?: string;
}

export interface AmortizationRow {
  month: number;
  year: number;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
}

export interface AffordabilityResult {
  maxLoanAmount: number;
  maxPropertyPrice: number;
  monthlyPayment: number;
  debtToIncomeRatio: number;
  isAffordable: boolean;
  level: "green" | "yellow" | "red";
}
