import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLeads } from "@/hooks/useFirestore";
import { createDoc, updateDocById, deleteDocById } from "@/hooks/useFirestore";
import { Lead, LeadStatus, LeadSource, LeadScore } from "@/types";
import { formatDate, getLeadStatusColor, getScoreColor, cn } from "@/lib/utils";

export default function LeadsPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data: leads, loading } = useLeads(userProfile?.id);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "manual" as LeadSource,
    status: "new" as LeadStatus,
    score: "warm" as LeadScore,
    propertyInterest: "",
    budget: "",
    location: "",
    notes: "",
  });

  const filtered = leads
    .filter((l) => filter === "all" || (l as Lead).status === filter)
    .filter((l) => {
      if (!search) return true;
      const s = search.toLowerCase();
      const lead = l as Lead;
      return (
        lead.name.toLowerCase().includes(s) ||
        lead.phone?.toLowerCase().includes(s) ||
        lead.email?.toLowerCase().includes(s)
      );
    });

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      email: "",
      phone: "",
      source: "manual",
      status: "new",
      score: "warm",
      propertyInterest: "",
      budget: "",
      location: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userProfile) return;
      try {
        const now = Date.now();
        const data = {
          ...form,
          budget: form.budget ? Number(form.budget) : null,
          assignedTo:
            userProfile.role === "broker" ? userProfile.id : userProfile.id,
          createdBy: userProfile.id,
          communicationLog: [],
          activityTimeline: [
            {
              action: "Lead created",
              timestamp: now,
              by: userProfile.displayName,
            },
          ],
        };

        if (editingId) {
          await updateDocById("leads", editingId, data);
        } else {
          await createDoc("leads", data);
        }
        resetForm();
      } catch (err) {
        console.error("Failed to save lead:", err);
      }
    },
    [form, userProfile, editingId, resetForm],
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await deleteDocById("leads", id);
  };

  const editLead = (lead: Lead) => {
    setForm({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source,
      status: lead.status,
      score: lead.score,
      propertyInterest: lead.propertyInterest || "",
      budget: lead.budget?.toString() || "",
      location: lead.location || "",
      notes: lead.notes || "",
    });
    setEditingId(lead.id);
    setShowForm(true);
  };

  const countByStatus = (status: LeadStatus) =>
    leads.filter((l) => (l as Lead).status === status).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">{leads.length} total leads</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? "Cancel" : "+ New Lead"}
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border",
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-muted",
          )}
        >
          All ({leads.length})
        </button>
        {(
          [
            "new",
            "contacted",
            "viewed",
            "negotiating",
            "closed",
            "lost",
          ] as LeadStatus[]
        ).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border capitalize",
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted",
            )}
          >
            {s} ({countByStatus(s)})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search leads by name, phone, or email..."
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-card p-6 space-y-4"
        >
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
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="+63 912 345 6789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) =>
                  setForm({ ...form, source: e.target.value as LeadSource })
                }
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
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as LeadStatus })
                }
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
                onChange={(e) =>
                  setForm({ ...form, score: e.target.value as LeadScore })
                }
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
                onChange={(e) =>
                  setForm({ ...form, propertyInterest: e.target.value })
                }
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
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
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
      )}

      {/* Lead Cards */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          {search
            ? "No leads match your search."
            : "No leads yet. Create your first lead!"}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((l) => {
            const lead = l as Lead;
            return (
              <div
                key={lead.id}
                className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => navigate(`/leads/${lead.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{lead.name}</h3>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          getLeadStatusColor(lead.status),
                        )}
                      >
                        {lead.status}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          getScoreColor(lead.score),
                        )}
                      >
                        {lead.score === "hot"
                          ? "🔥"
                          : lead.score === "warm"
                            ? "👋"
                            : "❄️"}{" "}
                        {lead.score}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {lead.phone && <span>📞 {lead.phone}</span>}
                      {lead.email && <span>📧 {lead.email}</span>}
                      <span>📋 {lead.source}</span>
                      {lead.propertyInterest && (
                        <span>🏠 {lead.propertyInterest}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editLead(lead);
                      }}
                      className="rounded p-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(lead.id);
                      }}
                      className="rounded p-1 text-xs text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
