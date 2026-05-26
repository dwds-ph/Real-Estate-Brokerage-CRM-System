import { useParams, useNavigate } from 'react-router-dom';
import { useDoc } from '@/hooks/useFirestore';
import { Listing } from '@/types';
import { formatCurrency, getListingStatusColor, cn } from '@/lib/utils';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: listing, loading } = useDoc<Listing>('listings', id);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!listing) {
    return <div className="text-center py-8 text-muted-foreground">Listing not found</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/listings')} className="text-sm text-muted-foreground hover:text-foreground">← Back to Listings</button>

      {/* Hero */}
      <div className="rounded-lg overflow-hidden">
        {listing.media && listing.media.length > 0 ? (
          <img src={listing.media[0]} alt={listing.title} className="w-full h-64 object-cover" />
        ) : (
          <div className="h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-6xl text-muted-foreground/30">🏠</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{listing.title}</h1>
                <p className="text-3xl font-bold text-primary mt-2">{formatCurrency(listing.price)}</p>
              </div>
              <span className={cn('rounded-full px-3 py-1 text-xs font-medium', getListingStatusColor(listing.status))}>
                {listing.status}
              </span>
            </div>
            <p className="text-muted-foreground">{listing.description}</p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {listing.propertyType && (
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium capitalize">{listing.propertyType}</p>
                </div>
              )}
              {listing.propertyDetails?.bedrooms && (
                <div>
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                  <p className="text-sm font-medium">{listing.propertyDetails.bedrooms}</p>
                </div>
              )}
              {listing.propertyDetails?.bathrooms && (
                <div>
                  <p className="text-xs text-muted-foreground">Bathrooms</p>
                  <p className="text-sm font-medium">{listing.propertyDetails.bathrooms}</p>
                </div>
              )}
              {listing.propertyDetails?.lotArea && (
                <div>
                  <p className="text-xs text-muted-foreground">Lot Area</p>
                  <p className="text-sm font-medium">{listing.propertyDetails.lotArea} sqm</p>
                </div>
              )}
              {listing.propertyDetails?.floorArea && (
                <div>
                  <p className="text-xs text-muted-foreground">Floor Area</p>
                  <p className="text-sm font-medium">{listing.propertyDetails.floorArea} sqm</p>
                </div>
              )}
              {listing.propertyDetails?.furnishing && (
                <div>
                  <p className="text-xs text-muted-foreground">Furnishing</p>
                  <p className="text-sm font-medium capitalize">{listing.propertyDetails.furnishing}</p>
                </div>
              )}
              {listing.floodRisk && (
                <div>
                  <p className="text-xs text-muted-foreground">Flood Risk</p>
                  <p className="text-sm font-medium capitalize">{listing.floodRisk}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">Location</h2>
            <p className="text-sm">{listing.location?.address}</p>
            <p className="text-sm text-muted-foreground">{listing.location?.city}, {listing.location?.province}</p>
          </div>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-3">Nearby Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a, i) => (
                  <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-sm font-semibold mb-3">Share</h2>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/b/${listing.id}`)}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              📋 Copy Brochure Link
            </button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-sm font-semibold mb-3">Stats</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Views</span>
                <span>{listing.views || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inquiries</span>
                <span>{listing.inquiries || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
