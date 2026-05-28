import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeComplianceChecklists,
  createChecklist,
  updateChecklist,
  getPHComplianceTemplate,
} from "@/services/complianceService";
import { ComplianceChecklist } from "@/components/documents";
import type {
  ComplianceChecklist as ComplianceChecklistType,
  Deal,
} from "@/types";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CompliancePage() {
  const { userProfile } = useAuth();
  const brokerId = userProfile?.brokerId || userProfile?.id;
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [dealsError, setDealsError] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState("");
  const [activeChecklist, setActiveChecklist] =
    useState<ComplianceChecklistType | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState<string | null>(null);

  useEffect(() => {
    if (!brokerId) {return;}
    setDealsLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setDealsError(null);
    const unsub = onSnapshot(
      query(
        collection(db, "deals"),
        where("brokerId", "==", brokerId),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Deal[]);
        setDealsLoading(false);
      },
      (err) => {
        setDealsError(err.message);
        setDealsLoading(false);
      },
    );
    return unsub;
  }, [brokerId]);

  useEffect(() => {
    if (!selectedDealId) {
      setActiveChecklist(null); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    setChecklistLoading(true);
    setChecklistError(null);
    const unsub = subscribeComplianceChecklists(
      selectedDealId,
      (itemsList) => {
        setActiveChecklist(itemsList[0] || null);
        setChecklistLoading(false);
      },
      (err) => {
        setChecklistError(err);
        setChecklistLoading(false);
      },
    );
    return unsub;
  }, [selectedDealId]);

  const handleCreateChecklist = useCallback(async () => {
    if (!selectedDealId || !userProfile) {return;}
    const deal = deals.find((d) => d.id === selectedDealId);
    const items = getPHComplianceTemplate();
    await createChecklist({
      dealId: selectedDealId,
      dealTitle: deal?.clientName,
      items,
      progress: 0,
      createdBy: userProfile.id,
    });
  }, [selectedDealId, userProfile, deals]);

  const handleToggle = useCallback(
    async (itemId: string) => {
      if (!activeChecklist) {return;}
      const updatedItems = activeChecklist.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? Date.now() : undefined,
              completedBy: !item.completed ? userProfile?.id : undefined,
            }
          : item,
      );
      const completed = updatedItems.filter((i) => i.completed).length;
      const progress = Math.round((completed / updatedItems.length) * 100);
      const updated = { ...activeChecklist, items: updatedItems, progress };
      setActiveChecklist(updated);
      await updateChecklist(activeChecklist.id, {
        items: updatedItems,
        progress,
      });
    },
    [activeChecklist, userProfile],
  );

  const handleUpdateNotes = useCallback(
    async (itemId: string, notes: string) => {
      if (!activeChecklist) {return;}
      const updatedItems = activeChecklist.items.map((item) =>
        item.id === itemId ? { ...item, notes } : item,
      );
      setActiveChecklist({ ...activeChecklist, items: updatedItems });
    },
    [activeChecklist],
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Compliance Checklist</h1>
      <p className="text-sm text-muted-foreground">
        PH-specific deal closing compliance tracking
      </p>

      {dealsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load deals: {dealsError}
        </div>
      )}

      {checklistError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load checklist: {checklistError}
        </div>
      )}

      {dealsLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium">Deal:</label>
            <select
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">Select a deal...</option>
              {deals.length === 0 ? (
                <option value="" disabled>
                  No deals available
                </option>
              ) : (
                deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.clientName}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedDealId && checklistLoading && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {selectedDealId && !checklistLoading && !activeChecklist && (
            <button
              onClick={handleCreateChecklist}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              + Create PH Compliance Checklist
            </button>
          )}

          {activeChecklist && (
            <ComplianceChecklist
              items={activeChecklist.items}
              onToggle={handleToggle}
              onUpdateNotes={handleUpdateNotes}
            />
          )}

          {deals.length === 0 && !dealsLoading && (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No deals yet. Create a deal first to start tracking compliance.
            </div>
          )}
        </>
      )}
    </div>
  );
}
