import { Lead } from "@/types";
import { formatCurrency, timeAgo, getScoreColor, cn } from "@/lib/utils";

export interface DealCardProps {
  lead: Lead;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onNavigate: (id: string) => void;
}

export function DealCard({
  lead,
  draggingId,
  onDragStart,
  onNavigate,
}: DealCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(lead.id)}
      onClick={() => onNavigate(`/leads/${lead.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate(`/leads/${lead.id}`);
        }
      }}
      className={cn(
        "rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow",
        draggingId === lead.id && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium">{lead.name}</p>
        <span
          className={cn("text-xs font-medium", getScoreColor(lead.score))}
        >
          {lead.score === "hot"
            ? "🔥"
            : lead.score === "warm"
              ? "👋"
              : "❄️"}
        </span>
      </div>
      <div className="space-y-1">
        {lead.propertyInterest && (
          <p className="text-xs text-muted-foreground truncate">
            🏠 {lead.propertyInterest}
          </p>
        )}
        {lead.budget && (
          <p className="text-xs text-muted-foreground">
            💰 {formatCurrency(lead.budget)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">📋 {lead.source}</p>
        <p className="text-xs text-muted-foreground">
          {timeAgo(lead.createdAt)}
        </p>
      </div>
    </div>
  );
}
