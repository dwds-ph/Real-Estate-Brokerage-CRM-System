import { cn } from "@/lib/utils";

export type VaultTab = "all" | "by-deal" | "by-listing" | "requests";

export interface DocumentTabsProps {
  activeTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  requestCount: number;
}

const TABS: { key: VaultTab; label: string }[] = [
  { key: "all", label: "All Documents" },
  { key: "by-deal", label: "By Deal" },
  { key: "by-listing", label: "By Listing" },
  { key: "requests", label: "Requests" },
];

export function DocumentTabs({
  activeTab,
  onTabChange,
  requestCount,
}: DocumentTabsProps) {
  return (
    <div className="flex border-b">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === tab.key
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.key === "requests" && requestCount > 0
            ? `Requests (${requestCount})`
            : tab.label}
        </button>
      ))}
    </div>
  );
}
