import { LeadStatus } from "@/types";
import { cn, getLeadStatusColor } from "@/lib/utils";

export interface StatusBadgeProps {
  status: LeadStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium animate-badge-pulse",
        getLeadStatusColor(status),
      )}
    >
      {status}
    </span>
  );
}
