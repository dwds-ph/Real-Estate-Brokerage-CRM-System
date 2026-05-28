export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  assignedName?: string;
  createdBy: string;
  createdByName?: string;
  dueDate?: number;
  brokerId: string;
  checklist?: ChecklistItem[];
  relatedTo?: {
    type: "lead" | "deal" | "listing" | "project";
    id: string;
    title?: string;
  };
  tags?: string[];
  recurring?: "none" | "daily" | "weekly" | "monthly";
  createdAt: number;
  updatedAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export type ActivityType =
  | "call"
  | "meeting"
  | "email"
  | "note"
  | "status_change"
  | "task"
  | "tour"
  | "document";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  leadId?: string;
  dealId?: string;
  listingId?: string;
  createdBy: string;
  createdByName?: string;
  duration?: number;
  createdAt: number;
}

export interface CallLog {
  id: string;
  leadId?: string;
  dealId?: string;
  contactName: string;
  contactPhone?: string;
  duration: number;
  notes?: string;
  followUpDate?: number;
  createdBy: string;
  createdByName?: string;
  createdAt: number;
}
