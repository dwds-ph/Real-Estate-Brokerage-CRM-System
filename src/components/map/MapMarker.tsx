/* eslint-disable react-refresh/only-export-components */
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Listing } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────

export interface GeoListing extends Listing {
  _lat: number;
  _lng: number;
  _geocoded: boolean;
}

export interface MapMarkerProps {
  listing: GeoListing;
  isSelected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

// ─── Constants ──────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  "under-option": "#eab308",
  sold: "#6b7280",
  rented: "#3b82f6",
  "off-market": "#ef4444",
};

export const PROPERTY_TYPE_ICONS: Record<string, string> = {
  condo: "🏢",
  "house-lot": "🏠",
  "lot-only": "📐",
  commercial: "🏪",
  foreclosed: "🔑",
};

// ─── Default icon fix ──────────────────────────────────────────────

const defaultIcon = L.divIcon({
  className: "custom-marker-icon",
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -8],
});

L.Marker.prototype.options.icon = defaultIcon;

// ─── Helper: Build marker icon ──────────────────────────────────────

export function createMarkerIcon(
  status: string,
  propertyType: string,
  isCluster = false,
  selected = false,
) {
  const color = STATUS_COLORS[status] || "#3b82f6";
  const emoji = PROPERTY_TYPE_ICONS[propertyType] || "🏠";

  if (isCluster) {
    return L.divIcon({
      className: "cluster-marker-icon",
      html: `<div style="width:40px;height:40px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer">${emoji}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  const size = selected ? 36 : 28;
  const borderWidth = selected ? 3 : 2;
  return L.divIcon({
    className: "property-marker-icon",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:${selected ? 16 : 12}px;border:${borderWidth}px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;transition:all 0.2s">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

// ─── MapMarker Component ────────────────────────────────────────────

export function MapMarker({
  listing,
  isSelected,
  onClick,
  children,
}: MapMarkerProps) {
  if (!listing._lat || !listing._lng) return null;

  const icon = createMarkerIcon(
    listing.status,
    listing.propertyType,
    false,
    isSelected,
  );

  return (
    <Marker
      position={[listing._lat, listing._lng]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup maxWidth={280} minWidth={220}>
        {children}
      </Popup>
    </Marker>
  );
}
