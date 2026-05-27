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
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type License, type LicenseStatus, type LicenseType } from "@/types";

// ─── Real-time listeners ────────────────────────────────────────────

export function subscribeLicensesForAgent(
  agentId: string | undefined,
  callback: (licenses: License[]) => void,
) {
  if (!agentId) return () => {};

  const q = query(
    collection(db, "licenses"),
    where("agentId", "==", agentId),
    orderBy("expiryDate", "asc"),
  );
  return onSnapshot(q, (snapshot) => {
    const licenses = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as License,
    );
    callback(licenses);
  });
}

export function subscribeAllLicenses(
  callback: (licenses: License[]) => void,
) {
  const q = query(
    collection(db, "licenses"),
    orderBy("expiryDate", "asc"),
  );
  return onSnapshot(q, (snapshot) => {
    const licenses = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as License,
    );
    callback(licenses);
  });
}

export function subscribeExpiringLicenses(
  daysThreshold: number,
  callback: (licenses: License[]) => void,
) {
  const now = Date.now();
  const future = now + daysThreshold * 24 * 60 * 60 * 1000;

  const constraints: QueryConstraint[] = [
    where("expiryDate", ">=", now),
    where("expiryDate", "<=", future),
    orderBy("expiryDate", "asc"),
  ];

  const q = query(collection(db, "licenses"), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const licenses = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as License,
    );
    callback(licenses);
  });
}

// ─── CRUD ───────────────────────────────────────────────────────────

export async function createLicense(
  data: Omit<License, "id" | "createdAt" | "updatedAt" | "status">,
) {
  const now = Date.now();
  const status = computeLicenseStatus(data.expiryDate);

  const docRef = await addDoc(collection(db, "licenses"), {
    ...data,
    status,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateLicense(licenseId: string, data: Partial<License>) {
  const updates: Partial<License> & { updatedAt: number } = {
    ...data,
    updatedAt: Date.now(),
  };
  if (data.expiryDate) {
    updates.status = computeLicenseStatus(data.expiryDate);
  }
  await updateDoc(doc(db, "licenses", licenseId), updates);
}

export async function deleteLicense(licenseId: string) {
  await deleteDoc(doc(db, "licenses", licenseId));
}

// ─── Status calculations ────────────────────────────────────────────

export function computeLicenseStatus(expiryDate: number): LicenseStatus {
  const now = Date.now();
  const daysUntilExpiry = Math.floor(
    (expiryDate - now) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 30) return "expiring-soon";
  return "active";
}

export function getDaysUntilExpiry(expiryDate: number): number {
  return Math.floor((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
}

export function isExpired(expiryDate: number): boolean {
  return Date.now() > expiryDate;
}

export function isExpiringSoon(
  expiryDate: number,
  thresholdDays: number = 30,
): boolean {
  const days = getDaysUntilExpiry(expiryDate);
  return days >= 0 && days <= thresholdDays;
}

// ─── Helpers ────────────────────────────────────────────────────────

export function getLicenseTypeLabel(type: LicenseType): string {
  const labels: Record<LicenseType, string> = {
    prc: "PRC License",
    "broker-license": "Broker's License",
    "bir-accreditation": "BIR Accreditation",
    hlurb: "HLURB License",
    other: "Other",
  };
  return labels[type];
}

export function getLicenseStatusColor(status: LicenseStatus): string {
  const colors: Record<LicenseStatus, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    "expiring-soon":
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    expired: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    renewed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  };
  return colors[status];
}

export function getLicenseStatusLabel(status: LicenseStatus): string {
  const labels: Record<LicenseStatus, string> = {
    active: "Active",
    "expiring-soon": "Expiring Soon",
    expired: "Expired",
    renewed: "Renewed",
  };
  return labels[status];
}

export function computeStatusForAll(licenses: License[]): License[] {
  return licenses.map((l) => ({
    ...l,
    status: computeLicenseStatus(l.expiryDate),
  }));
}
