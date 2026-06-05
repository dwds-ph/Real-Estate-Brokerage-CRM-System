import { useState } from "react";

import { BankCalculator } from "@/components/ph-tools/BankCalculator";
import { PagIbigCalculator } from "@/components/ph-tools/PagIbigCalculator";
import { TitleStatusTracker } from "@/components/ph-tools/TitleStatusTracker";

export default function PhToolsPage() {
  const [activeTab, setActiveTab] = useState<"pagibig" | "bank" | "title">(
    "pagibig",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
