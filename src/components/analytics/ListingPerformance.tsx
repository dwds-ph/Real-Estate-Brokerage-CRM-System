import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Listing, Viewing, Deal } from "@/types";

interface ListingPerformanceProps {
  listings: Listing[];
  viewings: Viewing[];
  deals: Deal[];
  loading?: boolean;
}

export default function ListingPerformance({
  listings,
  viewings,
  deals,
  loading,
}: ListingPerformanceProps) {
  const [now] = useState(() => Date.now());
  const data = useMemo(() => {
    return listings
      .map((listing) => {
        const listingViewings = viewings.filter(
          (v) => v.listingId === listing.id,
        );
        const doneViewings = listingViewings.filter((v) => v.status === "done");
        const listingDeals = deals.filter((d) => d.listingId === listing.id);
        const convertedDeal = listingDeals.find((d) => d.status === "closed");

        const daysOnMarket = Math.floor(
          (now - listing.createdAt) / (24 * 60 * 60 * 1000),
        );

        return {
          name:
            listing.title.length > 20
              ? listing.title.substring(0, 20) + "…"
              : listing.title,
          fullTitle: listing.title,
          Views: listing.views || 0,
          Inquiries: listing.inquiries || 0,
          Viewings: doneViewings.length,
          "Days on Market": daysOnMarket,
          Converted: convertedDeal ? 1 : 0,
        };
      })
      .sort((a, b) => b.Views - a.Views);
  }, [listings, viewings, deals, now]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No listing data available
      </div>
    );
  }

  const totalViews = data.reduce((s, d) => s + d.Views, 0);
  const totalInquiries = data.reduce((s, d) => s + d.Inquiries, 0);
  const totalConverted = data.reduce((s, d) => s + d.Converted, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Listings</p>
          <p className="text-2xl font-bold">{listings.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Views</p>
          <p className="text-2xl font-bold">{totalViews}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Inquiries</p>
          <p className="text-2xl font-bold">{totalInquiries}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Converted to Deal</p>
          <p className="text-2xl font-bold text-green-600">{totalConverted}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
              labelFormatter={(label, payload) =>
                payload?.[0]?.payload?.fullTitle || label
              }
            />
            <Legend />
            <Bar
              dataKey="Views"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="Inquiries"
              fill="#F97316"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="Viewings"
              fill="#A855F7"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium text-muted-foreground">
                Listing
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Views
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Inquiries
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Viewings
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Days on Market
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Converted
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr
                key={d.fullTitle}
                className="border-b last:border-0 hover:bg-muted/50 transition-colors"
              >
                <td className="py-2 font-medium">{d.fullTitle}</td>
                <td className="py-2 text-right">{d.Views}</td>
                <td className="py-2 text-right">{d.Inquiries}</td>
                <td className="py-2 text-right">{d.Viewings}</td>
                <td className="py-2 text-right text-muted-foreground">
                  {d["Days on Market"]}d
                </td>
                <td className="py-2 text-right">
                  {d.Converted ? (
                    <span className="text-green-600 font-medium">✓</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
