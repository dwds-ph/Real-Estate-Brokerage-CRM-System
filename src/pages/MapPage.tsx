import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { MapFilters } from "@/types";
import { PropertyMap, MapFilters as MapFilterPanel } from "@/components/map";
import { geocodeAddress } from "@/lib/mapUtils";
import { cn } from "@/lib/utils";

interface MapListingData {
  id: string;
  title?: string;
  price?: number;
  propertyType?: string;
  status?: string;
  address?: string;
  location?: string;
  description?: string;
  _lat?: number;
  _lng?: number;
  [key: string]: unknown;
}

const defaultFilters: MapFilters = {
  propertyType: "",
  status: "",
  minPrice: 0,
  maxPrice: 0,
  location: "",
};

export default function MapPage() {
  const { userProfile } = useAuth();
  const brokerId = userProfile?.brokerId || userProfile?.id;
  const [listings, setListings] = useState<MapListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    if (!brokerId) {
      setLoading(false); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    const q = query(
      collection(db, "listings"),
      where("brokerId", "==", brokerId),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      async (snap) => {
        try {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const withCoords = await Promise.all(
            items.map(async (l: MapListingData) => {
              if (l._lat && l._lng) {return l;}
              const addr = l.address || l.location;
              if (addr) {
                const coords = await geocodeAddress(addr);
                if (coords) {return { ...l, _lat: coords[0], _lng: coords[1] };}
              }
              return l;
            }),
          );
          setListings(withCoords);
          setError(null);
          setLoading(false);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to process listings",
          );
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [brokerId]);

  const handleMarkerClick = (id: string) => {
    window.open(`/listings/${id}`, "_self");
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // The effect will re-run because `brokerId` hasn't changed —
    // force re-subscribe by toggling a counter.
    window.location.reload();
  };

  // ─── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2 shrink-0">
          <div>
            <h1 className="text-xl font-bold">Property Map</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2 shrink-0">
          <h1 className="text-xl font-bold">Property Map</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700 max-w-lg">
            <p className="font-medium">Failed to load property map</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty State ───────────────────────────────────────────────────
  if (listings.length === 0) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2 shrink-0">
          <div>
            <h1 className="text-xl font-bold">Property Map</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <p className="text-lg">No properties on the map yet</p>
            <p className="mt-2 text-sm">
              Add listings with addresses to see them plotted on the map.
            </p>
            <button
              onClick={() => window.open("/listings/new", "_self")}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Add Listing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold">Property Map</h1>
          <p className="text-xs text-muted-foreground">
            {listings.filter((l) => l._lat).length} properties on map
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium self-start sm:self-auto",
            showFilters
              ? "bg-primary/10 border-primary"
              : "bg-card hover:bg-muted",
          )}>
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        {showFilters && (
          <div className="w-56 shrink-0 rounded-lg border bg-card overflow-y-auto">
            <MapFilterPanel filters={filters} onChange={setFilters} />
          </div>
        )}
        <div className="flex-1 rounded-lg overflow-hidden border">
          <PropertyMap
            listings={listings}
            onMarkerClick={handleMarkerClick}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
}
