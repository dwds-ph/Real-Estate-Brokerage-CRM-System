import { useAuth } from "@/context/AuthContext";

/**
 * Centralized permission hook for role-based access control.
 * Reflects the roles defined in: src/types/domains/core.ts
 *   "broker" | "agent" | "sub-agent" | "senior-agent" | "compliance-officer" | "admin"
 */
export function usePermissions() {
  const { userProfile } = useAuth();
  const role = userProfile?.role;

  return {
    // ── Role identity checks ──────────────────────────────────────
    isBroker: role === "broker",
    isAdmin: role === "admin",
    isSeniorAgent: role === "senior-agent",
    isAgent: role === "agent",
    isComplianceOfficer: role === "compliance-officer",
    isSubAgent: role === "sub-agent",

    // ── Derived permission flags ──────────────────────────────────
    /** Users who can view all data across the org (broker, admin, senior-agent, compliance-officer) */
    canViewAllData: ["broker", "admin", "senior-agent", "compliance-officer"].includes(role ?? ""),

    /** Users who can manage other users (broker, admin) */
    canManageUsers: ["broker", "admin"].includes(role ?? ""),

    /** Users who can view the audit trail (broker, compliance-officer) */
    canViewAudit: ["broker", "compliance-officer"].includes(role ?? ""),

    /** Users who can manage listings, deals, and other CRUD operations */
    canManageAll: ["broker", "admin", "senior-agent"].includes(role ?? ""),

    /** Users who can create/edit agents (broker, admin) */
    canManageAgents: ["broker", "admin"].includes(role ?? ""),
  };
}
