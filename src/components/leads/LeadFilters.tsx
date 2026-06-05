import { LeadStatus } from "@/types";
import { cn } from "@/lib/utils";

export interface LeadFiltersProps {
  filter: LeadStatus | "all";
  search: string;
  totalLeads: number;
  onFilterChange: (filter: LeadStatus | "all") => void;
  onSearchChange: (search: string) => void;
  countByStatus: (status: LeadStatus) => number;
}

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "viewed",
  "negotiating",
  "closed",
  "lost",
];

export function LeadFilters({
  filter,
  search,
  totalLeads,
  onFilterChange,
  onSearchChange,
  countByStatus,
}: LeadFiltersProps) {
  return (
    <>
      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border",
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-muted",
          )}
        >
          All ({totalLeads})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border capitalize",
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted",
            )}
          >
            {s} ({countByStatus(s)})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search leads by name, phone, or email..."
        aria-label="Search leads by name, phone, or email"
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />
    </>
  );
}
