import { useParams } from "react-router-dom";
import { useDoc, useCollection } from "@/hooks/useFirestore";
import { where } from "firebase/firestore";
import type {
  Lead,
  Deal,
  Payment,
  Tour,
  VaultDocument,
  AppUser,
} from "@/types";
import { formatCurrency, formatDate, timeAgo, cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────

function getLeadStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    contacted:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    viewed:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    negotiating:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    closed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
}

function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    cancelled:
      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  return colors[status] || "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
}

function getTourStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    confirmed:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    "in-progress":
      "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    completed:
      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    cancelled:
      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  };
  return colors[status] || "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
}

function getDealStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    closed:
      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    cancelled:
      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  };
  return colors[status] || "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
}

// ─── Sub-components ─────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  empty,
}: {
  icon: string;
  title: string;
  count?: number;
  empty?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
        {count !== undefined && (
          <span
            className={cn(
              "ml-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
              empty
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary",
            )}
          >
            {count}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground/70">
        {description}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string | React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between py-2", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right ml-4">{value}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ClientPortalPage() {
  const { leadToken } = useParams<{ leadToken: string }>();

  // 1. Load the Lead
  const {
    data: lead,
    loading: leadLoading,
    error: leadError,
  } = useDoc<Lead>("leads", leadToken);

  // 2. Load related Deals (filtered server-side via Firestore query constraints)
  const {
    data: allDeals,
    loading: dealsLoading,
    error: dealsError,
  } = useCollection<Deal>(
    "deals",
    leadToken ? [where("leadId", "==", leadToken)] : [],
  );

  // 3. Load Payments, Tours, and Documents (full collections, filtered client-side)
  const {
    data: allPayments,
    loading: paymentsLoading,
    error: paymentsError,
  } = useCollection<Payment>("payments", []);
  const {
    data: allTours,
    loading: toursLoading,
    error: toursError,
  } = useCollection<Tour>("tours", []);
  const {
    data: allDocuments,
    loading: docsLoading,
    error: docsError,
  } = useCollection<VaultDocument>("vaultDocuments", []);

  // 4. If lead has an assigned agent, load their profile
  const {
    data: agentProfile,
    error: agentError,
  } = useDoc<AppUser>(
    "users",
    lead?.assignedTo,
  );

  const loading =
    leadLoading || dealsLoading || paymentsLoading || toursLoading || docsLoading;

  // ─── Derived data ──────────────────────────────────────────────

  const deals = allDeals || [];
  const payments = allPayments || [];
  const tours = allTours || [];
  const documents = allDocuments || [];

  // A deal is the "active" one (first pending or closed deal)
  const activeDeal = deals.find(
    (d) => d.status === "pending" || d.status === "closed",
  );

  // Payments linked to any deal of this lead
  const dealIds = deals.map((d) => d.id);
  const linkedPayments = payments.filter((p) => dealIds.includes(p.dealId));

  // Tours linked to this lead
  const linkedTours = tours.filter((t) => t.leadId === leadToken);

  // Documents linked to any deal of this lead
  const linkedDocuments = documents.filter(
    (d) => d.dealId && dealIds.includes(d.dealId),
  );

  // Payment summary stats
  const totalPaid = linkedPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = linkedPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = linkedPayments
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  // ─── Loading ───────────────────────────────────────────────────

  if (loading) {
    return <Spinner />;
  }

  // ─── Error ────────────────────────────────────────────────────

  const fetchError = leadError || dealsError || paymentsError || toursError || docsError || agentError;

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md text-center space-y-4 px-6">
          <span className="text-5xl">⚠️</span>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">
            Failed to load portal data: {fetchError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md text-center space-y-4 px-6">
          <span className="text-5xl">🔍</span>
          <h1 className="text-2xl font-bold">Link Not Found</h1>
          <p className="text-muted-foreground">
            This portal link is invalid or has expired. Please contact your real
            estate agent for assistance.
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ── Header Card ──────────────────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
                    🏠
                  </div>
                  <div>
                    <h1 className="text-xl font-bold sm:text-2xl">
                      Welcome, {lead.name}!
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Your personal real estate portal
                    </p>
                  </div>
                </div>

                <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                  {lead.propertyInterest && (
                    <InfoRow
                      label="Property Interest"
                      value={lead.propertyInterest}
                    />
                  )}
                  {lead.budget !== undefined && (
                    <InfoRow
                      label="Budget"
                      value={formatCurrency(lead.budget)}
                    />
                  )}
                  {lead.email && <InfoRow label="Email" value={lead.email} />}
                  {lead.phone && <InfoRow label="Phone" value={lead.phone} />}
                  <InfoRow
                    label="Last Updated"
                    value={timeAgo(lead.updatedAt)}
                  />
                </div>
              </div>

              {/* Status badge */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                    getLeadStatusColor(lead.status),
                  )}
                >
                  {lead.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Deal Status ──────────────────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="p-6 sm:p-8">
            <SectionHeader
              icon="📋"
              title="Deal Status"
              count={deals.length}
              empty={deals.length === 0}
            />

            {deals.length === 0 ? (
              <EmptyState
                icon="🤝"
                title="No deals yet"
                description="Once a deal is created, you'll see its progress and details here."
              />
            ) : activeDeal ? (
              <div className="mt-4 space-y-4">
                {/* Deal progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{activeDeal.clientName}</span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        getDealStatusColor(activeDeal.status),
                      )}
                    >
                      {activeDeal.status}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        activeDeal.status === "closed"
                          ? "bg-green-500"
                          : activeDeal.status === "cancelled"
                            ? "bg-red-400"
                            : "bg-blue-500",
                      )}
                      style={{
                        width:
                          activeDeal.status === "closed"
                            ? "100%"
                            : activeDeal.status === "cancelled"
                              ? "100%"
                              : "60%",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {activeDeal.status === "closed"
                        ? "Completed"
                        : activeDeal.status === "cancelled"
                          ? "Cancelled"
                          : "In Progress"}
                    </span>
                    <span>{formatDate(activeDeal.createdAt)}</span>
                  </div>
                </div>

                {/* Deal details */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  <InfoRow
                    label="Deal Price"
                    value={
                      <span className="font-semibold text-foreground">
                        {formatCurrency(activeDeal.dealPrice)}
                      </span>
                    }
                  />
                  {activeDeal.coBroking?.enabled && (
                    <InfoRow
                      label="Co-Broking"
                      value={
                        <span className="text-xs">
                          With{" "}
                          <span className="font-medium">
                            {activeDeal.coBroking.agent2Name}
                          </span>{" "}
                          ({activeDeal.coBroking.splitPercent}%)
                        </span>
                      }
                    />
                  )}
                  {activeDeal.commission && (
                    <InfoRow
                      label="Commission"
                      value={formatCurrency(activeDeal.commission.total)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{deal.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(deal.dealPrice)} &middot;{" "}
                        {formatDate(deal.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        getDealStatusColor(deal.status),
                      )}
                    >
                      {deal.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Payment Schedule ──────────────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="p-6 sm:p-8">
            <SectionHeader
              icon="💰"
              title="Payment Schedule"
              count={linkedPayments.length}
              empty={linkedPayments.length === 0}
            />

            {linkedPayments.length === 0 ? (
              <EmptyState
                icon="💳"
                title="No payments yet"
                description="Payment schedules will appear here once a deal is in progress."
              />
            ) : (
              <div className="mt-4 space-y-4">
                {/* Payment summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border bg-green-50/50 p-3 text-center dark:bg-green-950/20">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(totalPaid)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-yellow-50/50 p-3 text-center dark:bg-yellow-950/20">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                      {formatCurrency(totalPending)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-red-50/50 p-3 text-center dark:bg-red-950/20">
                    <p className="text-xs text-muted-foreground">Overdue</p>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(totalOverdue)}
                    </p>
                  </div>
                </div>

                {/* Payment list */}
                <div className="space-y-2">
                  {linkedPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {payment.label}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                              getPaymentStatusColor(payment.status),
                            )}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Due {formatDate(payment.dueDate)}
                          {payment.paidDate &&
                            ` · Paid ${formatDate(payment.paidDate)}`}
                        </p>
                      </div>
                      <span className="ml-4 shrink-0 text-sm font-semibold">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tour Schedule ──────────────────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="p-6 sm:p-8">
            <SectionHeader
              icon="🗺️"
              title="Tour Schedule"
              count={linkedTours.length}
              empty={linkedTours.length === 0}
            />

            {linkedTours.length === 0 ? (
              <EmptyState
                icon="📍"
                title="No tours scheduled"
                description="Your agent will schedule property tours here for you to view."
              />
            ) : (
              <div className="mt-4 space-y-3">
                {linkedTours.map((tour) => (
                  <div
                    key={tour.id}
                    className="rounded-xl border p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {tour.title}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                              getTourStatusColor(tour.status),
                            )}
                          >
                            {tour.status}
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            📅 {formatDate(tour.scheduledDate)}
                          </span>
                          <span>
                            🚏 {tour.stops?.length || 0} stop
                            {(tour.stops?.length || 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tour stops preview */}
                    {tour.stops && tour.stops.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t pt-3">
                        {tour.stops.slice(0, 3).map((stop, idx) => (
                          <div
                            key={stop.id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                              {idx + 1}
                            </span>
                            <span className="truncate">
                              {stop.listingTitle}
                            </span>
                            {stop.estimatedDuration && (
                              <span className="shrink-0">
                                ⏱️ {stop.estimatedDuration}min
                              </span>
                            )}
                          </div>
                        ))}
                        {tour.stops.length > 3 && (
                          <p className="text-xs text-muted-foreground/60 pl-7">
                            +{tour.stops.length - 3} more stops
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Shared Documents ──────────────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="p-6 sm:p-8">
            <SectionHeader
              icon="📄"
              title="Shared Documents"
              count={linkedDocuments.length}
              empty={linkedDocuments.length === 0}
            />

            {linkedDocuments.length === 0 ? (
              <EmptyState
                icon="📁"
                title="No shared documents"
                description="Documents related to your property transaction will appear here."
              />
            ) : (
              <div className="mt-4 space-y-2">
                {linkedDocuments.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                      📄
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.category} &middot;{" "}
                        {doc.fileSize
                          ? `${(doc.fileSize / 1024).toFixed(0)} KB`
                          : ""}{" "}
                        &middot; Shared {timeAgo(doc.uploadedAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-muted-foreground">
                      ↗
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Agent Contact ──────────────────────────────────────── */}
        {agentProfile && (
          <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="p-6 sm:p-8">
              <SectionHeader icon="👤" title="Your Agent" />

              <div className="mt-4 flex items-center gap-4 rounded-xl bg-muted/50 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {agentProfile.displayName
                    ? agentProfile.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold">
                    {agentProfile.displayName}
                  </p>
                  {agentProfile.email && (
                    <p className="text-sm text-muted-foreground">
                      {agentProfile.email}
                    </p>
                  )}
                  {agentProfile.phone && (
                    <p className="text-sm text-muted-foreground">
                      {agentProfile.phone}
                    </p>
                  )}
                  {agentProfile.licenseNumber && (
                    <p className="text-xs text-muted-foreground/60">
                      License: {agentProfile.licenseNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────── */}
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} &middot; Powered by Real Estate
          Brokerage CRM
        </p>
      </div>
    </div>
  );
}
