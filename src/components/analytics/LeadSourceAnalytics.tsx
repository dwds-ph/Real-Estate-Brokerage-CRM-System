import { formatCurrency } from "@/lib/utils";
import { type SourceAnalytics } from "@/types";

interface Props {
  analytics: SourceAnalytics[];
}

export default function LeadSourceAnalytics({ analytics }: Props) {
  const maxLeads = Math.max(...analytics.map((a) => a.leadCount), 1);

  return (
    <div className="space-y-4">
      {analytics.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No lead source data yet</div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h4 className="text-sm font-medium">Leads by Source</h4>
            {analytics.map((a) => (
              <div key={a.source} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize">{a.source.replace("-", " ")}</span>
                  <span className="text-muted-foreground">{a.leadCount} leads</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(a.leadCount / maxLeads) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="px-2 py-1.5 text-left">Source</th>
                  <th className="px-2 py-1.5 text-right">Leads</th>
                  <th className="px-2 py-1.5 text-right">Deals</th>
                  <th className="px-2 py-1.5 text-right">Conv. Rate</th>
                  <th className="px-2 py-1.5 text-right">Avg Value</th>
                  <th className="px-2 py-1.5 text-right">Commission</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((a) => (
                  <tr key={a.source} className="border-t">
                    <td className="px-2 py-1.5 font-medium capitalize">{a.source.replace("-", " ")}</td>
                    <td className="px-2 py-1.5 text-right">{a.leadCount}</td>
                    <td className="px-2 py-1.5 text-right">{a.dealCount}</td>
                    <td className="px-2 py-1.5 text-right">{(a.conversionRate * 100).toFixed(1)}%</td>
                    <td className="px-2 py-1.5 text-right">{formatCurrency(a.avgDealValue)}</td>
                    <td className="px-2 py-1.5 text-right">{formatCurrency(a.totalCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
