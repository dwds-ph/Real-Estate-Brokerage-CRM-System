import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { useLeadsPage } from "@/hooks/useLeadsPage";
import { Lead } from "@/types";
import LeadRoutingRules from "@/components/automation/LeadRoutingRules";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadForm } from "@/components/leads/LeadForm";
import { LeadList } from "@/components/leads/LeadList";

export default function LeadsPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const {
    showForm,
    setShowForm,
    editingId,
    filter,
    setFilter,
    search,
    setSearch,
    form,
    setForm,
    filtered,
    countByStatus,
    handleSubmit,
    handleDelete,
    resetForm,
    editLead,
    leads,
    loading,
  } = useLeadsPage();
  const [showRoutingRules, setShowRoutingRules] = useState(false);

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
        {userProfile?.role === "broker" && (
          <button
            onClick={() => setShowRoutingRules(true)}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            🚦 Routing Rules
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <LeadFilters
        filter={filter}
        search={search}
        totalLeads={leads.length}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        countByStatus={countByStatus}
      />

      {/* Form */}
      {showForm && (
        <LeadForm
          form={form}
          editingId={editingId}
          onSubmit={handleSubmit}
          onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
          onCancel={resetForm}
        />
      )}

      {/* Lead Cards */}
      <LeadList
        leads={filtered as Lead[]}
        loading={loading}
        search={search}
        onEdit={editLead}
        onDelete={handleDelete}
        onNavigate={(id) => navigate(`/leads/${id}`)}
      />

      {/* Lead Routing Rules Modal */}
      <LeadRoutingRules
        open={showRoutingRules}
        onClose={() => setShowRoutingRules(false)}
      />
    </div>
  );
}
