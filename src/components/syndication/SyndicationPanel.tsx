import { useState } from "react";
import { cn } from "@/lib/utils";
import QRCodeGenerator from "./QRCodeGenerator";
import ListingSheet from "./ListingSheet";
import SocialMediaCard from "./SocialMediaCard";

interface SyndicationListing {
  id?: string;
  title?: string;
}

interface Props {
  listing: SyndicationListing;
  agentName: string;
}

const TABS = [
  { id: "qr", label: "QR Code" },
  { id: "sheet", label: "Listing Sheet" },
  { id: "social", label: "Social Card" },
];

export default function SyndicationPanel({ listing, agentName }: Props) {
  const [tab, setTab] = useState("qr");

  const listingUrl = `${window.location.origin}/listings/${listing.id}`;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Marketing Tools</h3>
      <div className="flex gap-1 rounded-lg bg-muted p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors",
              tab === t.id ? "bg-card shadow-sm" : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "qr" && (
        <QRCodeGenerator value={listingUrl} label="Scan to view listing" />
      )}
      {tab === "sheet" && (
        <ListingSheet listing={listing} agentName={agentName} />
      )}
      {tab === "social" && <SocialMediaCard listing={listing} />}
    </div>
  );
}
