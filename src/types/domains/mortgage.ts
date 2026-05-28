export type MortgageStage =
  | "application"
  | "bank-evaluation"
  | "bir-docs"
  | "rod"
  | "loan-release";
export type MortgageStatus = "ongoing" | "approved" | "rejected";

export interface Mortgage {
  id: string;
  dealId: string;
  bankId: string;
  bankName: string;
  loanAmount: number;
  status: MortgageStatus;
  currentStage: MortgageStage;
  stages: {
    key: MortgageStage;
    label: string;
    status: "pending" | "in-progress" | "done";
    startedAt?: number;
    completedAt?: number;
    notes?: string;
  }[];
  createdAt: number;
  updatedAt: number;
}

export interface BankProfile {
  id: string;
  name: string;
  typicalRate: string;
  estimatedTimelineDays: number;
}
