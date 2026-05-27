import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Lead } from "@/types";
import { cn } from "@/lib/utils";

const FUNNEL_STAGES = [
  "new",
  "contacted",
  "viewed",
  "negotiating",
  "closed",
] as const;

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  viewed: "Viewed",
  negotiating: "Negotiating",
  closed: "Closed",
};

const STAGE_COLORS: Record<string, string> = {
  new: "#3B82F6",
  contacted: "#EAB308",
  viewed: "#A855F7",
  negotiating: "#F97316",
  closed: "#22C55E",
};

interface ConversionFunnelProps {
  leads: Lead[];
  isLoading?: boolean;
}

export default function ConversionFunnel({
  leads,
  isLoading,
}: ConversionFunnelProps) {
  const funnelData = useMemo(() => {
    const total = leads.length;
    if (total === 0) return [];

    return FUNNEL_STAGES.map((stage, index) => {
      const count = leads.filter((l) => l.status === stage).length;
      const previousCount =
        index > 0
          ? leads.filter((l) => l.status === FUNNEL_STAGES[index - 1]).length
          : total;
      const dropOff =
        previousCount > 0
          ? Math.round(((previousCount - count) / previousCount) * 100)
          : 0;

      return {
        stage: STAGE_LABELS[stage],
        count,
        fill: STAGE_COLORS[stage],
        dropOff: index > 0 ? `${dropOff}% drop` : "",
      };
    });
  }, [leads]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No leads data available for funnel analysis
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={funnelData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="stage"
              tick={{ fontSize: 13, fontWeight: 500 }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
              formatter={(value) => [value, "Leads"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={60}>
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: "13px", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Drop-off table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium text-muted-foreground">
                Stage Transition
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Count
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Drop-off
              </th>
            </tr>
          </thead>
          <tbody>
            {funnelData.map((item, index) => {
              const prevCount =
                index > 0 ? funnelData[index - 1].count : leads.length;
              const retention =
                prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 0;
              return (
                <tr key={item.stage} className="border-b last:border-0">
                  <td className="py-2 flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ background: item.fill }}
                    />
                    <span className="font-medium">{item.stage}</span>
                  </td>
                  <td className="py-2 text-right font-semibold">
                    {item.count}
                  </td>
                  <td className="py-2 text-right">
                    {index > 0 ? (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          retention < 50
                            ? "text-red-500"
                            : retention < 80
                              ? "text-yellow-500"
                              : "text-green-500",
                        )}
                      >
                        {item.dropOff} (retention: {retention}%)
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
