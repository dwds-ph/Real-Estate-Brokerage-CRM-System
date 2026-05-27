import { useRef, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  listing: any;
}

export default function SocialMediaCard({ listing }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    const html2canvas = (await import("html2canvas")).default;
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listing.title?.replace(/\s+/g, "_") || "listing"}_social.png`;
    a.click();
  }, [listing]);

  return (
    <div className="space-y-3">
      <div ref={cardRef} className="relative w-full max-w-sm overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-6" style={{ aspectRatio: "1200/628" }}>
        {listing.images?.[0] && (
          <img src={listing.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium capitalize">{listing.propertyType?.replace("-", " ")}</span>
          </div>
          <div className="space-y-1 text-white">
            <h3 className="text-xl font-bold drop-shadow-lg">{listing.title}</h3>
            <p className="text-3xl font-bold drop-shadow-lg">{formatCurrency(listing.price)}</p>
            <p className="text-sm drop-shadow-md opacity-90">{listing.address || listing.location}</p>
          </div>
        </div>
      </div>
      <button onClick={handleDownload} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        🖼️ Download Social Card
      </button>
    </div>
  );
}
