import { Lead, LeadStatus } from "@/types";
import { cn } from "@/lib/utils";
import { DealCard } from "./DealCard";

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "New", color: "border-t-blue-500" },
  { status: "contacted", label: "Contacted", color: "border-t-yellow-500" },
  { status: "viewed", label: "Viewed", color: "border-t-purple-500" },
  { status: "negotiating", label: "Negotiating", color: "border-t-orange-500" },
  { status: "closed", label: "Closed", color: "border-t-green-500" },
  { status: "lost", label: "Lost", color: "border-t-red-500" },
];

export interface DealKanbanProps {
  allLeads: Lead[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDrop: (status: LeadStatus) => void;
  onNavigate: (path: string) => void;
}

export function DealKanban({
  allLeads,
  draggingId,
  onDragStart,
  onDrop,
  onNavigate,
}: DealKanbanProps) {
  const getLeadsByStatus = (status: LeadStatus) =>
    allLeads.filter((l) => l.status === status);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
      {COLUMNS.map((col) => {
        const columnLeads = getLeadsByStatus(col.status);
        return (
          <div
            key={col.status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col.status)}
            className={cn(
              "rounded-lg border bg-card/50 min-h-[400px] flex flex-col",
              col.color,
              "border-t-2",
            )}
          >
            {/* Column Header */}
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold capitalize">
                  {col.label}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {columnLeads.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {columnLeads.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted-foreground">
                    Drop leads here
                  </p>
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <DealCard
                    key={lead.id}
                    lead={lead}
                    draggingId={draggingId}
                    onDragStart={onDragStart}
                    onNavigate={onNavigate}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
