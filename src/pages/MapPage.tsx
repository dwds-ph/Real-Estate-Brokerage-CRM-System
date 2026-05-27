import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { type MapFilters } from "@/types";
import { PropertyMap, MapFilters as MapFilterPanel } from "@/components/map";
import { geocodeAddress } from "@/lib/mapUtils";
import { cn } from "@/lib/utils";

const defaultFilters: MapFilters = { propertyType: "", status: "", minPrice: 0, maxPrice: 0, location: "" };

export default function MapPage() {
  const { userProfile } = useAuth();
  const brokerId = userProfile?.brokerId || userProfile?.id;
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MapFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    if (!brokerId) return;
    const q = query(collection(db, "listings"), where("brokerId", "==", brokerId), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const withCoords = await Promise.all(
        items.map(async (l: any) => {
          if (l._lat && l._lng) return l;
          const addr = l.address || l.location;
          if (addr) {
            const coords = await geocodeAddress(addr);
            if (coords) return { ...l, _lat: coords[0], _lng: coords[1] };
          }
          return l;
        }),
      );
      setListings(withCoords);
      setLoading(false);
    });
    return unsub;
  }, [brokerId]);

  const handleMarkerClick = (id: string) => { window.open(`/listings/${id}`, "_self"); };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold">Property Map</h1>
          <p className="text-xs text-muted-foreground">{listings.filter((l) => l._lat).length} properties on map</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium", showFilters ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted")}>
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
          {loading ? (
            <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <PropertyMap listings={listings} onMarkerClick={handleMarkerClick} filters={filters} />
          )}
        </div>
      </div>
    </div>
  );
}
