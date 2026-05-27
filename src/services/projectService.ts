import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Project, type Unit, type PaymentMilestone } from "@/types";

// ─── Projects: Real-time listeners ──────────────────────────────────

export function subscribeProjects(
  callback: (projects: Project[]) => void,
) {
  const q = query(
    collection(db, "projects"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Project,
    );
    callback(projects);
  });
}

export function subscribeProjectsForAgent(
  agentId: string,
  callback: (projects: Project[]) => void,
) {
  const q = query(
    collection(db, "projects"),
    where("assignedTo", "array-contains", agentId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Project,
    );
    callback(projects);
  });
}

// ─── Projects: CRUD ─────────────────────────────────────────────────

export async function createProject(
  data: Omit<Project, "id" | "createdAt" | "updatedAt">,
) {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "projects"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateProject(projectId: string, data: Partial<Project>) {
  await updateDoc(doc(db, "projects", projectId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteProject(projectId: string) {
  await deleteDoc(doc(db, "projects", projectId));
}

// ─── Units: Real-time listeners ─────────────────────────────────────

export function subscribeUnits(
  projectId: string,
  callback: (units: Unit[]) => void,
) {
  const q = query(
    collection(db, "units"),
    where("projectId", "==", projectId),
    orderBy("block", "asc"),
  );
  return onSnapshot(q, (snapshot) => {
    const units = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Unit,
    );
    callback(units);
  });
}

export function subscribeUnitsByStatus(
  projectId: string,
  status: string,
  callback: (units: Unit[]) => void,
) {
  const q = query(
    collection(db, "units"),
    where("projectId", "==", projectId),
    where("status", "==", status),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const units = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Unit,
    );
    callback(units);
  });
}

// ─── Units: CRUD ────────────────────────────────────────────────────

export async function createUnit(
  data: Omit<Unit, "id" | "createdAt" | "updatedAt">,
) {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "units"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateUnit(unitId: string, data: Partial<Unit>) {
  await updateDoc(doc(db, "units", unitId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteUnit(unitId: string) {
  await deleteDoc(doc(db, "units", unitId));
}

// ─── Payment Milestones: Real-time listeners ────────────────────────

export function subscribeMilestones(
  unitId: string,
  callback: (milestones: PaymentMilestone[]) => void,
) {
  const q = query(
    collection(db, "paymentMilestones"),
    where("unitId", "==", unitId),
    orderBy("dueDate", "asc"),
  );
  return onSnapshot(q, (snapshot) => {
    const milestones = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as PaymentMilestone,
    );
    callback(milestones);
  });
}

export function subscribeProjectMilestones(
  projectId: string,
  callback: (milestones: PaymentMilestone[]) => void,
) {
  const q = query(
    collection(db, "paymentMilestones"),
    where("projectId", "==", projectId),
    orderBy("dueDate", "asc"),
  );
  return onSnapshot(q, (snapshot) => {
    const milestones = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as PaymentMilestone,
    );
    callback(milestones);
  });
}

// ─── Payment Milestones: CRUD ───────────────────────────────────────

export async function createMilestone(
  data: Omit<PaymentMilestone, "id" | "createdAt" | "updatedAt">,
) {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "paymentMilestones"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateMilestone(
  milestoneId: string,
  data: Partial<PaymentMilestone>,
) {
  await updateDoc(doc(db, "paymentMilestones", milestoneId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteMilestone(milestoneId: string) {
  await deleteDoc(doc(db, "paymentMilestones", milestoneId));
}

// ─── Helpers ────────────────────────────────────────────────────────

export function computeProjectStatus(project: Project): string {
  if (project.status === "completed") return "completed";
  if (project.status === "on-hold") return "on-hold";

  const soldUnits = project.totalUnits - project.availableUnits;
  const sellThroughRate = project.totalUnits > 0
    ? soldUnits / project.totalUnits
    : 0;

  if (project.status === "pre-selling" && sellThroughRate > 0.7) return "pre-selling-high-demand";
  if (sellThroughRate >= 1) return "fully-sold";
  return project.status;
}

export function getUnitStatusColor(status: Unit["status"]): string {
  const colors: Record<string, string> = {
    available: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    reserved: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    sold: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    "under-contract": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
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

export function getProjectStatusColor(status: ProjectStatus): string {
  const colors: Record<string, string> = {
    "pre-selling": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    ongoing: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    completed: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    "on-hold": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
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

export function getMilestoneStatusColor(status: PaymentMilestone["status"]): string {
  const colors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    waived: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  };
  return colors[status] || colors.pending;
}

export function getMilestoneStatusLabel(status: PaymentMilestone["status"]): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    overdue: "Overdue",
    waived: "Waived",
  };
  return labels[status] || status;
}
