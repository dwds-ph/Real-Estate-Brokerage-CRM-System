import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Tour, type TourStatus } from "@/types";

// ─── Real-time listeners ────────────────────────────────────────────

export function subscribeToursForAgent(
  agentId: string | undefined,
  callback: (tours: Tour[]) => void,
  onError?: (error: string) => void,
) {
  if (!agentId) return () => {};

  const constraints: QueryConstraint[] = [
    where("agentId", "==", agentId),
    orderBy("scheduledDate", "desc"),
  ];

  const q = query(collection(db, "tours"), ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const tours = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Tour,
      );
      callback(tours);
    },
    (err) => {
      onError?.(err.message);
    },
  );
}

export function subscribeToursForBroker(
  callback: (tours: Tour[]) => void,
  onError?: (error: string) => void,
) {
  const q = query(collection(db, "tours"), orderBy("scheduledDate", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const tours = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Tour,
      );
      callback(tours);
    },
    (err) => {
      onError?.(err.message);
    },
  );
}

export function subscribeToursByStatus(
  status: TourStatus,
  callback: (tours: Tour[]) => void,
) {
  const constraints: QueryConstraint[] = [
    where("status", "==", status),
    orderBy("scheduledDate", "desc"),
  ];
  const q = query(collection(db, "tours"), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const tours = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Tour);
    callback(tours);
  });
}

// ─── CRUD ───────────────────────────────────────────────────────────

export async function createTour(
  data: Omit<Tour, "id" | "createdAt" | "updatedAt">,
) {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "tours"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateTour(tourId: string, data: Partial<Tour>) {
  await updateDoc(doc(db, "tours", tourId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteTour(tourId: string) {
  await deleteDoc(doc(db, "tours", tourId));
}

export async function updateTourStatus(tourId: string, status: TourStatus) {
  await updateDoc(doc(db, "tours", tourId), {
    status,
    updatedAt: Date.now(),
  });
}

// ─── Helpers ────────────────────────────────────────────────────────

export function getTourStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    "in-progress":
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    completed:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

export function getTourStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    confirmed: "Confirmed",
    "in-progress": "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

export function getTotalTourDuration(stops: Tour["stops"]): number {
  return stops.reduce(
    (acc, s) => acc + (s.estimatedDuration || 0) + (s.driveTime || 0),
    0,
  );
}

export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function generateGoogleMapsUrl(stops: Tour["stops"]): string {
  if (stops.length === 0) return "";
  const addresses = stops.map((s) => encodeURIComponent(s.listingAddress));
  return `https://www.google.com/maps/dir/${addresses.join("/")}`;
}
