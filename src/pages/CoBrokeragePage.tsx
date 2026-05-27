import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { subscribeCoBrokers, createCoBroker, updateCoBroker, deleteCoBroker, createCoBrokerDeal } from "@/services/coBrokerService";
import { subscribeTeams, createTeam, updateTeam, deleteTeam } from "@/services/teamService";
import { subscribeBranches, createBranch, updateBranch, deleteBranch } from "@/services/branchService";
import { cn } from "@/lib/utils";
import { CoBrokerList, CoBrokerForm, CoBrokerDealSplit, TeamList, TeamForm, TeamDetail, BranchList, BranchForm, BranchDetail } from "@/components/cobrokerage";
import type { CoBroker, AgentTeam, Branch } from "@/types";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TABS = [
  { id: "cobrokers", label: "Co-Brokers", icon: "🤝" },
  { id: "teams", label: "Teams", icon: "👥" },
  { id: "branches", label: "Branches", icon: "🏢" },
];

export default function CoBrokeragePage() {
  const { userProfile } = useAuth();
  const brokerId = userProfile?.brokerId || userProfile?.id;
  const [activeTab, setActiveTab] = useState("cobrokers");

  // Data
  const [brokers, setBrokers] = useState<CoBroker[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [teams, setTeams] = useState<AgentTeam[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const { data: agents } = useCollection<any>("users", brokerId ? [where("brokerId", "==", brokerId)] : []);

  useEffect(() => { if (!brokerId) return; const unsub = onSnapshot(query(collection(db, "deals"), where("brokerId", "==", brokerId), orderBy("createdAt", "desc")), (snap) => setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))); return unsub; }, [brokerId]);
  useEffect(() => { if (!brokerId) return; return subscribeCoBrokers(brokerId, setBrokers); }, [brokerId]);
  useEffect(() => { if (!brokerId) return; return subscribeTeams(brokerId, setTeams); }, [brokerId]);
  useEffect(() => { if (!brokerId) return; return subscribeBranches(brokerId, setBranches); }, [brokerId]);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingBroker, setEditingBroker] = useState<CoBroker | undefined>();
  const [showSplit, setShowSplit] = useState(false);
  const [splitBroker, setSplitBroker] = useState<CoBroker | undefined>();
  const [editingTeam, setEditingTeam] = useState<AgentTeam | undefined>();
  const [editingBranch, setEditingBranch] = useState<Branch | undefined>();
  const [viewingTeam, setViewingTeam] = useState<AgentTeam | null>(null);
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);

  const handleSaveBroker = useCallback(async (data: any) => {
    if (!brokerId || !userProfile) return;
    if (editingBroker) { await updateCoBroker(editingBroker.id, data); } else { await createCoBroker({ ...data, createdBy: userProfile.id, brokerId }); }
    setShowForm(false); setEditingBroker(undefined);
  }, [brokerId, userProfile, editingBroker]);

  const handleSaveTeam = useCallback(async (data: any) => {
    if (!brokerId || !userProfile) return;
    if (editingTeam) { await updateTeam(editingTeam.id, data); } else { await createTeam({ ...data, brokerId }); }
    setEditingTeam(undefined);
  }, [brokerId, userProfile, editingTeam]);

  const handleSaveBranch = useCallback(async (data: any) => {
    if (!brokerId || !userProfile) return;
    if (editingBranch) { await updateBranch(editingBranch.id, data); } else { await createBranch({ ...data, brokerId }); }
    setEditingBranch(undefined);
  }, [brokerId, userProfile, editingBranch]);

  const handleSaveSplit = useCallback(async (data: any) => {
    if (!brokerId || !userProfile) return;
    await createCoBrokerDeal({ ...data, status: "pending", createdBy: userProfile.id, brokerId });
    setShowSplit(false); setSplitBroker(undefined);
  }, [brokerId, userProfile]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Co-Brokerage & Teams</h1>
        <button onClick={() => { setShowForm(true); setEditingBroker(undefined); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">+ New</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn("flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors", activeTab === t.id ? "bg-card shadow-sm" : "text-muted-foreground")}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Co-Brokers Tab */}
      {activeTab === "cobrokers" && (
        <div className="space-y-3">
          {showForm && <CoBrokerForm initial={editingBroker} onSubmit={handleSaveBroker} onCancel={() => { setShowForm(false); setEditingBroker(undefined); }} />}
          {showSplit && splitBroker && <CoBrokerDealSplit brokers={brokers} deals={deals} onSave={handleSaveSplit} onCancel={() => { setShowSplit(false); setSplitBroker(undefined); }} />}
          <CoBrokerList brokers={brokers} deals={deals} onEdit={(b) => { setEditingBroker(b); setShowForm(true); }} onDelete={(id) => deleteCoBroker(id)} onAddSplit={(b) => { setSplitBroker(b); setShowSplit(true); }} />
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === "teams" && (
        <div className="space-y-3">
          {viewingTeam ? (
            <TeamDetail team={viewingTeam} members={(agents || []).filter((a: any) => viewingTeam.memberIds.includes(a.id))} deals={deals} onBack={() => setViewingTeam(null)} />
          ) : (
            <>
              {editingTeam && <TeamForm agents={(agents || []).map((a: any) => ({ id: a.id, displayName: a.displayName }))} initial={editingTeam} onSubmit={handleSaveTeam} onCancel={() => setEditingTeam(undefined)} />}
              <TeamList teams={teams} agents={agents || []} onEdit={(t) => setEditingTeam(t)} onDelete={(id) => deleteTeam(id)} onViewDetail={(t) => setViewingTeam(t)} />
            </>
          )}
        </div>
      )}

      {/* Branches Tab */}
      {activeTab === "branches" && (
        <div className="space-y-3">
          {viewingBranch ? (
            <BranchDetail branch={viewingBranch} agents={agents || []} deals={deals} onBack={() => setViewingBranch(null)} />
          ) : (
            <>
              {editingBranch && <BranchForm initial={editingBranch} agents={(agents || []).map((a: any) => ({ id: a.id, displayName: a.displayName }))} onSubmit={handleSaveBranch} onCancel={() => setEditingBranch(undefined)} />}
              <BranchList branches={branches} onEdit={(b) => setEditingBranch(b)} onDelete={(id) => deleteBranch(id)} onViewDetail={(b) => setViewingBranch(b)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
