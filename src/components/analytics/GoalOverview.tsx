interface Props {
  goalsWithProgress: any[];
}

export default function GoalOverview({ goalsWithProgress }: Props) {
  if (goalsWithProgress.length === 0) {
    return <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No goals set yet</div>;
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted">
          <tr>
            <th className="px-2 py-1.5 text-left">Agent</th>
            <th className="px-2 py-1.5 text-left">Period</th>
            <th className="px-2 py-1.5 text-right">Target</th>
            <th className="px-2 py-1.5 text-right">Actual</th>
            <th className="px-2 py-1.5 text-right">Deals</th>
            <th className="px-2 py-1.5 text-right">Comm. Progress</th>
          </tr>
        </thead>
        <tbody>
          {goalsWithProgress.map((item: any) => (
            <tr key={item.goal.id} className="border-t">
              <td className="px-2 py-1.5 font-medium">{item.goal.agentName || "—"}</td>
              <td className="px-2 py-1.5 capitalize">{item.goal.period}</td>
              <td className="px-2 py-1.5 text-right">{item.goal.targetDeals} deals</td>
              <td className="px-2 py-1.5 text-right font-medium">{item.dealsClosed}</td>
              <td className="px-2 py-1.5 text-right">{Math.round(item.dealProgress * 100)}%</td>
              <td className="px-2 py-1.5 text-right">{Math.round(item.commissionProgress * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
