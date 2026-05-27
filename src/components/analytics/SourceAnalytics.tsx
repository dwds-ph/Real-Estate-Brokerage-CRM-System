import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Lead } from "@/types";

const SOURCE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  facebook: { label: "Facebook", icon: "📘", color: "#1877F2" },
  manual: { label: "Manual", icon: "✍️", color: "#6B7280" },
  referral: { label: "Referral", icon: "🤝", color: "#10B981" },
  "walk-in": { label: "Walk-in", icon: "🚶", color: "#F59E0B" },
};

const SOURCES = ["facebook", "manual", "referral", "walk-in"] as const;

interface SourceAnalyticsProps {
  leads: Lead[];
  loading?: boolean;
}

export default function SourceAnalytics({
  leads,
  loading,
}: SourceAnalyticsProps) {
  const sourceData = useMemo(() => {
    const total = leads.length;
    if (total === 0) return [];

    return SOURCES.map((source) => {
      const sourceLeads = leads.filter((l) => l.source === source);
      const count = sourceLeads.length;
      const closed = sourceLeads.filter((l) => l.status === "closed").length;
      const conversionRate = count > 0 ? Math.round((closed / count) * 100) : 0;
      const config = SOURCE_CONFIG[source];

      return {
        name: config.label,
        icon: config.icon,
        value: count,
        color: config.color,
        closed,
        conversionRate,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  }, [leads]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No lead source data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${percent}%`}
                labelLine
              >
                {sourceData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
                formatter={(value, name) => [`${Number(value)}`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion rate bar chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sourceData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
                formatter={(value: unknown) => [`${value}%`, "Conversion Rate"]}
              />
              <Bar
                dataKey="conversionRate"
                name="Conversion Rate"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              >
                {sourceData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium text-muted-foreground">Source</th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Total Leads
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                % of Total
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Closed Deals
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Conversion Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {sourceData.map((s) => (
              <tr
                key={s.name}
                className="border-b last:border-0 hover:bg-muted/50 transition-colors"
              >
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.icon}</span>
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="py-2 text-right font-semibold">{s.value}</td>
                <td className="py-2 text-right text-muted-foreground">
                  {s.percent}%
                </td>
                <td className="py-2 text-right text-green-600 font-medium">
                  {s.closed}
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.conversionRate}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium">
                      {s.conversionRate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
