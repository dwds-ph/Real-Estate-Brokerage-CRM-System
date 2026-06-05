import { useParams } from "react-router-dom";
import { useDoc } from "@/hooks/useFirestore";
import { Listing } from "@/types";
import { formatCurrency, getListingStatusColor, cn } from "@/lib/utils";

export default function BrochurePage() {
  const { listingId } = useParams();
  const { data: listing, loading, error } = useDoc<Listing>("listings", listingId);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center max-w-md dark:bg-red-950/20">
          <p className="text-red-700 dark:text-red-400 mb-3">
            Failed to load property: {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Property Not Found</h1>
          <p className="text-muted-foreground">
            This listing may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Hero Image */}
        <div className="rounded-xl overflow-hidden mb-6 shadow-lg">
          {listing.media && listing.media.length > 0 ? (
            <img
              src={listing.media[0]}
              alt={listing.title}
              className="w-full h-72 md:h-96 object-cover"
            />
          ) : (
            <div className="h-72 md:h-96 bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
              <span className="text-8xl text-muted-foreground/20">🏠</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {listing.title}
              </h1>
              {listing.location?.city && (
                <p className="text-muted-foreground mt-1">
                  📍 {listing.location.city}, {listing.location.province}
                </p>
              )}
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                getListingStatusColor(listing.status),
              )}
            >
              {listing.status}
            </span>
          </div>

          <p className="text-3xl md:text-4xl font-bold text-primary">
            {formatCurrency(listing.price)}
          </p>

          {listing.description && (
            <p className="text-muted-foreground">{listing.description}</p>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-6">
            {listing.propertyType && (
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium capitalize">
                  {listing.propertyType}
                </p>
              </div>
            )}
            {listing.propertyDetails?.bedrooms && (
              <div>
                <p className="text-xs text-muted-foreground">Bedrooms</p>
                <p className="text-sm font-medium">
                  {listing.propertyDetails.bedrooms}
                </p>
              </div>
            )}
            {listing.propertyDetails?.bathrooms && (
              <div>
                <p className="text-xs text-muted-foreground">Bathrooms</p>
                <p className="text-sm font-medium">
                  {listing.propertyDetails.bathrooms}
                </p>
              </div>
            )}
            {listing.propertyDetails?.lotArea && (
              <div>
                <p className="text-xs text-muted-foreground">Lot Area</p>
                <p className="text-sm font-medium">
                  {listing.propertyDetails.lotArea} sqm
                </p>
              </div>
            )}
            {listing.propertyDetails?.floorArea && (
              <div>
                <p className="text-xs text-muted-foreground">Floor Area</p>
                <p className="text-sm font-medium">
                  {listing.propertyDetails.floorArea} sqm
                </p>
              </div>
            )}
            {listing.floodRisk && listing.floodRisk !== "unknown" && (
              <div>
                <p className="text-xs text-muted-foreground">Flood Risk</p>
                <p className="text-sm font-medium capitalize">
                  {listing.floodRisk}
                </p>
              </div>
            )}
          </div>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-3">Nearby</h3>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-muted px-3 py-1 text-xs"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="border-t pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Interested in this property?
            </p>
            <div className="flex justify-center gap-3">
              <a
                href={`https://wa.me/?text=I'm%20interested%20in%20${encodeURIComponent(listing.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                💬 WhatsApp
              </a>
              <button
                onClick={() => window.print()}
                className="rounded-lg border px-6 py-2 text-sm font-medium hover:bg-muted"
              >
                🖨️ Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
