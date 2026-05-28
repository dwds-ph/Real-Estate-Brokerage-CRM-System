import { useState, useCallback } from "react";

import { useAuth } from "@/context/AuthContext";
import { useLeads, useCollection, updateDocById } from "@/hooks/useFirestore";
import { Lead, LeadStatus, Deal, Mortgage } from "@/types";
import { toast } from "@/components/ui/Toast";

export function useDealsPage() {
  const { userProfile } = useAuth();
  const { data: allLeads, loading } = useLeads(userProfile?.id);
  const { data: allDeals } = useCollection<Deal>("deals");
  const { data: allMortgages } = useCollection<Mortgage>("mortgages");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showMortgageForm, setShowMortgageForm] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | undefined>(
    undefined,
  );
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [checklistDealId, setChecklistDealId] = useState<string | null>(null);

  const isBroker = userProfile?.role === "broker";

  const handleDragStart = (leadId: string) => {
    setDraggingId(leadId);
  };

  const handleDrop = useCallback(
    async (newStatus: LeadStatus) => {
      if (!draggingId) {return;}
      const now = Date.now();
      const lead = allLeads.find((l) => l.id === draggingId) as Lead;
      try {
        await updateDocById("leads", draggingId, {
          status: newStatus,
          activityTimeline: [
            ...(lead?.activityTimeline || []),
            {
              action: `Moved to ${newStatus}`,
              timestamp: now,
              by: userProfile?.displayName || "Unknown",
            },
          ],
        });
        toast("success", "Deal moved", `Moved to ${newStatus}`);
      } catch {
        toast("error", "Failed to move deal");
      }
      setDraggingId(null);
    },
    [draggingId, allLeads, userProfile],
  );

  return {
    allLeads: allLeads as Lead[],
    allDeals,
    allMortgages,
    loading,
    draggingId,
    isBroker,
    showMortgageForm,
    setShowMortgageForm,
    selectedDealId,
    setSelectedDealId,
    checklistExpanded,
    setChecklistExpanded,
    checklistDealId,
    setChecklistDealId,
    handleDragStart,
    handleDrop,
  };
}
