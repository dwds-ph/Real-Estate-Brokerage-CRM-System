import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Payment, type PaymentStatus } from "@/types";

// ─── Real-time listener ─────────────────────────────────────────

export function subscribePaymentsForDeal(
  dealId: string | undefined,
  callback: (payments: Payment[]) => void,
) {
  if (!dealId) return () => {};

  const constraints: QueryConstraint[] = [
    where("dealId", "==", dealId),
    orderBy("dueDate", "asc"),
  ];

  const q = query(collection(db, "payments"), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Payment,
    );
    callback(payments);
  });
}

// ─── CRUD ────────────────────────────────────────────────────────

export async function createPayment(
  dealId: string,
  data: Omit<
    Payment,
    "id" | "dealId" | "createdAt" | "updatedAt" | "status" | "createdBy"
  >,
  userId: string,
) {
  const now = Date.now();
  const isOverdue = now > data.dueDate;
  const docRef = await addDoc(collection(db, "payments"), {
    ...data,
    dealId,
    status: isOverdue
      ? ("overdue" as PaymentStatus)
      : ("pending" as PaymentStatus),
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updatePayment(paymentId: string, data: Partial<Payment>) {
  await updateDoc(doc(db, "payments", paymentId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function markPaymentPaid(
  paymentId: string,
  paidDate?: number,
  receiptUrl?: string,
) {
  await updateDoc(doc(db, "payments", paymentId), {
    status: "paid" as PaymentStatus,
    paidDate: paidDate || Date.now(),
    ...(receiptUrl ? { receiptUrl } : {}),
    updatedAt: Date.now(),
  });
}

export async function deletePayment(paymentId: string) {
  await deleteDoc(doc(db, "payments", paymentId));
}

// ─── Helpers ─────────────────────────────────────────────────────

export function getPaymentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    "reservation-fee": "Reservation Fee",
    "down-payment": "Down Payment",
    equity: "Equity",
    "full-payment": "Full Payment",
    "move-in-fee": "Move-In Fee",
    other: "Other",
  };
  return labels[type] || type;
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function recalculatePaymentStatus(
  payment: Payment,
  now: number = Date.now(),
): PaymentStatus {
  if (payment.status === "paid" || payment.status === "cancelled") {
    return payment.status;
  }
  return now > payment.dueDate ? "overdue" : "pending";
}
