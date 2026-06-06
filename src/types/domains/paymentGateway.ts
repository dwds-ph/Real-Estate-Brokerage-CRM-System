/**
 * Payment Gateway types for PayMongo integration and offline payment tracking.
 */

export type PaymentTransactionStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentMethod =
  | "gcash"
  | "maya"
  | "card"
  | "grab_pay"
  | "over_the_counter";

export interface PaymentTransaction {
  id: string;
  dealId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  paymentMethod: PaymentMethod;
  gatewayRef?: string;
  checkoutUrl?: string;
  paidAt?: number;
  failureReason?: string;
  receiptUrl?: string;
  notes?: string;
  brokerId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentGatewayConfig {
  id: string;
  publicKey: string;
  secretKey: string;
  enabled: boolean;
  brokerId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
