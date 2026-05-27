import { useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TitleStatusTrackerProps {}

const TITLE_STAGES = [
  {
    key: "with-seller",
    label: "With Seller",
    description:
      "Gather documents from seller: title, tax dec, latest tax receipt",
  },
  {
    key: "bir-cgt",
    label: "BIR (CGT)",
    description:
      "Pay 6% Capital Gains Tax. Submit to BIR: deed of sale, CAR, tax clearance",
  },
  {
    key: "registry-deeds",
    label: "Registry of Deeds",
    description:
      "Transfer title to buyer at ROD. Submit BIR documents + deed of sale",
  },
  {
    key: "transfer",
    label: "Transfer to Buyer",
    description:
      "New title issued under buyer name. Pay transfer tax + registration fees",
  },
  {
    key: "complete",
    label: "Complete",
    description: "All stages done. Buyer receives clean title.",
  },
];

const DOC_CHECKLIST: { stage: string; docs: string[] }[] = [
  {
    stage: "with-seller",
    docs: [
      "Original TCT/CCT title",
      "Tax Declaration",
      "Latest Real Property Tax Receipt",
      "Certified True Copy of Tax Map",
      "HOA Clearance (if applicable)",
    ],
  },
  {
    stage: "bir-cgt",
    docs: [
      "Notarized Deed of Absolute Sale",
      "BIR Form 1706 (CGT return)",
      "Tax Clearance from BIR",
      "CAR (Certificate Authorizing Registration)",
      "Proof of payment of CGT",
    ],
  },
  {
    stage: "registry-deeds",
    docs: [
      "CAR from BIR",
      "Notarized Deed of Sale",
      "Owner's Copy of Title",
      "Transfer Tax Receipt",
      "Register of Deeds filing fee receipt",
    ],
  },
  {
    stage: "transfer",
    docs: [
      "New owner info/bio-data",
      "Tax Clearance for Transfer",
      "Updated Tax Declaration under new owner",
      "Proof of payment of transfer tax",
    ],
  },
  {
    stage: "complete",
    docs: [
      "New TCT under buyer name",
      "Updated Tax Declaration",
      "All receipts and certifications",
    ],
  },
];

export function TitleStatusTracker(_props: TitleStatusTrackerProps) {
  const [currentStage, setCurrentStage] = useState("with-seller");
  const [docStatus, setDocStatus] = useState<
    Record<string, "pending" | "submitted" | "done">
  >({});
  const [stageStartDates, setStageStartDates] = useState<
    Record<string, number>
  >({});
  const [dealPrice, setDealPrice] = useState("5000000");
  const [now, setNow] = useState(() => Date.now());

  const currentIdx = TITLE_STAGES.findIndex((s) => s.key === currentStage);

  const cgt = Number(dealPrice) * 0.06;
  const dst = Number(dealPrice) * 0.015;
  const transferTax = Number(dealPrice) * 0.005; // ~0.5% typical
  const totalClosing = cgt + dst + transferTax + 15000; // + misc fees

  const toggleDoc = (stage: string, docName: string) => {
    const key = `${stage}:${docName}`;
    setDocStatus((prev) => {
      const current = prev[key] || "pending";
      const next =
        current === "pending"
          ? "submitted"
          : current === "submitted"
            ? "done"
            : "pending";
      return { ...prev, [key]: next };
    });
  };

  const advanceStage = useCallback((stage: string) => {
    setCurrentStage(stage);
    const ts = Date.now();
    setNow(ts);
    setStageStartDates((prev) =>
      prev[stage] ? prev : { ...prev, [stage]: ts },
    );
  }, []);

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-xl">📄</span>
        <h3 className="text-lg font-semibold">Title Status Tracker</h3>
      </div>

      {/* Deal Price Input */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Deal Price (₱):</label>
        <input
          type="number"
          value={dealPrice}
          onChange={(e) => setDealPrice(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm w-48"
        />
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {TITLE_STAGES.map((stage, idx) => (
            <div key={stage.key} className="flex flex-col items-center flex-1">
              <button
                onClick={() => advanceStage(stage.key)}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  idx <= currentIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                } ${idx === currentIdx ? "ring-2 ring-primary ring-offset-2" : ""}`}
              >
                {idx < currentIdx ? "✓" : idx + 1}
              </button>
              <span
                className={`text-xs mt-1 text-center ${idx === currentIdx ? "font-semibold text-primary" : "text-muted-foreground"}`}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${(currentIdx / (TITLE_STAGES.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current Stage Detail */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="font-semibold mb-1">
          {TITLE_STAGES[currentIdx]?.label}
        </h4>
        <p className="text-sm text-muted-foreground">
          {TITLE_STAGES[currentIdx]?.description}
        </p>
        {stageStartDates[currentStage] && (
          <p className="text-xs text-muted-foreground mt-1">
            Started:{" "}
            {new Date(stageStartDates[currentStage]).toLocaleDateString(
              "en-PH",
            )}
            {" | "}Days in stage:{" "}
            {Math.floor((now - stageStartDates[currentStage]) / 86400000)}
          </p>
        )}
      </div>

      {/* Document Checklist */}
      <div>
        <h4 className="font-semibold mb-3">Document Checklist</h4>
        <div className="space-y-2">
          {DOC_CHECKLIST.map((group) => (
            <details
              key={group.stage}
              className="text-sm"
              open={group.stage === currentStage}
            >
              <summary
                className={`cursor-pointer font-medium mb-1 ${
                  group.stage === currentStage
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {TITLE_STAGES.find((s) => s.key === group.stage)?.label ||
                  group.stage}{" "}
                ({group.docs.length} docs)
              </summary>
              <div className="space-y-1 pl-4">
                {group.docs.map((doc) => {
                  const key = `${group.stage}:${doc}`;
                  const status = docStatus[key] || "pending";
                  return (
                    <div
                      key={key}
                      onClick={() => toggleDoc(group.stage, doc)}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded px-2 py-1"
                    >
                      <span
                        className={`text-xs ${status === "done" ? "text-green-600" : status === "submitted" ? "text-yellow-600" : "text-muted-foreground"}`}
                      >
                        {status === "done"
                          ? "✅"
                          : status === "submitted"
                            ? "📎"
                            : "⬜"}
                      </span>
                      <span
                        className={`flex-1 ${status === "done" ? "line-through text-muted-foreground" : ""}`}
                      >
                        {doc}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Cost Estimate */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
          Estimated Closing Costs (Buyer)
        </summary>
        <div className="mt-2 rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="flex justify-between">
            <span>Capital Gains Tax (6%)</span>
            <span className="text-destructive">{formatCurrency(cgt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Documentary Stamp Tax (1.5%)</span>
            <span className="text-destructive">{formatCurrency(dst)}</span>
          </div>
          <div className="flex justify-between">
            <span>Transfer Tax (~0.5%)</span>
            <span>{formatCurrency(transferTax)}</span>
          </div>
          <div className="flex justify-between">
            <span>Miscellaneous Fees</span>
            <span>{formatCurrency(15000)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Total Estimated Closing Costs</span>
            <span>{formatCurrency(totalClosing)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            * Actual costs vary by LGU and property location. Consult a real
            estate lawyer.
          </p>
        </div>
      </details>
    </div>
  );
}
