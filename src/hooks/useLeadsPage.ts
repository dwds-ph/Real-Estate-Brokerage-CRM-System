import { useState, useCallback } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  useLeads,
  useCollection,
  createDoc,
  updateDocById,
  deleteDocById,
} from "@/hooks/useFirestore";
import { autoAssignLead } from "@/services/leadRoutingService";
import { Lead, LeadStatus, LeadSource, LeadScore, AppUser } from "@/types";
import { toast } from "@/components/ui/Toast";

export function useLeadsPage() {
  const { userProfile } = useAuth();
  const { data: leads, loading } = useLeads(userProfile?.id);
  const { data: agents } = useCollection<AppUser>("users");
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
      if (!search) {return true;}
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
      if (!userProfile) {return;}
      try {
        const now = Date.now();
        const data = {
          ...form,
          budget: form.budget ? Number(form.budget) : undefined,
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
          toast("success", "Lead updated", `Updated ${form.name}`);
        } else {
          const newLeadId = await createDoc("leads", data);
          toast("success", "Lead created", `Added ${form.name}`);
          // Auto-assign based on routing rules
          if (newLeadId) {
            await autoAssignLead(newLeadId, data, agents);
          }
        }
        resetForm();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to save lead:", e);
        toast(
          "error",
          "Failed to save lead",
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
    [form, userProfile, editingId, resetForm, agents],
  );

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm("Delete this lead?")) {return;}
    try {
      await deleteDocById("leads", id);
      toast("success", "Lead deleted");
    } catch {
      toast("error", "Failed to delete lead");
    }
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

  return {
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
    leads: leads as Lead[],
    loading,
    agents,
  };
}
