import { type CoBroker } from "@/types";

interface Props {
  brokers: CoBroker[];
  deals: any[];
  onEdit: (b: CoBroker) => void;
  onDelete: (id: string) => void;
  onAddSplit: (broker: CoBroker) => void;
}

export default function CoBrokerList({ brokers, deals, onEdit, onDelete, onAddSplit }: Props) {
  if (brokers.length === 0) return <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No co-brokers yet</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {brokers.map((b) => (
        <div key={b.id} className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.brokerage}</p>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{deals.filter((d) => d.coBrokerId === b.id).length} deals</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {b.phone && <p>📞 {b.phone}</p>}
            {b.email && <p>✉️ {b.email}</p>}
            {b.licenseNumber && <p>🆔 License: {b.licenseNumber}</p>}
            {b.referralFeeRate && <p>💰 Referral fee: {b.referralFeeRate}%</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => onEdit(b)} className="flex-1 rounded border px-2 py-1 text-[10px] font-medium hover:bg-muted">Edit</button>
            <button onClick={() => onAddSplit(b)} className="flex-1 rounded border px-2 py-1 text-[10px] font-medium hover:bg-muted">Add Split</button>
            <button onClick={() => onDelete(b.id)} className="rounded border border-red-200 px-2 py-1 text-[10px] text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
