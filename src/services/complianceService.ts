import { where, orderBy } from "firebase/firestore";
import { subscribeToQuery, createDocument, updateDocument, deleteDocument, COLLECTIONS } from "@/lib/firestore";
import type { ComplianceChecklist, ComplianceItem } from "@/types";

export function subscribeComplianceChecklists(
  dealId?: string,
  callback?: (items: ComplianceChecklist[]) => void,
  onError?: (error: string) => void,
) {
  if (!dealId) {return () => {};}
  return subscribeToQuery<ComplianceChecklist>(
    COLLECTIONS.COMPLIANCE_CHECKLISTS,
    [where("dealId", "==", dealId), orderBy("createdAt", "desc")],
    callback ?? (() => {}),
    onError,
  );
}

export async function createChecklist(
  data: Omit<ComplianceChecklist, "id" | "createdAt" | "updatedAt">,
) {
  return createDocument<ComplianceChecklist>(COLLECTIONS.COMPLIANCE_CHECKLISTS, data as unknown as Omit<ComplianceChecklist, "id">);
}

export async function updateChecklist(
  id: string,
  data: Partial<ComplianceChecklist>,
) {
  await updateDocument<ComplianceChecklist>(COLLECTIONS.COMPLIANCE_CHECKLISTS, id, data);
}

export async function deleteChecklist(id: string) {
  await deleteDocument(COLLECTIONS.COMPLIANCE_CHECKLISTS, id);
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
