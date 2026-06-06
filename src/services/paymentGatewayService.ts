/**
 * Payment Gateway Service
 *
 * Provides:
 * 1. PayMongo API helpers for creating checkout sessions and checking payment status
 * 2. PaymentTransaction CRUD with real-time subscriptions
 * 3. High-level pay methods for GCash, Maya, and Card
 */
import {
  where,
  orderBy,
  type QueryConstraint,
} from "firebase/firestore";
import {
  subscribeToQuery,
  createDocumentWithUser,
  updateDocument,
  type CreateDataWithUser,
} from "@/lib/firestore";
import {
  type PaymentTransaction,
  type PaymentMethod,
  type PaymentTransactionStatus,
} from "@/types/domains/paymentGateway";

// ─── Constants ─────────────────────────────────────────────────────

const PAYMONGO_API_BASE = "https://api.paymongo.com/v1";
const PAYMONGO_PUBLIC_KEY =
  import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || "";

const PAYMENT_TRANSACTIONS_COLLECTION = "paymentTransactions";

// ─── PayMongo API Helpers ──────────────────────────────────────────

/**
 * Base64-encode the public key for the PayMongo Basic auth header.
 */
function getAuthHeader(): string {
  const encoded = btoa(`${PAYMONGO_PUBLIC_KEY}:`);
  return `Basic ${encoded}`;
}

/**
 * Create a PayMongo checkout session.
 *
 * @param amount - Amount in centavos (PHP). E.g. 50000 = ₱500.00
 * @param description - Description shown on the checkout page
 * @param successUrl - Redirect URL on successful payment
 * @param cancelUrl - Redirect URL on cancelled payment
 * @param paymentMethodTypes - Allowed payment methods (defaults to all)
 */
export async function createCheckoutSession(
  amount: number,
  description: string,
  successUrl: string,
  cancelUrl: string,
  paymentMethodTypes: PaymentMethod[] = [
    "gcash",
    "maya",
    "card",
    "grab_pay",
    "over_the_counter",
  ],
) {
  if (!PAYMONGO_PUBLIC_KEY) {
    throw new Error(
      "PayMongo public key is not configured. Set VITE_PAYMONGO_PUBLIC_KEY in your environment.",
    );
  }

  const response = await fetch(
    `${PAYMONGO_API_BASE}/checkout_sessions`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount,
            currency: "PHP",
            description,
            statement_descriptor: "Real Estate CRM",
            success_url: successUrl,
            cancel_url: cancelUrl,
            payment_method_types: paymentMethodTypes,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `PayMongo API error (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Check the status of a PayMongo payment intent.
 *
 * @param paymentIntentId - The PayMongo payment intent ID (pi_xxx)
 */
export async function checkPaymentStatus(paymentIntentId: string) {
  if (!PAYMONGO_PUBLIC_KEY) {
    throw new Error(
      "PayMongo public key is not configured. Set VITE_PAYMONGO_PUBLIC_KEY in your environment.",
    );
  }

  const response = await fetch(
    `${PAYMONGO_API_BASE}/payment_intents/${paymentIntentId}`,
    {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `PayMongo API error (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();
  return data;
}

// ─── PayMongo Integration Methods ──────────────────────────────────

/**
 * Pay with GCash — creates a PayMongo checkout session for GCash.
 *
 * @param amount - Amount in centavos (PHP)
 * @param description - Description for the payment
 * @param successUrl - Redirect URL on success
 * @param cancelUrl - Redirect URL on cancel
 */
export async function payWithGCash(
  amount: number,
  description: string,
  successUrl: string,
  cancelUrl: string,
) {
  return createCheckoutSession(amount, description, successUrl, cancelUrl, [
    "gcash",
  ]);
}

/**
 * Pay with Maya — creates a PayMongo checkout session for Maya.
 *
 * @param amount - Amount in centavos (PHP)
 * @param description - Description for the payment
 * @param successUrl - Redirect URL on success
 * @param cancelUrl - Redirect URL on cancel
 */
export async function payWithMaya(
  amount: number,
  description: string,
  successUrl: string,
  cancelUrl: string,
) {
  return createCheckoutSession(amount, description, successUrl, cancelUrl, [
    "maya",
  ]);
}

/**
 * Pay with Credit/Debit Card — creates a PayMongo checkout session for card.
 *
 * @param amount - Amount in centavos (PHP)
 * @param description - Description for the payment
 * @param successUrl - Redirect URL on success
 * @param cancelUrl - Redirect URL on cancel
 */
export async function payWithCard(
  amount: number,
  description: string,
  successUrl: string,
  cancelUrl: string,
) {
  return createCheckoutSession(amount, description, successUrl, cancelUrl, [
    "card",
  ]);
}

// ─── PaymentTransaction CRUD ───────────────────────────────────────

/**
 * Create a new PaymentTransaction document.
 *
 * @param data - Transaction data (excluding id, timestamps, createdBy)
 * @param userId - The ID of the user creating the transaction
 * @returns The new document ID
 */
export async function createPaymentTransaction(
  data: CreateDataWithUser<PaymentTransaction>,
  userId: string,
): Promise<string> {
  return createDocumentWithUser<PaymentTransaction>(
    PAYMENT_TRANSACTIONS_COLLECTION,
    data,
    userId,
  );
}

/**
 * Update an existing PaymentTransaction document.
 *
 * @param id - Document ID
 * @param data - Partial transaction data to update
 */
export async function updatePaymentTransaction(
  id: string,
  data: Partial<PaymentTransaction>,
): Promise<void> {
  await updateDocument<PaymentTransaction>(
    PAYMENT_TRANSACTIONS_COLLECTION,
    id,
    data,
  );
}

// ─── Real-time Subscriptions ───────────────────────────────────────

/**
 * Subscribe to payment transactions for a specific deal in real time.
 * Results are ordered by createdAt descending (newest first).
 *
 * @param dealId - The deal ID to filter by
 * @param callback - Called with the array of matching transactions
 * @returns An unsubscribe function
 */
export function subscribePaymentTransactionsForDeal(
  dealId: string,
  callback: (transactions: PaymentTransaction[]) => void,
) {
  const constraints: QueryConstraint[] = [
    where("dealId", "==", dealId),
    orderBy("createdAt", "desc"),
  ];

  return subscribeToQuery<PaymentTransaction>(
    PAYMENT_TRANSACTIONS_COLLECTION,
    constraints,
    callback,
  );
}

/**
 * Subscribe to payment transactions for a specific Payment record in real time.
 * Results are ordered by createdAt descending (newest first).
 *
 * @param paymentId - The payment record ID to filter by
 * @param callback - Called with the array of matching transactions
 * @returns An unsubscribe function
 */
export function subscribePaymentTransactionsForPayment(
  paymentId: string,
  callback: (transactions: PaymentTransaction[]) => void,
) {
  const constraints: QueryConstraint[] = [
    where("paymentId", "==", paymentId),
    orderBy("createdAt", "desc"),
  ];

  return subscribeToQuery<PaymentTransaction>(
    PAYMENT_TRANSACTIONS_COLLECTION,
    constraints,
    callback,
  );
}

/**
 * Mark a payment transaction as paid with an optional receipt URL.
 *
 * @param transactionId - The PaymentTransaction document ID
 * @param receiptUrl - Optional URL of the uploaded receipt
 */
export async function markTransactionPaid(
  transactionId: string,
  receiptUrl?: string,
): Promise<void> {
  const update: Partial<PaymentTransaction> = {
    status: "paid" as PaymentTransactionStatus,
    paidAt: Date.now(),
  };

  if (receiptUrl) {
    update.receiptUrl = receiptUrl;
  }

  await updatePaymentTransaction(transactionId, update);
}

/**
 * Mark a payment transaction as failed with a reason.
 *
 * @param transactionId - The PaymentTransaction document ID
 * @param failureReason - Optional reason for the failure
 */
export async function markTransactionFailed(
  transactionId: string,
  failureReason?: string,
): Promise<void> {
  const update: Partial<PaymentTransaction> = {
    status: "failed" as PaymentTransactionStatus,
    failureReason,
  };

  await updatePaymentTransaction(transactionId, update);
}

/**
 * Mark a payment transaction as refunded.
 *
 * @param transactionId - The PaymentTransaction document ID
 */
export async function markTransactionRefunded(
  transactionId: string,
): Promise<void> {
  await updatePaymentTransaction(transactionId, {
    status: "refunded" as PaymentTransactionStatus,
  });
}
