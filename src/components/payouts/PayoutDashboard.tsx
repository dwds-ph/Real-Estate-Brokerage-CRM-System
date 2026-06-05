import { useState, useEffect, useMemo, useCallback } from "react";
import { type Payout } from "@/types";
import { formatCurrency, formatDate, timeAgo, cn } from "@/lib/utils";
import { getVirtualListStyle } from "@/lib/virtualList";
import {
  subscribePayouts,
  updatePayoutStatus,
  deletePayout,
  bulkUpdatePayoutStatus,
} from "@/services/payoutService";
import { useAuth } from "@/context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────

type TabId = "pending" | "approved" | "paid";

interface PayoutDashboardProps {
  /** Optional override — if not provided, pays out for the current user's brokerId */
  brokerId?: string;
}

// ─── Status badge colours ────────────────────────────────────────

function getPayoutStatusColor(status: Payout["status"]): string {
  const colors: Record<Payout["status"], string> = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };
  return colors[status];
}

// ─── Component ───────────────────────────────────────────────────

export default function PayoutDashboard({ brokerId }: PayoutDashboardProps) {
  const { userProfile } = useAuth();
  const effectiveBrokerId =
    brokerId || userProfile?.brokerId || userProfile?.id;

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "pay";
    ids: string[];
  } | null>(null);

  // ── Subscribe to realtime data ──────────────────────────────────

  useEffect(() => {
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setError(null);
    const unsub = subscribePayouts(
      effectiveBrokerId,
      (data) => {
        setPayouts(data);
        setLoading(false);
      },
      (errMessage) => {
        setError(errMessage);
        setLoading(false);
      },
    );
    return unsub;
  }, [effectiveBrokerId]);

  // ── Derived view ────────────────────────────────────────────────

  const pendingPayouts = useMemo(
    () => payouts.filter((p) => p.status === "pending"),
    [payouts],
  );
  const approvedPayouts = useMemo(
    () => payouts.filter((p) => p.status === "approved"),
    [payouts],
  );
  const paidPayouts = useMemo(
    () => payouts.filter((p) => p.status === "paid"),
    [payouts],
  );

  const visiblePayouts = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return pendingPayouts;
      case "approved":
        return approvedPayouts;
      case "paid":
        return paidPayouts;
    }
  }, [activeTab, pendingPayouts, approvedPayouts, paidPayouts]);

  // ── Summary stats ───────────────────────────────────────────────

  const totalPendingAmount = useMemo(
    () => pendingPayouts.reduce((sum, p) => sum + p.amount, 0),
    [pendingPayouts],
  );
  const totalApprovedAmount = useMemo(
    () => approvedPayouts.reduce((sum, p) => sum + p.amount, 0),
    [approvedPayouts],
  );
  const totalPaidThisPeriod = useMemo(
    () => paidPayouts.reduce((sum, p) => sum + p.amount, 0),
    [paidPayouts],
  );

  // ── Selection helpers ───────────────────────────────────────────

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {next.delete(id);}
      else {next.add(id);}
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === visiblePayouts.length) {return new Set();}
      return new Set(visiblePayouts.map((p) => p.id));
    });
  }, [visiblePayouts]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── Single-action handlers ──────────────────────────────────────

  const handleApprove = useCallback(
    async (payout: Payout) => {
      await updatePayoutStatus(payout.id, "approved", userProfile?.id);
    },
    [userProfile?.id],
  );

  const handleReject = useCallback(
    async (payout: Payout) => {
      await updatePayoutStatus(payout.id, "cancelled", userProfile?.id);
    },
    [userProfile?.id],
  );

  const handleMarkPaid = useCallback(
    async (payout: Payout) => {
      await updatePayoutStatus(payout.id, "paid", userProfile?.id);
    },
    [userProfile?.id],
  );

  const handleDelete = useCallback(async (payoutId: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm("Delete this payout record?")) {return;}
    await deletePayout(payoutId);
  }, []);

  // ── Bulk-action handlers ────────────────────────────────────────

  const handleBulkApprove = useCallback(async () => {
    await bulkUpdatePayoutStatus(
      Array.from(selectedIds),
      "approved",
      userProfile?.id,
    );
    setSelectedIds(new Set());
    setConfirmAction(null);
  }, [selectedIds, userProfile?.id]);

  const handleBulkPay = useCallback(async () => {
    await bulkUpdatePayoutStatus(
      Array.from(selectedIds),
      "paid",
      userProfile?.id,
    );
    setSelectedIds(new Set());
    setConfirmAction(null);
  }, [selectedIds, userProfile?.id]);

  // ── Tabs config ─────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "pending", label: "Pending", count: pendingPayouts.length },
    { id: "approved", label: "Approved", count: approvedPayouts.length },
    { id: "paid", label: "Paid", count: paidPayouts.length },
  ];

  // ── Empty state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-4 animate-pulse"
            >
              <div className="h-3 w-20 bg-muted rounded mb-2" />
              <div className="h-6 w-28 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-4 animate-pulse"
            >
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Failed to load payouts</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Summary Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Pending</p>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {formatCurrency(totalPendingAmount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingPayouts.length} payout
            {pendingPayouts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Approved</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalApprovedAmount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {approvedPayouts.length} payout
            {approvedPayouts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Total Paid This Period
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalPaidThisPeriod)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {paidPayouts.length} payout{paidPayouts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              clearSelection();
            }}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-xs",
                tab.count > 0
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Bulk action bar ─────────────────────────────────────────-- */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <p className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </p>
          <div className="flex items-center gap-2">
            {activeTab === "pending" && (
              <button
                onClick={() =>
                  setConfirmAction({
                    type: "approve",
                    ids: Array.from(selectedIds),
                  })
                }
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Approve All
              </button>
            )}
            {activeTab === "approved" && (
              <button
                onClick={() =>
                  setConfirmAction({
                    type: "pay",
                    ids: Array.from(selectedIds),
                  })
                }
                className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors"
              >
                Mark All Paid
              </button>
            )}
            <button
              onClick={clearSelection}
              className="rounded-md border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Payout rows ─────────────────────────────────────────────- */}
      {visiblePayouts.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {activeTab === "pending" && "No pending payouts."}
          {activeTab === "approved" && "No approved payouts."}
          {activeTab === "paid" && "No paid payouts yet."}
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {/* Select-all header */}
          <div className="flex items-center gap-3 px-1 py-1">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={
                  visiblePayouts.length > 0 &&
                  selectedIds.size === visiblePayouts.length
                }
                onChange={toggleSelectAll}
                className="rounded border-muted-foreground"
              />
              Select all
            </label>
          </div>

          {visiblePayouts.map((payout, index) => {
            const isSelected = selectedIds.has(payout.id);
            return (
              <div
                key={payout.id}
                style={getVirtualListStyle(index, 88)}
                className={cn(
                  "flex items-start justify-between rounded-lg border p-3 transition-colors",
                  isSelected
                    ? "bg-accent/50 border-primary/30"
                    : "bg-card hover:bg-muted/30",
                )}
              >
                {/* Checkbox */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {(activeTab === "pending" || activeTab === "approved") && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(payout.id)}
                      className="mt-1 shrink-0 rounded border-muted-foreground"
                    />
                  )}

                  {/* Payout info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {payout.agentName || "Unknown Agent"}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          getPayoutStatusColor(payout.status),
                        )}
                      >
                        {payout.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {payout.dealClientName
                        ? `Deal: ${payout.dealClientName}`
                        : payout.dealId
                          ? `Deal ID: ${payout.dealId.slice(0, 8)}…`
                          : "No deal linked"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {timeAgo(payout.createdAt)}
                      {payout.periodLabel && ` · ${payout.periodLabel}`}
                    </p>
                    {payout.paidAt && (
                      <p className="text-xs text-muted-foreground">
                        Paid {formatDate(payout.paidAt)}
                      </p>
                    )}
                    {payout.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">
                        {payout.notes}
                      </p>
                    )}
                    {payout.receiptUrl && (
                      <a
                        href={payout.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-0.5 inline-block"
                      >
                        📎 Receipt
                      </a>
                    )}
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(payout.amount)}
                  </span>

                  {/* Action buttons per status */}
                  <div className="flex flex-col gap-1">
                    {payout.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(payout)}
                          className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors"
                          title="Approve"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleReject(payout)}
                          className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors"
                          title="Reject"
                        >
                          ✕
                        </button>
                      </>
                    )}
                    {payout.status === "approved" && (
                      <button
                        onClick={() => handleMarkPaid(payout)}
                        className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors"
                        title="Mark as paid"
                      >
                        💰
                      </button>
                    )}
                    {(payout.status === "cancelled" ||
                      payout.status === "paid") && (
                      <button
                        onClick={() => handleDelete(payout.id)}
                        className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors"
                        title="Delete"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirmation modal ─────────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="mx-4 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg animate-scale-in">
            <h3 className="text-lg font-semibold">
              {confirmAction.type === "approve"
                ? "Bulk Approve Payouts"
                : "Bulk Mark as Paid"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmAction.type === "approve"
                ? `Are you sure you want to approve ${confirmAction.ids.length} pending payout${confirmAction.ids.length !== 1 ? "s" : ""}?`
                : `Are you sure you want to mark ${confirmAction.ids.length} payout${confirmAction.ids.length !== 1 ? "s" : ""} as paid?`}
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  confirmAction.type === "approve"
                    ? handleBulkApprove
                    : handleBulkPay
                }
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
