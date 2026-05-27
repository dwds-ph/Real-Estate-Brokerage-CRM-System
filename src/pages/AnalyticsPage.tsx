import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { cn } from "@/lib/utils";
import {
  subscribeGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "@/services/goalService";
import {
  computeSourceAnalytics,
  computeGoalProgress,
} from "@/lib/sourceAnalytics";
import type { SourceDealData } from "@/lib/sourceAnalytics";
import {
  LeadSourceAnalytics,
  AgentGoalTracker,
  GoalForm,
  GoalOverview,
  AdvancedAnalytics,
} from "@/components/analytics";
import type { Lead, Deal, AgentGoal, GoalPeriod } from "@/types";

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
  const {
    data: leads,
    loading: leadsLoading,
    error: leadsError,
  } = useCollection<Lead>("leads", []);
  const {
    data: deals,
    loading: dealsLoading,
    error: dealsError,
  } = useCollection<Deal>("deals", []);
  const [goals, setGoals] = useState<AgentGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AgentGoal | null>(null);

  // Convert Deal[] to SourceDealData[] (flatten commission object to number)
  const dealData: SourceDealData[] = deals.map((deal) => ({
    commission: deal.commission?.total ?? 0,
    dealValue: deal.dealPrice,
    createdAt: deal.createdAt,
    status: deal.status,
  }));

  // Goals subscription
  useEffect(() => {
    if (!brokerId) return;
    const unsub = subscribeGoals(brokerId, setGoals);
    return unsub;
  }, [brokerId]);

  // Source analytics
  const sourceAnalytics = computeSourceAnalytics(leads, dealData);

  // Goal progress
  const goalsWithProgress = computeGoalProgress(goals, dealData).map(
    (item) => ({
      goal: item.goal,
      progress: {
        dealsClosed: item.dealsClosed,
        commission: item.commission,
        dealProgress: item.dealProgress,
        commissionProgress: item.commissionProgress,
      },
    }),
  );

  // Flat goal progress for GoalOverview component
  const goalOverviewItems = goalsWithProgress.map((gp) => ({
    goal: gp.goal,
    dealsClosed: gp.progress.dealsClosed,
    commission: gp.progress.commission,
    dealProgress: gp.progress.dealProgress,
    commissionProgress: gp.progress.commissionProgress,
  }));

  const isLoading = leadsLoading || dealsLoading;
  const dataError = leadsError || dealsError;

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

  const handleUpdateGoal = async (
    data: Omit<AgentGoal, "id" | "createdAt" | "updatedAt">,
  ) => {
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
            onSubmit={(data: {
              targetDeals: number;
              targetCommission: number;
              period: GoalPeriod;
              periodStart: number;
              periodEnd: number;
            }) => {
              const fullData: Omit<
                AgentGoal,
                "id" | "createdAt" | "updatedAt"
              > = {
                ...data,
                agentId: userProfile?.id || "",
                agentName: userProfile?.displayName,
                createdBy: userProfile?.id || "",
              };
              if (editingGoal) {
                handleUpdateGoal(fullData);
              } else {
                handleCreateGoal(fullData);
              }
            }}
            onCancel={() => {
              setShowGoalForm(false);
              setEditingGoal(null);
            }}
          />
        </div>
      )}

      {/* Tab Content */}
      <div>
        {dataError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium text-sm">Error loading analytics data</p>
            <p className="text-xs mt-1">{dataError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline"
            >
              Try again
            </button>
          </div>
        ) : isLoading ? (
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
                {leads.length === 0 && dealData.length === 0 ? (
                  <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                    <p className="font-medium">No data yet</p>
                    <p className="text-sm mt-1">
                      Add leads and close deals to see source analytics.
                    </p>
                  </div>
                ) : (
                  <LeadSourceAnalytics analytics={sourceAnalytics} />
                )}
              </div>
            )}

            {/* Goals */}
            {activeTab === "goals" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Agent Goals</h2>
                {goals.length === 0 && !showGoalForm ? (
                  <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                    No goals set yet. Click &quot;+ New Goal&quot; to create
                    one.
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
                {dealData.length === 0 ? (
                  <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                    <p className="font-medium">No deal data yet</p>
                    <p className="text-sm mt-1">
                      Close deals to unlock revenue trends and agent rankings.
                    </p>
                  </div>
                ) : (
                  <AdvancedAnalytics deals={dealData} />
                )}
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
                  {goalOverviewItems.length === 0 ? (
                    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                      <p className="font-medium">No goals set yet</p>
                      <p className="text-sm mt-1">
                        Create goals to track team performance.
                      </p>
                    </div>
                  ) : (
                    <GoalOverview goalsWithProgress={goalOverviewItems} />
                  )}
                </div>

                {/* Goals Summary Cards */}
                {goalsWithProgress.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Total Goals
                      </p>
                      <p className="text-2xl font-bold">
                        {goalsWithProgress.length}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Avg Deal Progress
                      </p>
                      <p className="text-2xl font-bold">
                        {goalsWithProgress.length > 0
                          ? `${Math.round(
                              goalsWithProgress.reduce(
                                (s, gp) => s + gp.progress.dealProgress,
                                0,
                              ) / goalsWithProgress.length,
                            )}%`
                          : "\u2014"}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Avg Commission Progress
                      </p>
                      <p className="text-2xl font-bold">
                        {goalsWithProgress.length > 0
                          ? `${Math.round(
                              goalsWithProgress.reduce(
                                (s, gp) => s + gp.progress.commissionProgress,
                                0,
                              ) / goalsWithProgress.length,
                            )}%`
                          : "\u2014"}
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
