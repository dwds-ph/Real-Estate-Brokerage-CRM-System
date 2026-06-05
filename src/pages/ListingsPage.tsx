import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useListings } from "@/hooks/useFirestore";
import { createDoc, updateDocById, deleteDocById } from "@/hooks/useFirestore";
import { Listing, ListingStatus, PropertyType, FloodRisk } from "@/types";
import { formatCurrency, getListingStatusColor, cn } from "@/lib/utils";
import PropertyMap, { type ListingMarker } from "@/components/map/PropertyMap";

export default function ListingsPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data: listings, loading, error } = useListings(userProfile?.id);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListingStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    province: "",
    lotArea: "",
    floorArea: "",
    bedrooms: "",
    bathrooms: "",
    furnishing: "",
    propertyType: "condo" as PropertyType,
    status: "available" as ListingStatus,
    floodRisk: "unknown" as FloodRisk,
    amenities: "",
  });

  const filtered = listings
    .filter((l) => filter === "all" || (l as Listing).status === filter)
    .filter((l) => {
      if (!search) {return true;}
      const s = search.toLowerCase();
      const listing = l as Listing;
      return (
        listing.title.toLowerCase().includes(s) ||
        listing.location?.city?.toLowerCase().includes(s)
      );
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {return;}
    try {
      const data = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        location: {
          address: form.address,
          city: form.city,
          province: form.province,
        },
        propertyDetails: {
          lotArea: form.lotArea ? Number(form.lotArea) : null,
          floorArea: form.floorArea ? Number(form.floorArea) : null,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
          furnishing: form.furnishing || null,
        },
        propertyType: form.propertyType,
        status: form.status,
        floodRisk: form.floodRisk,
        amenities: form.amenities
          ? form.amenities.split(",").map((a) => a.trim())
          : [],
        assignedTo: userProfile.id,
        createdBy: userProfile.id,
        media: [],
        views: 0,
        inquiries: 0,
      };

      if (editingId) {
        await updateDocById("listings", editingId, data);
      } else {
        await createDoc("listings", data);
      }
      resetForm();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to save listing:", err);
    }
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm("Delete this listing?")) {return;}
    await deleteDocById("listings", id);
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      price: "",
      address: "",
      city: "",
      province: "",
      lotArea: "",
      floorArea: "",
      bedrooms: "",
      bathrooms: "",
      furnishing: "",
      propertyType: "condo",
      status: "available",
      floodRisk: "unknown",
      amenities: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const editListing = (listing: Listing) => {
    setForm({
      title: listing.title,
      description: listing.description || "",
      price: listing.price.toString(),
      address: listing.location?.address || "",
      city: listing.location?.city || "",
      province: listing.location?.province || "",
      lotArea: listing.propertyDetails?.lotArea?.toString() || "",
      floorArea: listing.propertyDetails?.floorArea?.toString() || "",
      bedrooms: listing.propertyDetails?.bedrooms?.toString() || "",
      bathrooms: listing.propertyDetails?.bathrooms?.toString() || "",
      furnishing: listing.propertyDetails?.furnishing || "",
      propertyType: listing.propertyType,
      status: listing.status,
      floodRisk: listing.floodRisk || "unknown",
      amenities: listing.amenities?.join(", ") || "",
    });
    setEditingId(listing.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-muted-foreground">
            {listings.length} total listings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Map/Grid Toggle */}
          <div className="flex rounded-lg border bg-card overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              📋 Grid
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "map"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              🗺️ Map
            </button>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? "Cancel" : "+ New Listing"}
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border",
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-muted",
          )}
        >
          All ({listings.length})
        </button>
        {(
          [
            "available",
            "under-option",
            "sold",
            "rented",
            "off-market",
          ] as ListingStatus[]
        ).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border capitalize",
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted",
            )}
          >
            {s} ({listings.filter((l) => (l as Listing).status === s).length})
          </button>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or city..."
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      />

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-card p-6 space-y-4"
        >
          <h3 className="font-semibold">
            {editingId ? "Edit Listing" : "New Listing"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Price (₱) *
              </label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Property Type
              </label>
              <select
                value={form.propertyType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    propertyType: e.target.value as PropertyType,
                  })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="condo">Condo</option>
                <option value="house-lot">House & Lot</option>
                <option value="lot-only">Lot Only</option>
                <option value="commercial">Commercial</option>
                <option value="foreclosed">Foreclosed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as ListingStatus })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="available">Available</option>
                <option value="under-option">Under Option</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="off-market">Off-Market</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Flood Risk
              </label>
              <select
                value={form.floodRisk}
                onChange={(e) =>
                  setForm({ ...form, floodRisk: e.target.value as FloodRisk })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="unknown">Unknown</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Makati"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Province</label>
              <input
                type="text"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Lot Area (sqm)
              </label>
              <input
                type="number"
                value={form.lotArea}
                onChange={(e) => setForm({ ...form, lotArea: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Floor Area (sqm)
              </label>
              <input
                type="number"
                value={form.floorArea}
                onChange={(e) =>
                  setForm({ ...form, floorArea: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bedrooms</label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) =>
                  setForm({ ...form, bathrooms: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium mb-1">
                Amenities (comma-separated)
              </label>
              <input
                type="text"
                value={form.amenities}
                onChange={(e) =>
                  setForm({ ...form, amenities: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="school, hospital, mall, LRT"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {editingId ? "Update" : "Create"} Listing
            </button>
          </div>
        </form>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:bg-red-950/20">
          <p className="text-red-700 dark:text-red-400 mb-3">
            Failed to load listings: {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" ? (
        loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            {search
              ? "No listings match your search."
              : "No listings to display on map."}
          </div>
        ) : (
          <PropertyMap
            listings={filtered as ListingMarker[]}
            height="600px"
            showFilters={true}
            showPOIs={true}
          />
        )
      ) : /* Grid View */
      loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          {search ? "No listings match your search." : "No listings yet."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
            const listing = l as Listing;
            return (
              <div
                key={listing.id}
                className="rounded-lg border bg-card overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => navigate(`/listings/${listing.id}`)}
              >
                {/* Image Placeholder */}
                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  {listing.media && listing.media.length > 0 ? (
                    <img
                      src={listing.media[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-muted-foreground/30">
                      🏠
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm line-clamp-1">
                      {listing.title}
                    </h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        getListingStatusColor(listing.status),
                      )}
                    >
                      {listing.status}
                    </span>
                  </div>
                  <p className="text-lg font-bold">
                    {formatCurrency(listing.price)}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {listing.location?.city && (
                      <span>📍 {listing.location.city}</span>
                    )}
                    {listing.propertyDetails?.bedrooms && (
                      <span>🛏️ {listing.propertyDetails.bedrooms} BR</span>
                    )}
                    {listing.propertyDetails?.bathrooms && (
                      <span>🚿 {listing.propertyDetails.bathrooms} BR</span>
                    )}
                    {listing.propertyDetails?.lotArea && (
                      <span>📐 {listing.propertyDetails.lotArea} sqm</span>
                    )}
                    <span className="capitalize">{listing.propertyType}</span>
                    {listing.floodRisk && listing.floodRisk !== "unknown" && (
                      <span>🌊 {listing.floodRisk}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>👁️ {listing.views || 0}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editListing(listing);
                      }}
                      className="hover:text-foreground"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(listing.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
