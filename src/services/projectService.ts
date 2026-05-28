import { where, orderBy } from "firebase/firestore";
import {
  subscribeToQuery,
  createDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firestore";
import {
  type Project,
  type Unit,
  type PaymentMilestone,
  type ProjectStatus,
} from "@/types";

// ─── Projects: Real-time listeners ──────────────────────────────────

export function subscribeProjects(callback: (projects: Project[]) => void) {
  return subscribeToQuery<Project>(
    COLLECTIONS.PROJECTS,
    [orderBy("createdAt", "desc")],
    callback,
  );
}

export function subscribeProjectsForAgent(
  agentId: string,
  callback: (projects: Project[]) => void,
) {
  return subscribeToQuery<Project>(
    COLLECTIONS.PROJECTS,
    [where("assignedTo", "array-contains", agentId), orderBy("createdAt", "desc")],
    callback,
  );
}

// ─── Projects: CRUD ─────────────────────────────────────────────────

export async function createProject(
  data: Omit<Project, "id" | "createdAt" | "updatedAt">,
) {
  return createDocument<Project>(COLLECTIONS.PROJECTS, data as Omit<Project, "id">);
}

export async function updateProject(projectId: string, data: Partial<Project>) {
  return updateDocument<Project>(COLLECTIONS.PROJECTS, projectId, data);
}

export async function deleteProject(projectId: string) {
  return deleteDocument(COLLECTIONS.PROJECTS, projectId);
}

// ─── Units: Real-time listeners ─────────────────────────────────────

export function subscribeUnits(
  projectId: string,
  callback: (units: Unit[]) => void,
) {
  return subscribeToQuery<Unit>(
    COLLECTIONS.UNITS,
    [where("projectId", "==", projectId), orderBy("block", "asc")],
    callback,
  );
}

export function subscribeUnitsByStatus(
  projectId: string,
  status: string,
  callback: (units: Unit[]) => void,
) {
  return subscribeToQuery<Unit>(
    COLLECTIONS.UNITS,
    [
      where("projectId", "==", projectId),
      where("status", "==", status),
      orderBy("createdAt", "desc"),
    ],
    callback,
  );
}

// ─── Units: CRUD ────────────────────────────────────────────────────

export async function createUnit(
  data: Omit<Unit, "id" | "createdAt" | "updatedAt">,
) {
  return createDocument<Unit>(COLLECTIONS.UNITS, data as Omit<Unit, "id">);
}

export async function updateUnit(unitId: string, data: Partial<Unit>) {
  return updateDocument<Unit>(COLLECTIONS.UNITS, unitId, data);
}

export async function deleteUnit(unitId: string) {
  return deleteDocument(COLLECTIONS.UNITS, unitId);
}

// ─── Payment Milestones: Real-time listeners ────────────────────────

export function subscribeMilestones(
  unitId: string,
  callback: (milestones: PaymentMilestone[]) => void,
) {
  return subscribeToQuery<PaymentMilestone>(
    COLLECTIONS.PAYMENT_MILESTONES,
    [where("unitId", "==", unitId), orderBy("dueDate", "asc")],
    callback,
  );
}

export function subscribeProjectMilestones(
  projectId: string,
  callback: (milestones: PaymentMilestone[]) => void,
) {
  return subscribeToQuery<PaymentMilestone>(
    COLLECTIONS.PAYMENT_MILESTONES,
    [where("projectId", "==", projectId), orderBy("dueDate", "asc")],
    callback,
  );
}

// ─── Payment Milestones: CRUD ───────────────────────────────────────

export async function createMilestone(
  data: Omit<PaymentMilestone, "id" | "createdAt" | "updatedAt">,
) {
  return createDocument<PaymentMilestone>(COLLECTIONS.PAYMENT_MILESTONES, data as Omit<PaymentMilestone, "id">);
}

export async function updateMilestone(
  milestoneId: string,
  data: Partial<PaymentMilestone>,
) {
  return updateDocument<PaymentMilestone>(COLLECTIONS.PAYMENT_MILESTONES, milestoneId, data);
}

export async function deleteMilestone(milestoneId: string) {
  return deleteDocument(COLLECTIONS.PAYMENT_MILESTONES, milestoneId);
}

// ─── Helpers ────────────────────────────────────────────────────────

export function computeProjectStatus(project: Project): string {
  if (project.status === "completed") return "completed";
  if (project.status === "on-hold") return "on-hold";

  const soldUnits = project.totalUnits - project.availableUnits;
  const sellThroughRate =
    project.totalUnits > 0 ? soldUnits / project.totalUnits : 0;

  if (project.status === "pre-selling" && sellThroughRate > 0.7)
    return "pre-selling-high-demand";
  if (sellThroughRate >= 1) return "fully-sold";
  return project.status;
}

export function getUnitStatusColor(status: Unit["status"]): string {
  const colors: Record<string, string> = {
    available:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    reserved:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    sold: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    "under-contract":
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    blocked: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return colors[status] || colors.available;
}

export function getUnitStatusLabel(status: Unit["status"]): string {
  const labels: Record<string, string> = {
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
    "under-contract": "Under Contract",
    blocked: "Blocked",
  };
  return labels[status] || status;
}

export function computePhaseSoldPercentage(phase: {
  totalUnits: number;
  availableUnits: number;
}): number {
  if (phase.totalUnits <= 0) return 0;
  return Math.round(
    ((phase.totalUnits - phase.availableUnits) / phase.totalUnits) * 100,
  );
}

export function getProjectStatusColor(status: ProjectStatus): string {
  const colors: Record<string, string> = {
    "pre-selling":
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    ongoing:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    completed:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    "on-hold":
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  };
  return colors[status] || colors.ongoing;
}

export function getProjectStatusLabel(status: ProjectStatus): string {
  const labels: Record<string, string> = {
    "pre-selling": "Pre-Selling",
    ongoing: "Ongoing",
    completed: "Completed",
    "on-hold": "On Hold",
  };
  return labels[status] || status;
}

export function getMilestoneStatusColor(
  status: PaymentMilestone["status"],
): string {
  const colors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    waived:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  };
  return colors[status] || colors.pending;
}

export function getMilestoneStatusLabel(
  status: PaymentMilestone["status"],
): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    overdue: "Overdue",
    waived: "Waived",
  };
  return labels[status] || status;
}
