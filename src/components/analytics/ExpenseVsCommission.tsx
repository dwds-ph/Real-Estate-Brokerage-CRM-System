import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Expense, Deal, AppUser } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ExpenseVsCommissionProps {
  expenses: Expense[];
  deals: Deal[];
  agents: AppUser[];
  dateRange: { from: string; to: string };
  loading?: boolean;
  isBroker?: boolean;
  currentUserId?: string;
}

export default function ExpenseVsCommission({
  expenses,
  deals,
  agents,
  dateRange,
  loading,
  isBroker,
  currentUserId,
}: ExpenseVsCommissionProps) {
  const data = useMemo(() => {
    const fromTs = new Date(dateRange.from).getTime();
    const toTs = new Date(dateRange.to + "T23:59:59").getTime();

    // Filter by date range
    const filteredExpenses = expenses.filter(
      (e) => e.date >= fromTs && e.date <= toTs,
    );
    const filteredDeals = deals.filter(
      (d) =>
        d.status === "closed" && d.createdAt >= fromTs && d.createdAt <= toTs,
    );

    const agentMap = new Map<string, AppUser>();
    agents.forEach((a) => agentMap.set(a.id, a));

    const agentData = new Map<
      string,
      { expenses: number; commission: number; name: string }
    >();

    filteredExpenses.forEach((e) => {
      const agent = agentMap.get(e.agentId);
      if (!agent) return;
      if (!isBroker && e.agentId !== currentUserId) return;

      if (!agentData.has(e.agentId)) {
        agentData.set(e.agentId, {
          expenses: 0,
          commission: 0,
          name: agent.displayName,
        });
      }
      agentData.get(e.agentId)!.expenses += e.amount;
    });

    filteredDeals.forEach((d) => {
      const agentId = d.createdBy;
      const agent = agentMap.get(agentId);
      if (!agent) return;
      if (!isBroker && agentId !== currentUserId) return;

      if (!agentData.has(agentId)) {
        agentData.set(agentId, {
          expenses: 0,
          commission: 0,
          name: agent.displayName,
        });
      }
      agentData.get(agentId)!.commission +=
        d.commission?.agentShare || d.dealPrice * 0.03 * 0.5;
    });

    return Array.from(agentData.values()).map((d) => ({
      name: d.name,
      Expenses: Math.round(d.expenses * 100) / 100,
      Commission: Math.round(d.commission * 100) / 100,
      Net: Math.round((d.commission - d.expenses) * 100) / 100,
    }));
  }, [expenses, deals, agents, dateRange, isBroker, currentUserId]);

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
        No expense or commission data found for the selected period
      </div>
    );
  }

  const totalExpenses = data.reduce((s, d) => s + d.Expenses, 0);
  const totalCommission = data.reduce((s, d) => s + d.Commission, 0);
  const totalNet = data.reduce((s, d) => s + d.Net, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Commission</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalCommission)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Net Profit/Loss</p>
          <p
            className={`text-2xl font-bold ${totalNet >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(totalNet)}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
              formatter={(value) => [formatCurrency(Number(value)), undefined]}
            />
            <Legend />
            <Bar
              dataKey="Expenses"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="Commission"
              fill="#22C55E"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-agent breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium text-muted-foreground">Agent</th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Expenses
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Commission
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                Net
              </th>
              <th className="pb-2 font-medium text-muted-foreground text-right">
                ROI
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const roi =
                d.Expenses > 0
                  ? (((d.Commission - d.Expenses) / d.Expenses) * 100).toFixed(
                      0,
                    )
                  : "∞";
              return (
                <tr key={d.name} className="border-b last:border-0">
                  <td className="py-2 font-medium">{d.name}</td>
                  <td className="py-2 text-right text-red-600">
                    {formatCurrency(d.Expenses)}
                  </td>
                  <td className="py-2 text-right text-green-600">
                    {formatCurrency(d.Commission)}
                  </td>
                  <td
                    className={`py-2 text-right font-medium ${d.Net >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(d.Net)}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        Number(roi) >= 0
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {roi}%
                    </span>
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
