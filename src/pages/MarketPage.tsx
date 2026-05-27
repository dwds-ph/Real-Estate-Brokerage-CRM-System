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
  const { data: listings } = useCollection<Listing>("listings", []);
  const { data: deals } = useCollection<Deal>("deals", []);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const report = useMemo(
    () =>
      computeMarketReport(listings as Listing[], deals as Deal[]),
    [listings, deals],
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "trends", label: "Price Trends" },
    { key: "breakdown", label: "Breakdown" },
    { key: "locations", label: "Locations" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Market Report</h1>
          <p className="text-muted-foreground">
            Analysis based on {report.overview.totalListings} listings and
            brokerage data · Generated{" "}
            {formatDateTime(report.generatedAt)}
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

      {activeTab === "trends" && (
        <PriceTrends trends={report.priceTrends} />
      )}

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
