import { Listing } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────

export interface MapPopupProps {
  listing: Listing;
  onNavigate: (id: string) => void;
}

// ─── MapPopup Component ─────────────────────────────────────────────

export function MapPopup({ listing, onNavigate }: MapPopupProps) {
  return (
    <div className="space-y-2" style={{ minWidth: 200 }}>
      {/* Thumbnail */}
      {listing.media && listing.media.length > 0 ? (
        <img
          src={listing.media[0]}
          alt={listing.title}
          className="w-full h-32 object-cover rounded-md"
          style={{ display: "block" }}
        />
      ) : (
        <div className="w-full h-20 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-md text-2xl">
          🏠
        </div>
      )}
      {/* Info */}
      <div>
        <h3 className="font-medium text-sm leading-tight">
          {listing.title}
        </h3>
        <p className="text-base font-bold text-primary mt-1">
          {formatCurrency(listing.price)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              "bg-green-100 text-green-800",
            )}
          >
            {listing.status}
          </span>
          <span className="text-xs capitalize text-muted-foreground">
            {listing.propertyType}
          </span>
        </div>
        {listing.location?.city && (
          <p className="text-xs text-muted-foreground mt-1">
            📍 {listing.location.city}
          </p>
        )}
      </div>
      {/* View Details button */}
      <button
        onClick={() => onNavigate(listing.id)}
        className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 text-center"
      >
        View Details →
      </button>
    </div>
  );
}
