import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { cn } from "@/lib/utils";
import { subscribeGoals, createGoal, updateGoal, deleteGoal } from "@/services/goalService";
import { computeSourceAnalytics, computeGoalProgress } from "@/lib/sourceAnalytics";
import {
  LeadSourceAnalytics,
  AgentGoalTracker,
  GoalForm,
  GoalOverview,
  AdvancedAnalytics,
} from "@/components/analytics";
import type { Lead, Deal, AgentGoal } from "@/types";

const TABS = [
  { id: "sources", label: "Lead Sources", icon: "📡" },
  { id: "goals", label: "Goals", icon: "🎯" },
  { id: "advanced", label: "Advanced", icon: "📊" },
  { id: "overview", label: "Overview", icon: "📋" },
];

export default function AnalyticsPage() {
  const { userProfile } = useAuth();
  const isBroker = userProfile?.role === "broker";
  const brokerId = userProfile?.brokerId || userProfile?.id;

  const [activeTab, setActiveTab] = useState("sources");

  // Data
  const { data: leads, loading: leadsLoading } = useCollection<Lead>("leads", []);
  const { data: deals, loading: dealsLoading } = useCollection<Deal>("deals", []);
  const [goals, setGoals] = useState<AgentGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AgentGoal | null>(null);

  // Goals subscription
  useEffect(() => {
    if (!brokerId) return;
    const unsub = subscribeGoals(brokerId, setGoals);
    return unsub;
  }, [brokerId]);

  // Source analytics
  const sourceAnalytics = computeSourceAnalytics(leads, deals);

  // Goal progress
  const goalsWithProgress = computeGoalProgress(goals, deals).map((item) => ({
    goal: item.goal,
    progress: {
      dealsClosed: item.dealsClosed,
      commission: item.commission,
      dealProgress: item.dealProgress,
      commissionProgress: item.commissionProgress,
    },
  }));

  const isLoading = leadsLoading || dealsLoading;

  // Goal CRUD handlers
  const handleCreateGoal = async (
    data: Omit<AgentGoal, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (!userProfile || !brokerId) return;
    await createGoal({
      ...data,
      createdBy: brokerId,
    });
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const handleUpdateGoal = async (data: any) => {
    if (!editingGoal || !userProfile) return;
    await updateGoal(editingGoal.id, {
      ...data,
      updatedAt: Date.now(),
    });
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm("Delete this goal?")) return;
    await deleteGoal(goalId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">
            Lead source performance, agent goals, and revenue analytics
          </p>
        </div>
        {(activeTab === "goals" || activeTab === "overview") && isBroker && (
          <button
            onClick={() => {
              setEditingGoal(null);
              setShowGoalForm(!showGoalForm);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showGoalForm ? "✕ Close" : "+ New Goal"}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Goal Form (shown on Goals and Overview tabs) */}
      {(activeTab === "goals" || activeTab === "overview") && showGoalForm && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-3">
            {editingGoal ? "Edit Goal" : "Create New Goal"}
          </h3>
          <GoalForm
            initial={editingGoal || undefined}
            onSubmit={(data: any) => (editingGoal ? handleUpdateGoal(data) : handleCreateGoal({ ...data, agentId: userProfile?.id || "", agentName: userProfile?.displayName, createdBy: userProfile?.id || "" }))}
            onCancel={() => {
              setShowGoalForm(false);
              setEditingGoal(null);
            }}
          />
        </div>
      )}

      {/* Tab Content */}
      <div>
        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Lead Sources */}
            {activeTab === "sources" && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Lead Source Analytics
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Conversion performance by acquisition channel
                </p>
                <LeadSourceAnalytics analytics={sourceAnalytics} />
              </div>
            )}

            {/* Goals */}
            {activeTab === "goals" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Agent Goals</h2>
                {goals.length === 0 && !showGoalForm ? (
                  <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                    No goals set yet. Click "+ New Goal" to create one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goalsWithProgress.map(({ goal, progress }) => (
                      <div key={goal.id} className="relative group">
                        <AgentGoalTracker goal={goal} progress={progress} />
                        {isBroker && (
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingGoal(goal);
                                setShowGoalForm(true);
                              }}
                              className="rounded bg-muted/80 px-2 py-1 text-[10px] font-medium hover:bg-muted"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="rounded bg-red-100 text-red-600 px-2 py-1 text-[10px] font-medium hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                            >
                              Del
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Advanced */}
            {activeTab === "advanced" && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Advanced Analytics
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Revenue trends, agent rankings, and period comparisons
                </p>
                <AdvancedAnalytics deals={deals} />
              </div>
            )}

            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Team Goals Overview
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Agent performance vs targets
                  </p>
                  <GoalOverview goalsWithProgress={goalsWithProgress} />
                </div>

                {/* Goals Summary Cards */}
                {goalsWithProgress.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">Total Goals</p>
                      <p className="text-2xl font-bold">{goalsWithProgress.length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">Avg Deal Progress</p>
                      <p className="text-2xl font-bold">
                        {goalsWithProgress.length > 0
                          ? `${Math.round(
                              goalsWithProgress.reduce(
                                (s, gp) => s + gp.progress.dealProgress,
                                0,
                              ) / goalsWithProgress.length,
                            )}%`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">Avg Commission Progress</p>
                      <p className="text-2xl font-bold">
                        {goalsWithProgress.length > 0
                          ? `${Math.round(
                              goalsWithProgress.reduce(
                                (s, gp) => s + gp.progress.commissionProgress,
                                0,
                              ) / goalsWithProgress.length,
                            )}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
