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
import type { ComplianceChecklist, ComplianceItem } from "@/types";

export function subscribeComplianceChecklists(
  dealId?: string,
  callback?: (items: ComplianceChecklist[]) => void,
  onError?: (error: string) => void,
) {
  if (!dealId) return () => {};
  const q = query(
    collection(db, "complianceChecklists"),
    where("dealId", "==", dealId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) =>
      callback?.(
        snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as ComplianceChecklist,
        ),
      ),
    (err) => onError?.(err.message),
  );
}

export async function createChecklist(
  data: Omit<ComplianceChecklist, "id" | "createdAt" | "updatedAt">,
) {
  const now = Date.now();
  const ref = await addDoc(collection(db, "complianceChecklists"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateChecklist(
  id: string,
  data: Partial<ComplianceChecklist>,
) {
  await updateDoc(doc(db, "complianceChecklists", id), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteChecklist(id: string) {
  await deleteDoc(doc(db, "complianceChecklists", id));
}

export function getPHComplianceTemplate(): ComplianceItem[] {
  return [
    {
      id: "c1",
      label: "RA 9646 (Real Estate Service Act) Disclosure",
      category: "legal",
      required: true,
      completed: false,
    },
    {
      id: "c2",
      label: "Maceda Law (RA 6552) Compliance",
      category: "legal",
      required: true,
      completed: false,
    },
    {
      id: "c3",
      label: "Notarization of Contract",
      category: "legal",
      required: true,
      completed: false,
    },
    {
      id: "c4",
      label: "CGT (Capital Gains Tax) Computation - 6%",
      category: "tax",
      required: true,
      completed: false,
    },
    {
      id: "c5",
      label: "DST (Documentary Stamp Tax) - 1.5%",
      category: "tax",
      required: true,
      completed: false,
    },
    {
      id: "c6",
      label: "BIR Form 1606 (CGT Return)",
      category: "tax",
      required: true,
      completed: false,
    },
    {
      id: "c7",
      label: "Transfer Tax (Provincial/City)",
      category: "tax",
      required: true,
      completed: false,
    },
    {
      id: "c8",
      label: "Certificate of Title (Transfer)",
      category: "documentary",
      required: true,
      completed: false,
    },
    {
      id: "c9",
      label: "Tax Declaration (Updated)",
      category: "documentary",
      required: true,
      completed: false,
    },
    {
      id: "c10",
      label: "Deed of Absolute Sale / Contract to Sell",
      category: "documentary",
      required: true,
      completed: false,
    },
    {
      id: "c11",
      label: "Registration Fee (Registry of Deeds)",
      category: "financial",
      required: true,
      completed: false,
    },
    {
      id: "c12",
      label: "Broker's Commission Receipt",
      category: "financial",
      required: true,
      completed: false,
    },
  ];
}
