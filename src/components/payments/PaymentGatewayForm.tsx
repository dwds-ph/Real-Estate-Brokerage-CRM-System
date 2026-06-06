import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  payWithGCash,
  payWithMaya,
  payWithCard,
  createPaymentTransaction,
} from "@/services/paymentGatewayService";
import { type PaymentMethod } from "@/types/domains/paymentGateway";

// ─── Constants ─────────────────────────────────────────────────────

const SUCCESS_URL = `${window.location.origin}/payments/success`;
const CANCEL_URL = `${window.location.origin}/payments/cancel`;

interface PaymentGatewayFormProps {
  dealId: string;
  paymentId?: string;
  brokerId: string;
  amount: number;
  open: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

type PaymentOption = "gcash" | "maya" | "card" | "offline";

interface PaymentOptionConfig {
  key: PaymentOption;
  label: string;
  icon: string;
  description: string;
}

const paymentOptions: PaymentOptionConfig[] = [
  {
    key: "gcash",
    label: "GCash",
    icon: "📱",
    description: "Pay via GCash mobile wallet",
  },
  {
    key: "maya",
    label: "Maya",
    icon: "💳",
    description: "Pay via Maya mobile wallet",
  },
  {
    key: "card",
    label: "Credit / Debit Card",
    icon: "💳",
    description: "Pay via credit or debit card",
  },
  {
    key: "offline",
    label: "Paid Offline (Cash / Transfer)",
    icon: "💰",
    description: "Record an offline cash or bank transfer payment",
  },
];

export default function PaymentGatewayForm({
  dealId,
  paymentId,
  brokerId,
  amount,
  open,
  onClose,
  onSuccess,
}: PaymentGatewayFormProps) {
  const { t } = useTranslation();
  const { userProfile } = useAuth();

  // ── State ──────────────────────────────────────────────────────────
  const [selectedMethod, setSelectedMethod] = useState<PaymentOption | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // ── Reset ──────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setSelectedMethod(null);
    setLoading(false);
    setError(null);
    setReceiptFile(null);
    setNotes("");
    setUploadingReceipt(false);
  }, []);

  // ── Handle Payment Method Selection ───────────────────────────────
  const handleSelectMethod = (method: PaymentOption) => {
    setSelectedMethod(method);
    setError(null);
  };

  // ── Handle Online Payment (GCash, Maya, Card) ────────────────────
  const handleOnlinePayment = async () => {
    if (!selectedMethod || !userProfile?.id || amount <= 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const amountInCentavos = Math.round(amount * 100);
      const description = `Payment for Deal #${dealId}`;

      let paymongoResponse: {
        data: {
          id: string;
          attributes: {
            checkout_url: string;
            payment_intent: { id: string };
            status: string;
          };
        };
      };

      switch (selectedMethod) {
        case "gcash":
          paymongoResponse = await payWithGCash(
            amountInCentavos,
            description,
            SUCCESS_URL,
            CANCEL_URL,
          );
          break;
        case "maya":
          paymongoResponse = await payWithMaya(
            amountInCentavos,
            description,
            SUCCESS_URL,
            CANCEL_URL,
          );
          break;
        case "card":
          paymongoResponse = await payWithCard(
            amountInCentavos,
            description,
            SUCCESS_URL,
            CANCEL_URL,
          );
          break;
        default:
          throw new Error(`Unsupported payment method: ${selectedMethod}`);
      }

      const { id: sessionId, attributes } = paymongoResponse.data;

      // Record the transaction in Firestore
      const transactionId = await createPaymentTransaction(
        {
          dealId,
          paymentId,
          amount,
          currency: "PHP",
          status: "pending",
          paymentMethod: selectedMethod as PaymentMethod,
          gatewayRef: attributes.payment_intent?.id || sessionId,
          checkoutUrl: attributes.checkout_url,
          brokerId,
          notes: notes || undefined,
        },
        userProfile.id,
      );

      // Open the PayMongo checkout in a new tab
      if (attributes.checkout_url) {
        window.open(attributes.checkout_url, "_blank", "noopener,noreferrer");
      }

      onSuccess(transactionId);
      resetForm();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment failed. Please try again.";
      // eslint-disable-next-line no-console
      console.error("Payment error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Offline Payment ────────────────────────────────────────
  const handleOfflinePayment = async () => {
    if (!userProfile?.id || amount <= 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload receipt if provided
      let receiptUrl: string | undefined;
      if (receiptFile) {
        setUploadingReceipt(true);
        try {
          const { uploadFile } = await import("@/hooks/useFirestore");
          receiptUrl = await uploadFile(
            `payments/${dealId}/${Date.now()}_${receiptFile.name}`,
            receiptFile,
          );
        } finally {
          setUploadingReceipt(false);
        }
      }

      const transactionId = await createPaymentTransaction(
        {
          dealId,
          paymentId,
          amount,
          currency: "PHP",
          status: "paid",
          paymentMethod: "over_the_counter",
          paidAt: Date.now(),
          receiptUrl,
          brokerId,
          notes: notes || undefined,
        },
        userProfile.id,
      );

      onSuccess(transactionId);
      resetForm();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to record offline payment. Please try again.";
      // eslint-disable-next-line no-console
      console.error("Offline payment error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Proceed ────────────────────────────────────────────────
  const handleProceed = async () => {
    if (!selectedMethod) {
      return;
    }

    if (selectedMethod === "offline") {
      await handleOfflinePayment();
    } else {
      await handleOnlinePayment();
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  if (!open) {
    return null;
  }

  const isOnlineMethod =
    selectedMethod && selectedMethod !== "offline";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {t("paymentGateway.title", "Payment Gateway")}
          </h3>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Amount Display */}
        <div className="mb-6 p-4 rounded-lg bg-muted text-center">
          <p className="text-sm text-muted-foreground">
            {t("paymentGateway.amount", "Amount Due")}
          </p>
          <p className="text-2xl font-bold mt-1">
            ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Step 1: Select Method */}
        {!selectedMethod && (
          <div>
            <p className="text-sm font-medium mb-3">
              {t("paymentGateway.selectMethod", "Select Payment Method")}
            </p>
            <div className="space-y-2">
              {paymentOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleSelectMethod(option.key)}
                  className="w-full flex items-center gap-3 rounded-lg border bg-background p-3 text-left hover:bg-muted transition-colors"
                >
                  <span className="text-xl">{option.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        `paymentGateway.${option.key}Desc`,
                        option.description,
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Confirmation / Form */}
        {selectedMethod && (
          <div>
            {/* Selected method info */}
            <div className="mb-4 p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {paymentOptions.find((o) => o.key === selectedMethod)?.icon}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {paymentOptions.find((o) => o.key === selectedMethod)
                      ?.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      `paymentGateway.${selectedMethod}Desc`,
                      paymentOptions.find((o) => o.key === selectedMethod)
                        ?.description || "",
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Offline: receipt upload & notes */}
            {selectedMethod === "offline" && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-sm font-medium">
                    {t("paymentGateway.receipt", "Upload Receipt")}
                  </label>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t(
                      "paymentGateway.receiptHint",
                      "Upload proof of payment (optional)",
                    )}
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setReceiptFile(e.target.files?.[0] || null)
                    }
                    className="mt-1 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {t("paymentGateway.notes", "Notes")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder={t("paymentGateway.notesPlaceholder", "Optional notes")}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Online: notes only */}
            {isOnlineMethod && (
              <div className="mb-4">
                <label className="text-sm font-medium">
                  {t("paymentGateway.notes", "Notes")}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={t("paymentGateway.notesPlaceholder", "Optional notes")}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMethod(null)}
                disabled={loading || uploadingReceipt}
                className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                {t("paymentGateway.back", "Back")}
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={loading || uploadingReceipt || amount <= 0}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {uploadingReceipt
                  ? t("paymentGateway.uploading", "Uploading...")
                  : loading
                    ? t("paymentGateway.processing", "Processing...")
                    : selectedMethod === "offline"
                      ? t("paymentGateway.confirmPaid", "Confirm Payment")
                      : t("paymentGateway.payNow", "Pay Now")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
