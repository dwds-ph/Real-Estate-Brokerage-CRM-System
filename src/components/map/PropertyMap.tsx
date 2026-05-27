import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Listing } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { geocodeAddress, buildAddressString } from '@/services/geocoding';

// ─── Types ──────────────────────────────────────────────────────────

interface GeoListing extends Listing {
  _lat: number;
  _lng: number;
  _geocoded: boolean;
}

export interface MapFilters {
  propertyTypes: string[];
  statuses: string[];
  floodRisks: string[];
  priceMin: number;
  priceMax: number;
}

interface ClusterPoint {
  lat: number;
  lng: number;
  count: number;
  listings: GeoListing[];
}

interface PoiPoint {
  lat: number;
  lng: number;
  name: string;
  type: string;
  icon: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842]; // Manila
const DEFAULT_ZOOM = 11;
const CLUSTER_GRID_SIZE = 0.02; // degrees (~2km at Philippine latitudes)
const CLUSTER_MIN = 2; // minimum count to form a cluster

const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  'under-option': '#eab308',
  sold: '#6b7280',
  rented: '#3b82f6',
  'off-market': '#ef4444',
};

const PROPERTY_TYPE_ICONS: Record<string, string> = {
  condo: '🏢',
  'house-lot': '🏠',
  'lot-only': '📐',
  commercial: '🏪',
  foreclosed: '🔑',
};

const POI_TYPES: Record<string, { icon: string; label: string; overpassTag: string }> = {
  school: { icon: '🏫', label: 'School', overpassTag: '["amenity"="school"]' },
  hospital: { icon: '🏥', label: 'Hospital', overpassTag: '["amenity"="hospital"]' },
  mall: { icon: '🛍️', label: 'Mall', overpassTag: '["shop"="mall"]' },
  'transit-station': { icon: '🚇', label: 'LRT/MRT', overpassTag: '["railway"="station"]["station"="subway"]' },
};

const POI_OVERLAY_BOUNDS = 0.05; // degrees around viewport center for POI queries

// ─── Fix Leaflet default icon ──────────────────────────────────────

const defaultIcon = L.divIcon({
  className: 'custom-marker-icon',
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -8],
});

L.Marker.prototype.options.icon = defaultIcon;

// ─── Helper: Build marker icon ──────────────────────────────────────

function createMarkerIcon(status: string, propertyType: string, isCluster = false, selected = false) {
  const color = STATUS_COLORS[status] || '#3b82f6';
  const emoji = PROPERTY_TYPE_ICONS[propertyType] || '🏠';

  if (isCluster) {
    return L.divIcon({
      className: 'cluster-marker-icon',
      html: `<div style="width:40px;height:40px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer">${emoji}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  const size = selected ? 36 : 28;
  const borderWidth = selected ? 3 : 2;
  return L.divIcon({
    className: 'property-marker-icon',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:${selected ? 16 : 12}px;border:${borderWidth}px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;transition:all 0.2s">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

// ─── Overpass POI Fetcher ───────────────────────────────────────────

const poiCache = new Map<string, PoiPoint[]>();

async function fetchNearbyPOIs(lat: number, lng: number): Promise<PoiPoint[]> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = poiCache.get(cacheKey);
  if (cached) return cached;

  const bbox = [
    (lng - POI_OVERLAY_BOUNDS).toFixed(4),
    (lat - POI_OVERLAY_BOUNDS).toFixed(4),
    (lng + POI_OVERLAY_BOUNDS).toFixed(4),
    (lat + POI_OVERLAY_BOUNDS).toFixed(4),
  ].join(',');

  // Build Overpass query for schools, hospitals, malls, transit stations
  const overpassQuery = `[out:json][timeout:10];(
    node["amenity"="school"](${bbox});
    node["amenity"="hospital"](${bbox});
    node["shop"="mall"](${bbox});
    node["railway"="station"](${bbox});
    way["amenity"="school"](${bbox});
    way["amenity"="hospital"](${bbox});
    way["shop"="mall"](${bbox});
    way["railway"="station"](${bbox});
  );out center 20;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const pois: PoiPoint[] = [];

    for (const el of data.elements || []) {
      const pLat = el.lat || el.center?.lat;
      const pLng = el.lon || el.center?.lon;
      if (!pLat || !pLng) continue;

      const tags = el.tags || {};
      let poiType = '';
      let poiIcon = '📍';

      if (tags.amenity === 'school') {
        poiType = 'school';
        poiIcon = '🏫';
      } else if (tags.amenity === 'hospital') {
        poiType = 'hospital';
        poiIcon = '🏥';
      } else if (tags.shop === 'mall') {
        poiType = 'mall';
        poiIcon = '🛍️';
      } else if (tags.railway === 'station' || tags.station === 'subway') {
        poiType = 'transit-station';
        poiIcon = '🚇';
      }

      pois.push({
        lat: pLat,
        lng: pLng,
        name: tags.name || `${POI_TYPES[poiType]?.label || 'POI'} (nearby)`,
        type: poiType || 'other',
        icon: poiIcon,
      });
    }

    poiCache.set(cacheKey, pois);
    return pois;
  } catch {
    return [];
  }
}

// ─── Sub-components ─────────────────────────────────────────────────

function MapBoundsUpdater({ listings }: { listings: GeoListing[] }) {
  const map = useMap();

  useEffect(() => {
    if (listings.length === 0) return;
    const valid = listings.filter((l) => l._lat && l._lng);
    if (valid.length === 0) return;

    const latLngs = valid.map((l) => L.latLng(l._lat, l._lng));
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [listings, map]);

  return null;
}

function OverpassPoiLayer({ center }: { center: [number, number] | null }) {
  const [pois, setPois] = useState<PoiPoint[]>([]);

  useEffect(() => {
    if (!center) return;
    let cancelled = false;
    fetchNearbyPOIs(center[0], center[1]).then((results) => {
      if (!cancelled) setPois(results);
    });
    return () => { cancelled = true; };
  }, [center]);

  if (pois.length === 0) return null;

  return (
    <>
      {pois.map((poi, i) => {
        const poiIcon = L.divIcon({
          className: 'poi-marker-icon',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:14px;border:1px solid #ddd;box-shadow:0 1px 3px rgba(0,0,0,0.2);cursor:default">${poi.icon}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        return (
          <Marker key={`poi-${i}`} position={[poi.lat, poi.lng]} icon={poiIcon}>
            <Popup>
              <div className="text-xs max-w-[180px]">
                <strong>{poi.name}</strong>
                <br />
                <span className="text-muted-foreground">{POI_TYPES[poi.type]?.label || poi.type}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// ─── Main PropertyMap Component ──────────────────────────────────────

interface PropertyMapProps {
  listings: Listing[];
  height?: string;
  singleMarker?: boolean;
  showFilters?: boolean;
  showPOIs?: boolean;
}

export default function PropertyMap({
  listings,
  height = '500px',
  singleMarker = false,
  showFilters = true,
  showPOIs = true,
}: PropertyMapProps) {
  const navigate = useNavigate();
  const [geoListings, setGeoListings] = useState<GeoListing[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [filters, setFilters] = useState<MapFilters>({
    propertyTypes: [],
    statuses: [],
    floodRisks: [],
    priceMin: 0,
    priceMax: Infinity,
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showPois, setShowPois] = useState(showPOIs);
  const prevListingsRef = useRef<string>('');

  // Geocode listings that don't have lat/lng yet
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
          listing.location?.address || '',
          listing.location?.city || '',
          listing.location?.province || '',
        );
        const geo = await geocodeAddress(addr);
        if (cancelled) return;
        results.push({
          ...listing,
          _lat: geo?.lat || 0,
          _lng: geo?.lng || 0,
          _geocoded: !!geo,
        });
      }

      if (!cancelled) {
        setGeoListings(results);
        setGeocoding(false);
      }
    }

    doGeocode();
    return () => { cancelled = true; };
  }, [listings]);

  // Compute clusters
  type ClusterResult = { clusters: ClusterPoint[]; individuals: GeoListing[] };
  const clusters = useMemo<ClusterResult>(() => {
    if (singleMarker) return { clusters: [], individuals: [] };

    const filtered = geoListings.filter((l) => {
      if (!l._lat || !l._lng) return false;
      if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(l.propertyType)) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(l.status)) return false;
      if (filters.floodRisks.length > 0 && !filters.floodRisks.includes(l.floodRisk)) return false;
      if (l.price < filters.priceMin || l.price > filters.priceMax) return false;
      return true;
    });

    if (filtered.length <= CLUSTER_MIN) {
      return { clusters: [] as ClusterPoint[], individuals: filtered };
    }

    // Grid-based clustering
    const grid = new Map<string, GeoListing[]>();
    for (const l of filtered) {
      const cx = Math.round(l._lng / CLUSTER_GRID_SIZE);
      const cy = Math.round(l._lat / CLUSTER_GRID_SIZE);
      const key = `${cx},${cy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(l);
    }

    const clusterList: ClusterPoint[] = [];
    const individualList: GeoListing[] = [];

    for (const [, group] of grid) {
      if (group.length >= CLUSTER_MIN) {
        const avgLat = group.reduce((s, l) => s + l._lat, 0) / group.length;
        const avgLng = group.reduce((s, l) => s + l._lng, 0) / group.length;
        clusterList.push({ lat: avgLat, lng: avgLng, count: group.length, listings: group });
      } else {
        individualList.push(...group);
      }
    }

    return { clusters: clusterList, individuals: individualList };
  }, [geoListings, filters, singleMarker]);

  // Compute unique filter options
  const filterOptions = useMemo(() => {
    const types = new Set<string>();
    const statuses = new Set<string>();
    const risks = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const l of geoListings) {
      types.add(l.propertyType);
      statuses.add(l.status);
      if (l.floodRisk) risks.add(l.floodRisk);
      if (l.price < minPrice) minPrice = l.price;
      if (l.price > maxPrice) maxPrice = l.price;
    }

    return {
      propertyTypes: [...types],
      statuses: [...statuses],
      floodRisks: [...risks],
      priceMin: minPrice === Infinity ? 0 : minPrice,
      priceMax: maxPrice,
    };
  }, [geoListings]);

  // Toggle filter helper
  const toggleFilter = useCallback(
    (key: keyof MapFilters, value: string) => {
      setFilters((prev) => {
        const arr = [...(prev[key] as string[])];
        const idx = arr.indexOf(value);
        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(value);
        return { ...prev, [key]: arr };
      });
    },
    [],
  );

  // If geocoding and no listings yet, show loading
  const showLoading = geocoding && geoListings.length === 0;

  return (
    <div className="relative rounded-lg overflow-hidden border" style={{ height }}>
      {/* Loading overlay */}
      {showLoading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Geocoding properties...</span>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map event listener for center changes */}
        <MapCenterTracker onCenterChange={setMapCenter} />

        {/* Fit bounds when listings load */}
        {!singleMarker && geoListings.length > 0 && (
          <MapBoundsUpdater listings={geoListings} />
        )}

        {/* Cluster markers */}
        {!singleMarker &&
          clusters.clusters.map((cl, i) => {
            const representative = cl.listings[0];
            const clusterIcon = createMarkerIcon(representative.status, representative.propertyType, true);
            return (
              <Marker
                key={`cluster-${i}`}
                position={[cl.lat, cl.lng]}
                icon={clusterIcon}
              >
                <Popup>
                  <div className="text-sm max-w-[200px] space-y-1">
                    <strong>{cl.count} properties</strong>
                    <div className="text-xs text-muted-foreground">
                      {cl.listings.map((l) => l.title).slice(0, 3).join(', ')}
                      {cl.listings.length > 3 && ` +${cl.listings.length - 3} more`}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Individual property markers */}
        {(singleMarker ? geoListings.filter((l) => l._lat && l._lng) : clusters.individuals).map((listing) => {
          if (!listing._lat || !listing._lng) return null;
          const icon = createMarkerIcon(listing.status, listing.propertyType, false, listing.id === selectedId);
          return (
            <Marker
              key={listing.id}
              position={[listing._lat, listing._lng]}
              icon={icon}
              eventHandlers={{
                click: () => setSelectedId(listing.id),
              }}
            >
              <Popup maxWidth={280} minWidth={220}>
                <div className="space-y-2" style={{ minWidth: 200 }}>
                  {/* Thumbnail */}
                  {listing.media && listing.media.length > 0 ? (
                    <img
                      src={listing.media[0]}
                      alt={listing.title}
                      className="w-full h-32 object-cover rounded-md"
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <div className="w-full h-20 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-md text-2xl">
                      🏠
                    </div>
                  )}
                  {/* Info */}
                  <div>
                    <h3 className="font-medium text-sm leading-tight">{listing.title}</h3>
                    <p className="text-base font-bold text-primary mt-1">{formatCurrency(listing.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', 'bg-green-100 text-green-800')}>
                        {listing.status}
                      </span>
                      <span className="text-xs capitalize text-muted-foreground">{listing.propertyType}</span>
                    </div>
                    {listing.location?.city && (
                      <p className="text-xs text-muted-foreground mt-1">📍 {listing.location.city}</p>
                    )}
                  </div>
                  {/* View Details button */}
                  <button
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 text-center"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* POI overlay */}
        {showPois && mapCenter && <OverpassPoiLayer center={mapCenter} />}
      </MapContainer>

      {/* Filter toggle button */}
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

          {/* POI toggle */}
          <button
            onClick={() => setShowPois(!showPois)}
            className={cn(
              'absolute top-3 left-3 z-[1000] rounded-lg border shadow-sm px-2.5 py-1.5 text-xs font-medium transition-colors',
              showPois
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
            )}
          >
            {showPois ? '🏪 POIs On' : '🏪 POIs Off'}
          </button>

          {/* Filter panel */}
          {showFilterPanel && (
            <div className="absolute top-12 right-3 z-[1000] rounded-lg border bg-card shadow-lg p-4 w-64 max-h-[60vh] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Filters</h3>
                <button
                  onClick={() => {
                    setFilters({ propertyTypes: [], statuses: [], floodRisks: [], priceMin: 0, priceMax: Infinity });
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Property Type */}
              {filterOptions.propertyTypes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Property Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {filterOptions.propertyTypes.map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleFilter('propertyTypes', t)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs border transition-colors',
                          filters.propertyTypes.includes(t)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card hover:bg-muted',
                        )}
                      >
                        {PROPERTY_TYPE_ICONS[t] || '🏠'} {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              {filterOptions.statuses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {filterOptions.statuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleFilter('statuses', s)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs border transition-colors',
                          filters.statuses.includes(s)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card hover:bg-muted',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Flood Risk */}
              {filterOptions.floodRisks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Flood Risk</p>
                  <div className="flex flex-wrap gap-1.5">
                    {filterOptions.floodRisks.map((r) => (
                      <button
                        key={r}
                        onClick={() => toggleFilter('floodRisks', r)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs border transition-colors',
                          filters.floodRisks.includes(r)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card hover:bg-muted',
                        )}
                      >
                        🌊 {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Geocoding status */}
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">
                  {geoListings.filter((l) => l._geocoded).length}/{geoListings.length} geocoded
                  {geocoding && <span className="ml-1 animate-pulse">⏳</span>}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!showLoading && geoListings.length > 0 && geoListings.every((l) => !l._geocoded) && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/40">
          <div className="rounded-lg border bg-card p-6 text-center max-w-sm">
            <p className="text-lg mb-2">📍</p>
            <p className="text-sm font-medium">Unable to geocode listings</p>
            <p className="text-xs text-muted-foreground mt-1">
              Addresses could not be found on the map. Check the location fields in each listing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Track map center for POI queries ──────────────────────

function MapCenterTracker({ onCenterChange }: { onCenterChange: (center: [number, number]) => void }) {
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
