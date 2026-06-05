export type AuditAction = "created" | "updated" | "deleted";

export interface AuditLogEntry {
  id: string;
  orgId: string;
  collection: string;
  docId: string;
  action: AuditAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: number;
  metadata?: {
    ip?: string;
    userAgent?: string;
  };
}
