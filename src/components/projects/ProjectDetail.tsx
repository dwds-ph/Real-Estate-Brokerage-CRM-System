import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Unit } from "@/types";
import {
  getProjectStatusColor,
  getProjectStatusLabel,
  subscribeUnits,
} from "@/services/projectService";
import { formatCurrency } from "@/lib/utils";
import { useCollection } from "@/hooks/useFirestore";
import PhaseCard from "./PhaseCard";
import UnitCard from "./UnitCard";
import PaymentMilestoneTracker from "./PaymentMilestoneTracker";

type Tab = "phases" | "units" | "milestones";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: projects } = useCollection<Project>("projects", []);
  const project = projects.find((p) => p.id === id);

  const [units, setUnits] = useState<Unit[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("phases");

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeUnits(id, (data) => setUnits(data));
    return () => unsub();
  }, [id]);

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Project not found</p>
      </div>
    );
  }

  const sellThrough = project.totalUnits > 0
    ? Math.round(((project.totalUnits - project.availableUnits) / project.totalUnits) * 100)
    : 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "phases", label: "Phases" },
    { key: "units", label: `Units (${units.length})` },
    { key: "milestones", label: "Milestones" },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/projects")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Projects
      </button>

      {/* Header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                {getProjectStatusLabel(project.status)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {project.developer} · {project.location.city}, {project.location.province}
              {project.developerContact && ` · ${project.developerContact}`}
            </p>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-2xl font-bold">{project.totalUnits}</p>
            <p className="text-xs text-muted-foreground">Total Units</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-2xl font-bold text-green-600">{project.availableUnits}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-2xl font-bold">{project.phases.length}</p>
            <p className="text-xs text-muted-foreground">Phases</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-2xl font-bold">{sellThrough}%</p>
            <p className="text-xs text-muted-foreground">Sell-Through</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-2xl font-bold">
              {project.priceRange.min > 0 ? formatCurrency(project.priceRange.min) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Starting Price</p>
          </div>
        </div>

        {/* Sell-through bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Sell-through Progress</span>
            <span>{sellThrough}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(sellThrough, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "phases" && (
        <div className="space-y-3">
          {project.phases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No phases defined.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {project.phases.map((phase) => (
                <PhaseCard key={phase.id} phase={phase} />
              ))}
            </div>
          )}
          {project.amenities.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-1">
                {project.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "units" && (
        <div className="space-y-3">
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground">No units registered yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="space-y-3">
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground">No units with milestones.</p>
          ) : (
            units.filter((u) => u.status !== "available").map((unit) => (
              <div key={unit.id} className="rounded-lg border bg-card p-4">
                <h3 className="text-sm font-semibold mb-2">
                  {unit.block}-{unit.lot} — {unit.buyerName || "No buyer"}
                </h3>
                <PaymentMilestoneTracker unitId={unit.id} compact />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
