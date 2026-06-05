import { useState, useMemo } from "react";
import { useCollection } from "@/hooks/useFirestore";
import { Listing, Deal } from "@/types";
import { computeMarketReport } from "@/lib/marketReport";
import {
  MarketOverview,
  PriceTrends,
  PropertyBreakdown,
  LocationAnalysis,
} from "@/components/market";
import { formatDateTime } from "@/lib/utils";

type Tab = "overview" | "trends" | "breakdown" | "locations";

export default function MarketPage() {
  const {
    data: listings,
    loading: listingsLoading,
    error: listingsError,
  } = useCollection<Listing>("listings", []);
  const {
    data: deals,
    loading: dealsLoading,
    error: dealsError,
  } = useCollection<Deal>("deals", []);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const loading = listingsLoading || dealsLoading;
  const error = listingsError || dealsError;

  const report = useMemo(
    () => computeMarketReport(listings as Listing[], deals as Deal[]),
    [listings, deals],
  );

  const hasListings = listings.length > 0;
  const hasDeals = deals.length > 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "trends", label: "Price Trends" },
    { key: "breakdown", label: "Breakdown" },
    { key: "locations", label: "Locations" },
  ];

  // ─── Loading State ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Market Report</h1>
        </div>
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Market Report</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Failed to load market data</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty State ────────────────────────────────────────────────────
  if (!hasListings && !hasDeals) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Market Report</h1>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <p className="text-lg">No market data available</p>
          <p className="mt-2 text-sm">
            Add listings and deals to generate your market report with price
            trends, property breakdowns, and location analysis.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => window.open("/listings/new", "_self")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Add Listing
            </button>
            <button
              onClick={() => window.open("/deals/new", "_self")}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Add Deal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Market Report</h1>
          <p className="text-muted-foreground">
            Analysis based on {report.overview.totalListings} listings and
            brokerage data · Generated {formatDateTime(report.generatedAt)}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <MarketOverview overview={report.overview} />

          <PropertyBreakdown
            propertyTypes={report.propertyTypeBreakdown}
            statusBreakdown={report.statusBreakdown}
          />

          <LocationAnalysis locations={report.locationData} />
        </div>
      )}

      {activeTab === "trends" && <PriceTrends trends={report.priceTrends} />}

      {activeTab === "breakdown" && (
        <PropertyBreakdown
          propertyTypes={report.propertyTypeBreakdown}
          statusBreakdown={report.statusBreakdown}
        />
      )}

      {activeTab === "locations" && (
        <LocationAnalysis locations={report.locationData} />
      )}
    </div>
  );
}
