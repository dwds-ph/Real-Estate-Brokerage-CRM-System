import { useState } from "react";
import { type CoBroker } from "@/types";

interface Props {
  brokers: CoBroker[];
  deals: { id: string; title: string }[];
  onSave: (data: { coBrokerId: string; coBrokerName: string; coBrokerBrokerage: string; dealId: string; splitPercentage: number; commissionAmount: number }) => void;
  onCancel: () => void;
}

export default function CoBrokerDealSplit({ brokers, deals, onSave, onCancel }: Props) {
  const [coBrokerId, setCoBrokerId] = useState("");
  const [dealId, setDealId] = useState("");
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [commissionAmount, setCommissionAmount] = useState(0);

  const broker = brokers.find((b) => b.id === coBrokerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker) {return;}
    onSave({
      coBrokerId,
      coBrokerName: broker.name,
      coBrokerBrokerage: broker.brokerage,
      dealId,
      splitPercentage,
      commissionAmount,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-card p-4">
      <h4 className="text-sm font-medium">New Deal Split</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Co-Broker *</label>
          <select value={coBrokerId} onChange={(e) => setCoBrokerId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" required>
            <option value="">Select...</option>
            {brokers.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.brokerage})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Deal *</label>
          <select value={dealId} onChange={(e) => setDealId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" required>
            <option value="">Select...</option>
            {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Split %</label>
          <input type="number" value={splitPercentage} onChange={(e) => setSplitPercentage(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" min={1} max={100} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Commission Amount (₱)</label>
          <input type="number" value={commissionAmount} onChange={(e) => setCommissionAmount(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" min={0} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">Save Split</button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-1.5 text-sm font-medium">Cancel</button>
      </div>
    </form>
  );
}
