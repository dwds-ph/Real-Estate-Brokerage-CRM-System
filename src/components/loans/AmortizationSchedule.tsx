import { memo, useMemo, useState } from "react";
import { type AmortizationRow } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  rows: AmortizationRow[];
}

function AmortizationSchedule({ rows }: Props) {
  const [page, setPage] = useState(1);
  const perPage = 12;
  const totalPages = useMemo(
    () => Math.ceil(rows.length / perPage),
    [rows.length],
  );
  const visible = useMemo(
    () => rows.slice(0, page * perPage),
    [rows, page, perPage],
  );

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left">Year</th>
              <th className="px-2 py-1.5 text-left">Month</th>
              <th className="px-2 py-1.5 text-right">Payment</th>
              <th className="px-2 py-1.5 text-right">Principal</th>
              <th className="px-2 py-1.5 text-right">Interest</th>
              <th className="px-2 py-1.5 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr
                key={i}
                className={cn("border-t", i % 2 === 0 && "bg-muted/30")}
              >
                <td className="px-2 py-1">{r.year}</td>
                <td className="px-2 py-1">{r.month}</td>
                <td className="px-2 py-1 text-right font-medium">
                  {formatCurrency(r.payment)}
                </td>
                <td className="px-2 py-1 text-right text-green-600">
                  {formatCurrency(r.principal)}
                </td>
                <td className="px-2 py-1 text-right text-red-500">
                  {formatCurrency(r.interest)}
                </td>
                <td className="px-2 py-1 text-right">
                  {formatCurrency(r.endingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page < totalPages && (
        <button
          onClick={() => setPage(page + 1)}
          className="w-full border-t py-2 text-xs text-primary hover:bg-muted/50"
        >
          Show next 12 months ({rows.length - page * perPage} remaining)
        </button>
      )}
    </div>
  );
}

export default memo(AmortizationSchedule);
