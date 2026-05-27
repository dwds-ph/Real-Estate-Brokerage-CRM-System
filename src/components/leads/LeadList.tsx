import { Lead } from "@/types";
import { cn, formatDate, getScoreColor } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

export interface LeadListProps {
  leads: Lead[];
  loading: boolean;
  search: string;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
}

export function LeadList({
  leads,
  loading,
  search,
  onEdit,
  onDelete,
  onNavigate,
}: LeadListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        {search
          ? "No leads match your search."
          : "No leads yet. Create your first lead!"}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer"
          onClick={() => onNavigate(lead.id)}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{lead.name}</h3>
                <StatusBadge status={lead.status} />
                <span
                  className={cn(
                    "text-xs font-medium",
                    getScoreColor(lead.score),
                  )}
                >
                  {lead.score === "hot"
                    ? "🔥"
                    : lead.score === "warm"
                      ? "👋"
                      : "❄️"}{" "}
                  {lead.score}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {lead.phone && <span>📞 {lead.phone}</span>}
                {lead.email && <span>📧 {lead.email}</span>}
                <span>📋 {lead.source}</span>
                {lead.propertyInterest && (
                  <span>🏠 {lead.propertyInterest}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDate(lead.createdAt)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(lead);
                }}
                className="rounded p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                ✏️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lead.id);
                }}
                className="rounded p-1 text-xs text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
