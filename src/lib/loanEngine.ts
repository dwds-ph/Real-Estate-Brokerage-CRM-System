import type { LoanInput, AmortizationRow, AffordabilityResult } from "@/types";

export function pagibigDefaults() {
  return { rate: 6.0, maxTerm: 30, maxAmount: 6_000_000 };
}

export function bankDefaults(_propertyPrice?: number) {
  return { rate: 7.0, maxTerm: 20 };
}

export function inHouseDefaults() {
  return { rate: 10.0, maxTerm: 15 };
}

export function computeAmortization(input: LoanInput): AmortizationRow[] {
  const principal = input.propertyPrice - input.downPayment;
  if (principal <= 0 || input.loanTerm <= 0 || input.annualRate <= 0) return [];

  const monthlyRate = input.annualRate / 100 / 12;
  const months = input.loanTerm * 12;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

  const rows: AmortizationRow[] = [];
  let balance = principal;
  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const principalPayment = payment - interest;
    balance = Math.max(0, balance - principalPayment);
    rows.push({
      month: m,
      year: Math.ceil(m / 12),
      beginningBalance: m === 1 ? principal : rows[m - 2].endingBalance,
      payment,
      principal: principalPayment,
      interest,
      endingBalance: balance,
    });
    if (balance <= 0) break;
  }
  return rows;
}

export function checkAffordability(input: LoanInput): AffordabilityResult {
  const monthlyPayment = computeAmortization(input)[0]?.payment || 0;
  const grossMonthly = (input.grossIncome || 0) / 12;
  const existingMonthly = (input.existingDebts || 0) / 12;
  const dti = grossMonthly > 0 ? (monthlyPayment + existingMonthly) / grossMonthly : 1;

  const maxPayment = grossMonthly * 0.3;
  const maxLoanAffordable = input.annualRate > 0
    ? (maxPayment * (1 - Math.pow(1 + input.annualRate / 100 / 12, -(input.loanTerm * 12)))) / (input.annualRate / 100 / 12)
    : 0;

  return {
    maxLoanAmount: maxLoanAffordable,
    maxPropertyPrice: maxLoanAffordable + input.downPayment,
    monthlyPayment,
    debtToIncomeRatio: dti,
    isAffordable: dti <= 0.5,
    level: dti <= 0.3 ? "green" : dti <= 0.5 ? "yellow" : "red",
  };
}

export function computeComparison(propertyPrice: number, downPayment: number) {
  const types = [
    { loanType: "pagibig" as const, ...pagibigDefaults() },
    { loanType: "bank" as const, ...bankDefaults() },
    { loanType: "in-house" as const, ...inHouseDefaults() },
  ];

  return types.map((t) => {
    const input: LoanInput = { loanType: t.loanType, propertyPrice, downPayment, loanTerm: t.maxTerm, annualRate: t.rate };
    const schedule = computeAmortization(input);
    const totalPayment = schedule.reduce((s, r) => s + r.payment, 0);
    const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
    return { loanType: t.loanType, rate: t.rate, term: t.maxTerm, monthlyPayment: schedule[0]?.payment || 0, totalPayment, totalInterest, totalCost: totalPayment + downPayment, months: schedule.length };
  });
}
