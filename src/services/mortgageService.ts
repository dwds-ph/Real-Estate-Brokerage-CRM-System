import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Mortgage, MortgageStage, MortgageStatus, BankProfile } from "@/types";

// ─── Bank Presets ───────────────────────────────────────────────────

export const BANKS: BankProfile[] = [
  {
    id: "bpi",
    name: "BPI",
    typicalRate: "6.5% - 8.5%",
    estimatedTimelineDays: 45,
  },
  {
    id: "bdo",
    name: "BDO",
    typicalRate: "6.75% - 8.75%",
    estimatedTimelineDays: 50,
  },
  {
    id: "metrobank",
    name: "Metrobank",
    typicalRate: "6.5% - 8.5%",
    estimatedTimelineDays: 45,
  },
  {
    id: "security-bank",
    name: "Security Bank",
    typicalRate: "7.0% - 9.0%",
    estimatedTimelineDays: 55,
  },
  {
    id: "eastwest",
    name: "EastWest",
    typicalRate: "6.75% - 8.5%",
    estimatedTimelineDays: 40,
  },
];

// ─── Stage Definitions ─────────────────────────────────────────────

export const MORTGAGE_STAGES: {
  key: MortgageStage;
  label: string;
  description: string;
}[] = [
  {
    key: "application",
    label: "Application",
    description: "Loan application submitted to bank",
  },
  {
    key: "bank-evaluation",
    label: "Bank Evaluation",
    description: "Bank reviews documents and evaluates credit",
  },
  {
    key: "bir-docs",
    label: "BIR Docs",
    description: "BIR document processing and stamping",
  },
  { key: "rod", label: "ROD", description: "Registry of Deeds registration" },
  {
    key: "loan-release",
    label: "Loan Release",
    description: "Loan proceeds released to seller/broker",
  },
];

export const STAGE_ORDER: MortgageStage[] = [
  "application",
  "bank-evaluation",
  "bir-docs",
  "rod",
  "loan-release",
];

// ─── Default Stages Builder ────────────────────────────────────────

export function createDefaultStages(): Mortgage["stages"] {
  return STAGE_ORDER.map((key, index) => ({
    key,
    label: MORTGAGE_STAGES.find((s) => s.key === key)?.label || key,
    status: index === 0 ? ("in-progress" as const) : ("pending" as const),
    startedAt: index === 0 ? Date.now() : undefined,
    completedAt: undefined,
    notes: undefined,
  }));
}

// ─── CRUD Operations ───────────────────────────────────────────────

export async function createMortgage(data: {
  dealId: string;
  bankId: string;
  bankName: string;
  loanAmount: number;
  status?: MortgageStatus;
}): Promise<string> {
  const stages = createDefaultStages();
  const docRef = await addDoc(collection(db, "mortgages"), {
    dealId: data.dealId,
    bankId: data.bankId,
    bankName: data.bankName,
    loanAmount: data.loanAmount,
    status: data.status || "ongoing",
    currentStage: "application" as MortgageStage,
    stages,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return docRef.id;
}

export async function updateMortgage(
  mortgageId: string,
  data: Partial<{
    bankId: string;
    bankName: string;
    loanAmount: number;
    status: MortgageStatus;
    currentStage: MortgageStage;
    stages: Mortgage["stages"];
  }>,
): Promise<void> {
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: Date.now(),
  };
  await updateDoc(doc(db, "mortgages", mortgageId), updateData);
}

export async function deleteMortgage(mortgageId: string): Promise<void> {
  await deleteDoc(doc(db, "mortgages", mortgageId));
}

// ─── Stage Advancement ─────────────────────────────────────────────

export function getNextStage(
  currentStage: MortgageStage,
): MortgageStage | null {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  if (currentIndex < 0 || currentIndex >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[currentIndex + 1];
}

export function getPreviousStage(
  currentStage: MortgageStage,
): MortgageStage | null {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  if (currentIndex <= 0) return null;
  return STAGE_ORDER[currentIndex - 1];
}

export async function advanceMortgageStage(
  mortgageId: string,
  currentMortgage: Mortgage,
  notes?: string,
): Promise<void> {
  const nextStageKey = getNextStage(currentMortgage.currentStage);
  if (!nextStageKey) throw new Error("Already at the final stage");

  const now = Date.now();
  const updatedStages = currentMortgage.stages.map((stage) => {
    if (stage.key === currentMortgage.currentStage) {
      // Complete current stage
      return {
        ...stage,
        status: "done" as const,
        completedAt: now,
        notes: notes || stage.notes,
      };
    }
    if (stage.key === nextStageKey) {
      // Activate next stage
      return {
        ...stage,
        status: "in-progress" as const,
        startedAt: now,
      };
    }
    return stage;
  });

  await updateMortgage(mortgageId, {
    currentStage: nextStageKey,
    stages: updatedStages,
  });
}

export async function updateStageNotes(
  mortgageId: string,
  stages: Mortgage["stages"],
  stageKey: MortgageStage,
  notes: string,
): Promise<void> {
  const updatedStages = stages.map((stage) => {
    if (stage.key === stageKey) {
      return { ...stage, notes };
    }
    return stage;
  });

  await updateDoc(doc(db, "mortgages", mortgageId), {
    stages: updatedStages,
    updatedAt: Date.now(),
  });
}

// ─── Queries ───────────────────────────────────────────────────────

export async function fetchMortgagesByDeal(
  dealId: string,
): Promise<Mortgage[]> {
  const q = query(
    collection(db, "mortgages"),
    where("dealId", "==", dealId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as Mortgage,
  );
}

// ─── Firestore Hook Helper ─────────────────────────────────────────

export function useMortgagesCollection(constraints: QueryConstraint[] = []) {
  // Dynamic import to avoid circular deps — this is a re-export wrapper
  // Consumers should use useCollection<Mortgage>('mortgages', constraints) directly
  return { constraints };
}
