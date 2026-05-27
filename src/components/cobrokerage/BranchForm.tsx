import { useState } from "react";
import { type Branch, type BranchType } from "@/types";

interface Props {
  initial?: Branch;
  agents: { id: string; displayName: string }[];
  onSubmit: (data: { name: string; type: BranchType; address: string; city: string; province: string; phone?: string; email?: string; managerId?: string; isActive: boolean }) => void;
  onCancel: () => void;
}

export default function BranchForm({ initial, agents, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<BranchType>(initial?.type || "branch");
  const [address, setAddress] = useState(initial?.address || "");
  const [city, setCity] = useState(initial?.city || "");
  const [province, setProvince] = useState(initial?.province || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [managerId, setManagerId] = useState(initial?.managerId || "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, type, address, city, province, phone: phone || undefined, email: email || undefined, managerId: managerId || undefined, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value as BranchType)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm">
            <option value="head-office">Head Office</option>
            <option value="branch">Branch</option>
            <option value="satellite">Satellite</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1">Address *</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">City *</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Province *</label>
          <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Phone</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Manager</label>
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm">
            <option value="">Select manager...</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded" />
            Active
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">{initial ? "Update" : "Add"} Branch</button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-1.5 text-sm font-medium">Cancel</button>
      </div>
    </form>
  );
}
