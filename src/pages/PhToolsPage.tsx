import { useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

// ─── Pag-IBIG Calculator ───────────────────────────────────────────

function PagIbigCalculator() {
  const [price, setPrice] = useState("3000000");
  const [downPaymentPct, setDownPaymentPct] = useState("20");
  const [term, setTerm] = useState("30");
  const [rate, setRate] = useState("6.5");

  const loanAmount =
    Number(price) - (Number(price) * Number(downPaymentPct)) / 100;
  const monthlyRate = Number(rate) / 100 / 12;
  const numPayments = Number(term) * 12;
  const monthlyAmort =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;

  const maxLoanTiers = [
    { tier: "Up to ₱2M", maxAmount: 2000000, interest: "6.0%" },
    { tier: "₱2M – ₱3M", maxAmount: 3000000, interest: "6.5%" },
    { tier: "₱3M – ₱4.5M", maxAmount: 4500000, interest: "7.0%" },
    { tier: "₱4.5M – ₱6M", maxAmount: 6000000, interest: "7.5%" },
    { tier: "₱6M – ₱10M", maxAmount: 10000000, interest: "8.0%" },
  ];

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏠</span>
        <h3 className="text-lg font-semibold">Pag-IBIG Loan Calculator</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">
            Property Price (₱)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Down Payment (%)
          </label>
          <input
            type="number"
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Loan Term (years)
          </label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="5">5 years</option>
            <option value="10">10 years</option>
            <option value="15">15 years</option>
            <option value="20">20 years</option>
            <option value="25">25 years</option>
            <option value="30">30 years</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Interest Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="rounded-lg bg-primary/5 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Loan Amount</span>
          <span className="font-semibold">{formatCurrency(loanAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Down Payment</span>
          <span>
            {formatCurrency((Number(price) * Number(downPaymentPct)) / 100)}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Monthly Amortization</span>
          <span className="text-primary">{formatCurrency(monthlyAmort)}</span>
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Pag-IBIG Max Loanable Amount Reference
        </summary>
        <div className="mt-2 space-y-1">
          {maxLoanTiers.map((t) => (
            <div
              key={t.tier}
              className="flex justify-between text-xs text-muted-foreground border-b py-1"
            >
              <span>{t.tier}</span>
              <span>
                Max: {formatCurrency(t.maxAmount)} @ {t.interest}
              </span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-1">
            * Actual rates depend on Pag-IBIG prevailing rate. Check latest on
            pagibigfund.gov.ph
          </p>
        </div>
      </details>
    </div>
  );
}

// ─── Bank Financing Calculator ─────────────────────────────────────

const BANKS = [
  {
    id: "bpi",
    name: "BPI",
    rates: {
      "1": "7.5",
      "3": "8.0",
      "5": "8.5",
      "10": "9.0",
      "15": "9.5",
      "20": "10.0",
    },
  },
  {
    id: "bdo",
    name: "BDO",
    rates: {
      "1": "7.25",
      "3": "7.75",
      "5": "8.25",
      "10": "8.75",
      "15": "9.25",
      "20": "9.75",
    },
  },
  {
    id: "metrobank",
    name: "Metrobank",
    rates: {
      "1": "7.5",
      "3": "8.0",
      "5": "8.5",
      "10": "9.0",
      "15": "9.5",
      "20": "10.0",
    },
  },
  {
    id: "security-bank",
    name: "Security Bank",
    rates: {
      "1": "7.25",
      "3": "7.75",
      "5": "8.25",
      "10": "8.75",
      "15": "9.5",
      "20": "10.25",
    },
  },
  {
    id: "eastwest",
    name: "EastWest",
    rates: {
      "1": "7.5",
      "3": "8.0",
      "5": "8.5",
      "10": "9.25",
      "15": "9.75",
      "20": "10.5",
    },
  },
];

function BankCalculator() {
  const [bankId, setBankId] = useState("bpi");
  const [loanAmount, setLoanAmount] = useState("2500000");
  const [termIdx, setTermIdx] = useState("10");

  const bank = BANKS.find((b) => b.id === bankId);
  const rateStr = bank?.rates[termIdx as keyof typeof bank.rates] || "8.5";
  const rate = Number(rateStr);
  const monthlyRate = rate / 100 / 12;
  const numPayments = Number(termIdx) * 12;
  const amount = Number(loanAmount);

  const monthlyAmort =
    amount > 0 && monthlyRate > 0
      ? (amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : amount / numPayments;

  const totalInterest = monthlyAmort * numPayments - amount;
  const totalPayment = monthlyAmort * numPayments;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏦</span>
        <h3 className="text-lg font-semibold">Bank Financing Calculator</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Bank</label>
          <select
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {BANKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Loan Amount (₱)
          </label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Term (years)</label>
          <select
            value={termIdx}
            onChange={(e) => setTermIdx(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="1">1 year</option>
            <option value="3">3 years</option>
            <option value="5">5 years</option>
            <option value="10">10 years</option>
            <option value="15">15 years</option>
            <option value="20">20 years</option>
          </select>
        </div>
      </div>
      {bank && (
        <div className="rounded-lg bg-primary/5 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Bank</span>
            <span className="font-semibold">{bank.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Interest Rate</span>
            <span className="font-semibold">{rate}% p.a.</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Loan Amount</span>
            <span>{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Interest Payable</span>
            <span className="text-destructive">
              {formatCurrency(totalInterest)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Payment</span>
            <span>{formatCurrency(totalPayment)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Monthly Amortization</span>
            <span className="text-primary">{formatCurrency(monthlyAmort)}</span>
          </div>
        </div>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Rate Comparison Across Banks ({termIdx}-yr term)
        </summary>
        <div className="mt-2 space-y-1">
          {BANKS.map((b) => {
            const r = b.rates[termIdx as keyof typeof b.rates];
            const mRate = Number(r) / 100 / 12;
            const nPay = Number(termIdx) * 12;
            const mAmort =
              amount > 0 && mRate > 0
                ? (amount * (mRate * Math.pow(1 + mRate, nPay))) /
                  (Math.pow(1 + mRate, nPay) - 1)
                : amount / nPay;
            return (
              <div
                key={b.id}
                className={`flex justify-between text-xs py-1 border-b ${b.id === bankId ? "font-semibold text-primary" : "text-muted-foreground"}`}
              >
                <span>{b.name}</span>
                <span>
                  {r}% → {formatCurrency(mAmort)}/mo
                </span>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground mt-1">
            * Rates are estimates. Actual rates depend on bank evaluation and
            prevailing rates.
          </p>
        </div>
      </details>
    </div>
  );
}

// ─── Title Status Tracker ──────────────────────────────────────────

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

function TitleStatusTracker() {
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

// ─── Main Page ─────────────────────────────────────────────────────

export default function PhToolsPage() {
  const [activeTab, setActiveTab] = useState<"pagibig" | "bank" | "title">(
    "pagibig",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🇵🇭 PH-Specific Tools</h1>
          <p className="text-muted-foreground">
            Pag-IBIG, Bank Financing, Title Status, and Tax Calculators
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: "pagibig", label: "Pag-IBIG Loan", icon: "🏠" },
          { id: "bank", label: "Bank Financing", icon: "🏦" },
          { id: "title", label: "Title Tracker", icon: "📄" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-card text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "pagibig" && <PagIbigCalculator />}
      {activeTab === "bank" && <BankCalculator />}
      {activeTab === "title" && <TitleStatusTracker />}
    </div>
  );
}
