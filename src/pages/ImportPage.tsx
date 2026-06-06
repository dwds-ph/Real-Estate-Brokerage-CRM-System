import { useState } from "react";
import ImportWizard from "@/components/import/ImportWizard";
import FacebookLeadImporter from "@/components/import/FacebookLeadImporter";
import { cn } from "@/lib/utils";

type ImportTab = "csv" | "facebook";

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<ImportTab>("csv");

  const tabs: { id: ImportTab; label: string; icon: string }[] = [
    { id: "csv", label: "CSV Import", icon: "📥" },
    { id: "facebook", label: "Facebook & Instagram", icon: "📱" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import</h1>
        <p className="text-sm text-muted-foreground">
          Import leads, listings, and projects from CSV files or connect
          Facebook Lead Ads for automatic lead import
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "csv" && <ImportWizard />}
      {activeTab === "facebook" && <FacebookLeadImporter />}
    </div>
  );
}
