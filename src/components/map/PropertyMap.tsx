import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatCurrency } from "@/lib/utils";
import { type MapFilters } from "@/types";
import { getMarkerColor, DEFAULT_VIEWPORT } from "@/lib/mapUtils";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createColoredIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:24px;height:24px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

export interface ListingMarker {
  id: string;
  _lat?: number;
  _lng?: number;
  title?: string;
  price?: number;
  propertyType?: string;
  status?: string;
  address?: string;
  location?: string | { address: string; city: string; province: string };
  images?: string[];
}

interface Props {
  listings: ListingMarker[];
  onMarkerClick?: (id: string) => void;
  filters?: MapFilters;
  height?: string;
  singleMarker?: boolean;
  showFilters?: boolean;
  showPOIs?: boolean;
}

function FitBounds({ listings }: { listings: ListingMarker[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = listings.filter((l) => l._lat && l._lng);
    if (valid.length > 0) {
      const bounds = L.latLngBounds(
        valid.map((l) => [l._lat, l._lng] as [number, number]),
      );
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [listings, map]);
  return null;
}

export default function PropertyMap({
  listings,
  onMarkerClick,
  filters,
}: Props) {
  const filtered = filters
    ? listings.filter((l) => {
        if (filters.propertyType && l.propertyType !== filters.propertyType)
          return false;
        if (filters.status && l.status !== filters.status) return false;
        if (filters.minPrice && l.price != null && l.price < filters.minPrice)
          return false;
        if (filters.maxPrice && l.price != null && l.price > filters.maxPrice)
          return false;
        if (
          filters.location &&
          !l.address?.toLowerCase().includes(filters.location.toLowerCase())
        )
          return false;
        return true;
      })
    : listings;

  return (
    <MapContainer
      center={DEFAULT_VIEWPORT.center}
      zoom={DEFAULT_VIEWPORT.zoom}
      className="w-full h-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds listings={filtered} />
      {filtered.map((listing) =>
        listing._lat && listing._lng ? (
          <Marker
            key={listing.id}
            position={[listing._lat, listing._lng]}
            icon={createColoredIcon(
              getMarkerColor(listing.status || "available"),
            )}
          >
            <Popup>
              <div className="text-sm min-w-[180px]">
                {listing.images?.[0] && (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                )}
                <p className="font-semibold">{listing.title}</p>
                <p className="text-primary font-medium">
                  {formatCurrency(listing.price ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {listing.address ||
                    (typeof listing.location === "string"
                      ? listing.location
                      : listing.location
                        ? `${listing.location.address}, ${listing.location.city}`
                        : "")}
                </p>
                <button
                  onClick={() => onMarkerClick?.(listing.id)}
                  className="mt-2 w-full rounded bg-primary px-2 py-1 text-xs text-primary-foreground"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ) : null,
      )}
    </MapContainer>
  );
}
