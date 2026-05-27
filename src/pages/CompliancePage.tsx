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
  const [selectedDealId, setSelectedDealId] = useState("");
  const [activeChecklist, setActiveChecklist] =
    useState<ComplianceChecklistType | null>(null);

  useEffect(() => {
    if (!brokerId) return;
    const unsub = onSnapshot(
      query(
        collection(db, "deals"),
        where("brokerId", "==", brokerId),
        orderBy("createdAt", "desc"),
      ),
      (snap) =>
        setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Deal[]),
    );
    return unsub;
  }, [brokerId]);

  useEffect(() => {
    if (!selectedDealId) return;
    const unsub = subscribeComplianceChecklists(selectedDealId, (itemsList) => {
      setActiveChecklist(itemsList[0] || null);
    });
    return unsub;
  }, [selectedDealId]);

  const handleCreateChecklist = useCallback(async () => {
    if (!selectedDealId || !userProfile) return;
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
      if (!activeChecklist) return;
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
      if (!activeChecklist) return;
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

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium">Deal:</label>
        <select
          value={selectedDealId}
          onChange={(e) => setSelectedDealId(e.target.value)}
          className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Select a deal...</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.clientName}
            </option>
          ))}
        </select>
      </div>

      {selectedDealId && !activeChecklist && (
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
    </div>
  );
}
