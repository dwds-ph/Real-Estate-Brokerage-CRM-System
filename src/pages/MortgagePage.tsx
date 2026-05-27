import { useState, useMemo } from "react";
import { useCollection, deleteDocById } from "@/hooks/useFirestore";
import { Mortgage, MortgageStatus } from "@/types";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import MortgageTracker from "@/components/mortgage/MortgageTracker";
import MortgageForm from "@/components/mortgage/MortgageForm";

type StatusFilter = MortgageStatus | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string; color: string }[] =
  [
    { value: "all", label: "All", color: "" },
    {
      value: "ongoing",
      label: "Ongoing",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
    },
    {
      value: "approved",
      label: "Approved",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
    },
    {
      value: "rejected",
      label: "Rejected",
      color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
    },
  ];

export default function MortgagePage() {
  const {
    data: allMortgages,
    loading,
    error,
  } = useCollection<Mortgage>("mortgages");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filtered mortgages
  const mortgages = useMemo(() => {
    if (statusFilter === "all") return allMortgages;
    return allMortgages.filter((m) => m.status === statusFilter);
  }, [allMortgages, statusFilter]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: allMortgages.length,
      ongoing: allMortgages.filter((m) => m.status === "ongoing").length,
      approved: allMortgages.filter((m) => m.status === "approved").length,
      rejected: allMortgages.filter((m) => m.status === "rejected").length,
    };
  }, [allMortgages]);

  const handleDelete = async (mortgageId: string) => {
    if (!window.confirm("Delete this mortgage record? This cannot be undone."))
      return;
    setDeleting(mortgageId);
    try {
      await deleteDocById("mortgages", mortgageId);
    } catch {
      alert("Failed to delete mortgage");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🏦 Mortgage Tracker</h1>
          <p className="text-muted-foreground">
            {counts.all} mortgage{counts.all !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Mortgage
        </button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {f.label}
            <span className="ml-1.5 opacity-70">({counts[f.value]})</span>
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUS_FILTERS.filter((f) => f.value !== "all").map((f) => (
          <div
            key={f.value}
            className="rounded-lg border bg-card p-4 text-center"
          >
            <p className="text-2xl font-bold">{counts[f.value]}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {f.label}
            </p>
          </div>
        ))}
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-bold">
            {allMortgages.reduce(
              (sum, m) => sum + (m.status === "approved" ? 1 : 0),
              0,
            )}
          </p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          Failed to load mortgages: {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && mortgages.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-muted-foreground">
          <span className="text-5xl mb-4">🏦</span>
          <p className="text-lg font-medium">
            {statusFilter === "all"
              ? "No mortgages tracked yet"
              : `No ${statusFilter} mortgages`}
          </p>
          <p className="text-sm mt-1">
            {statusFilter === "all"
              ? "Add a mortgage to start tracking bank loan progress."
              : "Try changing the filter."}
          </p>
          {statusFilter === "all" && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              + New Mortgage
            </button>
          )}
        </div>
      )}

      {/* Mortgage List */}
      {!loading && !error && mortgages.length > 0 && (
        <div className="space-y-3">
          {mortgages.map((mortgage) => {
            const isExpanded = expandedId === mortgage.id;
            return (
              <div
                key={mortgage.id}
                className="rounded-lg border bg-card overflow-hidden"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : mortgage.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">🏦</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {mortgage.bankName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Deal:{" "}
                        {mortgage.dealId ? mortgage.dealId.slice(0, 8) : "N/A"}
                        ...
                        {" · "}
                        {formatCurrency(mortgage.loanAmount)}
                        {" · "}
                        {timeAgo(mortgage.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        mortgage.status === "ongoing" &&
                          "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
                        mortgage.status === "approved" &&
                          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
                        mortgage.status === "rejected" &&
                          "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
                      )}
                    >
                      {mortgage.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Stage {STAGE_INDICES[mortgage.currentStage] + 1}/5
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t px-4 py-4">
                    <MortgageTracker
                      mortgage={mortgage}
                      onUpdate={() => {
                        // Force re-render by toggling expanded
                        setExpandedId(null);
                        setTimeout(() => setExpandedId(mortgage.id), 0);
                      }}
                    />

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
                      <button
                        onClick={() => handleDelete(mortgage.id)}
                        disabled={deleting === mortgage.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50"
                      >
                        {deleting === mortgage.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <MortgageForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          // Refresh handled by real-time listener
        }}
      />
    </div>
  );
}

// Helper to get stage indices without importing STAGE_ORDER in a static context
const STAGE_INDICES: Record<string, number> = {
  application: 0,
  "bank-evaluation": 1,
  "bir-docs": 2,
  rod: 3,
  "loan-release": 4,
};
