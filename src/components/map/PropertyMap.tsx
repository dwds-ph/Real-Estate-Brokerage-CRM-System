import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { Listing } from "@/types";
import { cn } from "@/lib/utils";
import { geocodeAddress, buildAddressString } from "@/services/geocoding";
import { MapMarker, GeoListing, createMarkerIcon } from "./MapMarker";
import { MapPopup } from "./MapPopup";
import { MapFilters as MapFiltersPanel, MapFiltersState } from "./MapFilters";
import { PoiOverlay } from "./PoiOverlay";
import { useMapClustering } from "@/hooks/useMapClustering";

export type { MapFiltersState as MapFilters };

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];
const DEFAULT_ZOOM = 11;

function MapBoundsUpdater({ listings }: { listings: GeoListing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    const valid = listings.filter((l) => l._lat && l._lng);
    if (valid.length === 0) return;
    const latLngs = valid.map((l) => L.latLng(l._lat, l._lng));
    map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 15 });
  }, [listings, map]);
  return null;
}

function MapCenterTracker({
  onCenterChange,
}: {
  onCenterChange: (center: [number, number]) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onCenterChange([c.lat, c.lng]);
    },
  });
  useEffect(() => {
    const c = map.getCenter();
    onCenterChange([c.lat, c.lng]);
  }, [map, onCenterChange]);
  return null;
}

interface PropertyMapProps {
  listings: Listing[];
  height?: string;
  singleMarker?: boolean;
  showFilters?: boolean;
  showPOIs?: boolean;
}

export default function PropertyMap({
  listings,
  height = "500px",
  singleMarker = false,
  showFilters = true,
  showPOIs = true,
}: PropertyMapProps) {
  const navigate = useNavigate();
  const [geoListings, setGeoListings] = useState<GeoListing[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [filters, setFilters] = useState<MapFiltersState>({
    propertyTypes: [], statuses: [], floodRisks: [], priceMin: 0, priceMax: Infinity,
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showPois, setShowPois] = useState(showPOIs);
  const prevListingsRef = useRef<string>("");

  useEffect(() => {
    const key = JSON.stringify(listings.map((l) => l.id));
    if (key === prevListingsRef.current) return;
    prevListingsRef.current = key;
    let cancelled = false;
    async function doGeocode() {
      setGeocoding(true);
      const results: GeoListing[] = [];
      for (const listing of listings) {
        if (cancelled) return;
        const addr = buildAddressString(
          listing.location?.address || "",
          listing.location?.city || "",
          listing.location?.province || "",
        );
        const geo = await geocodeAddress(addr);
        if (cancelled) return;
        results.push({ ...listing, _lat: geo?.lat || 0, _lng: geo?.lng || 0, _geocoded: !!geo });
      }
      if (!cancelled) { setGeoListings(results); setGeocoding(false); }
    }
    doGeocode();
    return () => { cancelled = true; };
  }, [listings]);

  const { clusters, individuals } = useMapClustering(geoListings, null, DEFAULT_ZOOM, {
    singleMarker, filters,
  });

  const filterOptions = useMemo(() => {
    const types = new Set<string>(), statuses = new Set<string>(), risks = new Set<string>();
    let minPrice = Infinity, maxPrice = 0;
    for (const l of geoListings) {
      types.add(l.propertyType);
      statuses.add(l.status);
      if (l.floodRisk) risks.add(l.floodRisk);
      if (l.price < minPrice) minPrice = l.price;
      if (l.price > maxPrice) maxPrice = l.price;
    }
    return {
      propertyTypes: [...types], statuses: [...statuses], floodRisks: [...risks],
      priceMin: minPrice === Infinity ? 0 : minPrice, priceMax: maxPrice,
    };
  }, [geoListings]);

  const toggleFilter = useCallback((key: keyof MapFiltersState, value: string) => {
    setFilters((prev) => {
      const arr = [...(prev[key] as string[])];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [key]: arr };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ propertyTypes: [], statuses: [], floodRisks: [], priceMin: 0, priceMax: Infinity });
  }, []);

  const showLoading = geocoding && geoListings.length === 0;
  const markersToShow = singleMarker
    ? geoListings.filter((l) => l._lat && l._lng)
    : individuals;

  return (
    <div className="relative rounded-lg overflow-hidden border" style={{ height }}>
      {showLoading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Geocoding properties...</span>
          </div>
        </div>
      )}
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full z-0" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterTracker onCenterChange={setMapCenter} />
        {!singleMarker && geoListings.length > 0 && <MapBoundsUpdater listings={geoListings} />}
        {!singleMarker && clusters.map((cl, i) => {
          const rep = cl.items[0];
          const clusterIcon = createMarkerIcon(rep.status, rep.propertyType, true);
          return (
            <Marker key={`cluster-${i}`} position={[cl.lat, cl.lng]} icon={clusterIcon}>
              <Popup>
                <div className="text-sm max-w-[200px] space-y-1">
                  <strong>{cl.count} properties</strong>
                  <div className="text-xs text-muted-foreground">
                    {cl.items.map((l) => l.title).slice(0, 3).join(", ")}
                    {cl.items.length > 3 && ` +${cl.items.length - 3} more`}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {markersToShow.map((listing) => (
          <MapMarker key={listing.id} listing={listing} isSelected={listing.id === selectedId} onClick={() => setSelectedId(listing.id)}>
            <MapPopup listing={listing} onNavigate={(id) => navigate(`/listings/${id}`)} />
          </MapMarker>
        ))}
        {showPois && <PoiOverlay bounds={mapCenter} visible={true} />}
      </MapContainer>
      {showFilters && !singleMarker && (
        <>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="absolute top-3 right-3 z-[1000] rounded-lg bg-white dark:bg-gray-800 border shadow-sm px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1"
          >
            <span>🔍</span>
            <span>Filters</span>
            {(filters.propertyTypes.length > 0 || filters.statuses.length > 0 || filters.floodRisks.length > 0) && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center">
                {filters.propertyTypes.length + filters.statuses.length + filters.floodRisks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowPois(!showPois)}
            className={cn("absolute top-3 left-3 z-[1000] rounded-lg border shadow-sm px-2.5 py-1.5 text-xs font-medium transition-colors", showPois ? "bg-primary text-primary-foreground border-primary" : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700")}
          >
            {showPois ? "🏪 POIs On" : "🏪 POIs Off"}
          </button>
          <MapFiltersPanel
            filters={filters}
            onFilterChange={toggleFilter}
            onReset={resetFilters}
            filterOptions={filterOptions}
            totalGeocoded={geoListings.filter((l) => l._geocoded).length}
            totalListings={geoListings.length}
            geocoding={geocoding}
            showFilterPanel={showFilterPanel}
          />
        </>
      )}
      {!showLoading && geoListings.length > 0 && geoListings.every((l) => !l._geocoded) && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/40">
          <div className="rounded-lg border bg-card p-6 text-center max-w-sm">
            <p className="text-lg mb-2">📍</p>
            <p className="text-sm font-medium">Unable to geocode listings</p>
            <p className="text-xs text-muted-foreground mt-1">Addresses could not be found on the map. Check the location fields in each listing.</p>
          </div>
        </div>
      )}
    </div>
  );
}
