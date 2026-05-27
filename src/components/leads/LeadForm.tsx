import { LeadStatus, LeadSource, LeadScore } from "@/types";

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  score: LeadScore;
  propertyInterest: string;
  budget: string;
  notes: string;
  location: string;
}

export interface LeadFormProps {
  form: LeadFormData;
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string) => void;
  onCancel: () => void;
}

export function LeadForm({
  form,
  editingId,
  onSubmit,
  onChange,
  onCancel,
}: LeadFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="font-semibold">
        {editingId ? "Edit Lead" : "New Lead"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="+63 912 345 6789"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <select
            value={form.source}
            onChange={(e) => onChange("source", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="manual">Manual</option>
            <option value="facebook">Facebook</option>
            <option value="referral">Referral</option>
            <option value="walk-in">Walk-in</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => onChange("status", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="viewed">Viewed</option>
            <option value="negotiating">Negotiating</option>
            <option value="closed">Closed</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Score</label>
          <select
            value={form.score}
            onChange={(e) => onChange("score", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="hot">🔥 Hot</option>
            <option value="warm">👋 Warm</option>
            <option value="cold">❄️ Cold</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Property Interest
          </label>
          <input
            type="text"
            value={form.propertyInterest}
            onChange={(e) => onChange("propertyInterest", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="e.g. 3BR condo in BGC"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Budget (PHP)
          </label>
          <input
            type="number"
            value={form.budget}
            onChange={(e) => onChange("budget", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            rows={2}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {editingId ? "Update" : "Create"} Lead
        </button>
      </div>
    </form>
  );
}
