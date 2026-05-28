import { useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { computeCMA } from "@/lib/cmaEngine";
import { formatCurrency, cn } from "@/lib/utils";
import CMAReport from "./CMAReport";

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

interface ListingDoc {
  id: string;
  title?: string;
  propertyType?: string;
  price?: number;
  size?: number;
  address?: string;
  location?: string;
  brokerId?: string;
  createdAt?: number;
}

interface CMAReportResult {
  subject?: Record<string, unknown>;
  comps?: Record<string, unknown>[];
  adjustedRange?: { min: number; max: number };
  recommendedPrice?: number;
}

export default function CMAReportGenerator({ onDone, onCancel }: Props) {
  const { userProfile } = useAuth();
  const brokerId = userProfile?.brokerId || userProfile?.id;
  const [step, setStep] = useState(0);
  const [allListings, setAllListings] = useState<ListingDoc[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [comparableIds, setComparableIds] = useState<string[]>([]);
  const [generatedReport, setGeneratedReport] =
    useState<CMAReportResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Load listings
  useState(() => {
    if (!brokerId) {return;}
    onSnapshot(
      query(
        collection(db, "listings"),
        where("brokerId", "==", brokerId),
        orderBy("createdAt", "desc"),
      ),
      (snap) =>
        setAllListings(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  });

  const subject = allListings.find((l) => l.id === subjectId);
  const comparables = allListings.filter((l) => comparableIds.includes(l.id));

  const toggleComparable = (id: string) => {
    setComparableIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleGenerate = () => {
    if (!subject) {return;}
    const result = computeCMA({
      subject: {
        id: subject.id,
        title: subject.title ?? "",
        propertyType: subject.propertyType ?? "",
        price: subject.price || 0,
        size: subject.size || 0,
        address: subject.address ?? "",
        location: subject.location ?? "",
      },
      comparables: comparables.map((c) => ({
        id: c.id,
        title: c.title ?? "",
        price: c.price || 0,
        size: c.size || 0,
        address: c.address ?? "",
        location: c.location ?? "",
        propertyType: c.propertyType ?? "",
      })),
    });
    setGeneratedReport(result);
  };

  const handleSave = async () => {
    if (!generatedReport || !userProfile || !brokerId) {return;}
    setSaving(true);
    try {
      await addDoc(collection(db, "cmaReports"), {
        listingId: subjectId,
        listingTitle: subject?.title,
        subjectProperty: generatedReport.subject,
        comparables: generatedReport.comps,
        adjustedRange: generatedReport.adjustedRange,
        recommendedPrice: generatedReport.recommendedPrice,
        createdBy: userProfile.id,
        createdAt: Date.now(),
      });
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex gap-2">
        {["Select Property", "Select Comparables", "Review"].map((label, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium",
              step === i
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i < step ? "✓ " : ""}
            {label}
          </div>
        ))}
      </div>

      {/* Step 0: Select subject */}
      {step === 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Select the property to analyze
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {allListings.map((l) => (
              <button
                key={l.id}
                onClick={() => setSubjectId(l.id)}
                className={cn(
                  "w-full rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted",
                  subjectId === l.id && "border-primary bg-primary/5",
                )}
              >
                <p className="font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(l.price ?? 0)} · {l.propertyType} ·{" "}
                  {l.size || "—"} sqm
                </p>
              </button>
            ))}
          </div>
          <button
            onClick={() => subject && setStep(1)}
            disabled={!subject}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 1: Select comparables */}
      {step === 1 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Select comparable properties (2–5 recommended)
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {allListings
              .filter((l) => l.id !== subjectId)
              .map((l) => (
                <button
                  key={l.id}
                  onClick={() => toggleComparable(l.id)}
                  className={cn(
                    "w-full rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted",
                    comparableIds.includes(l.id) &&
                      "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{l.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(l.price ?? 0)} · {l.propertyType}
                      </p>
                    </div>
                    {comparableIds.includes(l.id) && (
                      <span className="text-primary">✓</span>
                    )}
                  </div>
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(0)}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={() => {
                handleGenerate();
                setStep(2);
              }}
              disabled={comparableIds.length < 1}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Generate Report
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && generatedReport && (
        <div className="space-y-3">
          <CMAReport report={generatedReport} />
          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Report"}
            </button>
            <button
              onClick={onCancel}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
