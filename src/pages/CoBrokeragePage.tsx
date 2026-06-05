import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import {
  subscribeCoBrokers,
  createCoBroker,
  updateCoBroker,
  deleteCoBroker,
  createCoBrokerDeal,
} from "@/services/coBrokerService";
import {
  subscribeTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "@/services/teamService";
import {
  subscribeBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/services/branchService";
import { cn } from "@/lib/utils";
import {
  CoBrokerList,
  CoBrokerForm,
  CoBrokerDealSplit,
  TeamList,
  TeamForm,
  TeamDetail,
  BranchList,
  BranchForm,
  BranchDetail,
} from "@/components/cobrokerage";
import type { AppUser, CoBroker, AgentTeam, Branch } from "@/types";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
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
  const [deals, setDeals] = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams] = useState<AgentTeam[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedCountRef = useRef(0);
  const { data: agents } = useCollection<AppUser>(
    "users",
    brokerId ? [where("brokerId", "==", brokerId)] : [],
  );

  const trackLoad = useCallback(() => {
    loadedCountRef.current += 1;
    if (loadedCountRef.current >= 4) {setLoading(false);}
  }, []);

  useEffect(() => {
    if (!brokerId) {return;}
    const unsub = onSnapshot(
      query(
        collection(db, "deals"),
        where("brokerId", "==", brokerId),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        trackLoad();
        setError(null);
      },
      (err) => {
        setError(`Failed to load deals: ${  err.message}`);
        trackLoad();
      },
    );
    return unsub;
  }, [brokerId, trackLoad]);
  useEffect(() => {
    if (!brokerId) {return;}
    return subscribeCoBrokers(brokerId, (data) => {
      setBrokers(data);
      trackLoad();
      setError(null);
    });
  }, [brokerId, trackLoad]);
  useEffect(() => {
    if (!brokerId) {return;}
    return subscribeTeams(brokerId, (data) => {
      setTeams(data);
      trackLoad();
      setError(null);
    });
  }, [brokerId, trackLoad]);
  useEffect(() => {
    if (!brokerId) {return;}
    return subscribeBranches(brokerId, (data) => {
      setBranches(data);
      trackLoad();
      setError(null);
    });
  }, [brokerId, trackLoad]);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingBroker, setEditingBroker] = useState<CoBroker | undefined>();
  const [showSplit, setShowSplit] = useState(false);
  const [splitBroker, setSplitBroker] = useState<CoBroker | undefined>();
  const [editingTeam, setEditingTeam] = useState<AgentTeam | undefined>();
  const [editingBranch, setEditingBranch] = useState<Branch | undefined>();
  const [viewingTeam, setViewingTeam] = useState<AgentTeam | null>(null);
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);

  const handleSaveBroker = useCallback(
    async (data: Record<string, unknown>) => {
      if (!brokerId || !userProfile) {return;}
      if (editingBroker) {
        await updateCoBroker(editingBroker.id, data);
      } else {
        await createCoBroker({
          name: "",
          phone: "",
          brokerage: "",
          ...data,
          createdBy: userProfile.id,
          brokerId,
        });
      }
      setShowForm(false);
      setEditingBroker(undefined);
    },
    [brokerId, userProfile, editingBroker],
  );

  const handleSaveTeam = useCallback(
    async (data: Record<string, unknown>) => {
      if (!brokerId || !userProfile) {return;}
      if (editingTeam) {
        await updateTeam(editingTeam.id, data);
      } else {
        await createTeam({
          name: "",
          teamLeadId: "",
          memberIds: [],
          ...data,
          brokerId,
        });
      }
      setEditingTeam(undefined);
    },
    [brokerId, userProfile, editingTeam],
  );

  const handleSaveBranch = useCallback(
    async (data: Record<string, unknown>) => {
      if (!brokerId || !userProfile) {return;}
      if (editingBranch) {
        await updateBranch(editingBranch.id, data);
      } else {
        await createBranch({
          name: "",
          type: "branch",
          address: "",
          city: "",
          province: "",
          isActive: true,
          ...data,
          brokerId,
        });
      }
      setEditingBranch(undefined);
    },
    [brokerId, userProfile, editingBranch],
  );

  const handleSaveSplit = useCallback(
    async (data: Record<string, unknown>) => {
      if (!brokerId || !userProfile) {return;}
      await createCoBrokerDeal({
        dealId: "",
        coBrokerName: "",
        coBrokerBrokerage: "",
        splitPercentage: 0,
        commissionAmount: 0,
        ...data,
        status: "pending",
        createdBy: userProfile.id,
        coBrokerId: splitBroker?.id || "",
      });
      setShowSplit(false);
      setSplitBroker(undefined);
    },
    [brokerId, userProfile, splitBroker],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Co-Brokerage & Teams</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingBroker(undefined);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground self-start sm:self-auto"
        >
          + New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === t.id
                ? "bg-card shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium text-sm">Error loading data</p>
          <p className="text-xs mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Co-Brokers Tab */}
          {activeTab === "cobrokers" && (
            <div className="space-y-3">
              {showForm && (
                <CoBrokerForm
                  initial={editingBroker}
                  onSubmit={handleSaveBroker}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingBroker(undefined);
                  }}
                />
              )}
              {showSplit && splitBroker && (
                <CoBrokerDealSplit
                  brokers={brokers}
                  deals={deals as { id: string; title: string }[]}
                  onSave={handleSaveSplit}
                  onCancel={() => {
                    setShowSplit(false);
                    setSplitBroker(undefined);
                  }}
                />
              )}
              {brokers.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                  <p className="font-medium">No co-brokers yet</p>
                  <p className="text-sm mt-1">
                    Add co-brokers to manage referral splits and partnerships.
                  </p>
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingBroker(undefined);
                    }}
                    className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    + Add Co-Broker
                  </button>
                </div>
              ) : (
                <CoBrokerList
                  brokers={brokers}
                  deals={deals}
                  onEdit={(b) => {
                    setEditingBroker(b);
                    setShowForm(true);
                  }}
                  onDelete={(id) => deleteCoBroker(id)}
                  onAddSplit={(b) => {
                    setSplitBroker(b);
                    setShowSplit(true);
                  }}
                />
              )}
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === "teams" && (
            <div className="space-y-3">
              {viewingTeam ? (
                <TeamDetail
                  team={viewingTeam}
                  members={(agents || []).filter((a: { id: string }) =>
                    viewingTeam.memberIds.includes(a.id),
                  )}
                  deals={deals}
                  onBack={() => setViewingTeam(null)}
                />
              ) : (
                <>
                  {editingTeam && (
                    <TeamForm
                      agents={(agents || []).map(
                        (a: { id: string; displayName?: string }) => ({
                          id: a.id,
                          displayName: a.displayName ?? "",
                        }),
                      )}
                      initial={editingTeam}
                      onSubmit={handleSaveTeam}
                      onCancel={() => setEditingTeam(undefined)}
                    />
                  )}
                  {teams.length === 0 ? (
                    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                      <p className="font-medium">No teams yet</p>
                      <p className="text-sm mt-1">
                        Create teams to organize your agents.
                      </p>
                      <button
                        onClick={() => setEditingTeam({} as AgentTeam)}
                        className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        + Create Team
                      </button>
                    </div>
                  ) : (
                    <TeamList
                      teams={teams}
                      agents={agents || []}
                      onEdit={(t) => setEditingTeam(t)}
                      onDelete={(id) => deleteTeam(id)}
                      onViewDetail={(t) => setViewingTeam(t)}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === "branches" && (
            <div className="space-y-3">
              {viewingBranch ? (
                <BranchDetail
                  branch={viewingBranch}
                  agents={agents || []}
                  deals={deals}
                  onBack={() => setViewingBranch(null)}
                />
              ) : (
                <>
                  {editingBranch && (
                    <BranchForm
                      initial={editingBranch}
                      agents={(agents || []).map(
                        (a: { id: string; displayName?: string }) => ({
                          id: a.id,
                          displayName: a.displayName ?? "",
                        }),
                      )}
                      onSubmit={handleSaveBranch}
                      onCancel={() => setEditingBranch(undefined)}
                    />
                  )}
                  {branches.length === 0 ? (
                    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                      <p className="font-medium">No branches yet</p>
                      <p className="text-sm mt-1">
                        Add branches to organize your office locations.
                      </p>
                      <button
                        onClick={() => setEditingBranch({} as Branch)}
                        className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        + Add Branch
                      </button>
                    </div>
                  ) : (
                    <BranchList
                      branches={branches}
                      onEdit={(b) => setEditingBranch(b)}
                      onDelete={(id) => deleteBranch(id)}
                      onViewDetail={(b) => setViewingBranch(b)}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
