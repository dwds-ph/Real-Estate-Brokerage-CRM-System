export type PaymentType =
  | "reservation-fee"
  | "down-payment"
  | "equity"
  | "full-payment"
  | "move-in-fee"
  | "other";

export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface Payment {
  id: string;
  dealId: string;
  type: PaymentType;
  label: string;
  amount: number;
  dueDate: number;
  paidDate?: number;
  status: PaymentStatus;
  receiptUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentMilestone {
  id: string;
  projectId: string;
  unitId: string;
  name: string;
  amount: number;
  dueDate: number;
  paidDate?: number;
  status: "pending" | "paid" | "overdue" | "waived";
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
