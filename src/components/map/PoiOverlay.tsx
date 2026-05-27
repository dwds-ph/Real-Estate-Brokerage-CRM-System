import { useState, useEffect } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

// ─── Types ──────────────────────────────────────────────────────────

export interface PoiPoint {
  lat: number;
  lng: number;
  name: string;
  type: string;
  icon: string;
}

export interface PoiOverlayProps {
  bounds: [number, number] | null;
  visible: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────

const POI_TYPES: Record<
  string,
  { icon: string; label: string; overpassTag: string }
> = {
  school: { icon: "🏫", label: "School", overpassTag: '["amenity"="school"]' },
  hospital: {
    icon: "🏥",
    label: "Hospital",
    overpassTag: '["amenity"="hospital"]',
  },
  mall: { icon: "🛍️", label: "Mall", overpassTag: '["shop"="mall"]' },
  "transit-station": {
    icon: "🚇",
    label: "LRT/MRT",
    overpassTag: '["railway"="station"]["station"="subway"]',
  },
};

const POI_OVERLAY_BOUNDS = 0.05;

// ─── POI Cache ──────────────────────────────────────────────────────

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
  ].join(",");

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
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const pois: PoiPoint[] = [];

    for (const el of data.elements || []) {
      const pLat = el.lat || el.center?.lat;
      const pLng = el.lon || el.center?.lon;
      if (!pLat || !pLng) continue;

      const tags = el.tags || {};
      let poiType = "";
      let poiIcon = "📍";

      if (tags.amenity === "school") {
        poiType = "school";
        poiIcon = "🏫";
      } else if (tags.amenity === "hospital") {
        poiType = "hospital";
        poiIcon = "🏥";
      } else if (tags.shop === "mall") {
        poiType = "mall";
        poiIcon = "🛍️";
      } else if (tags.railway === "station" || tags.station === "subway") {
        poiType = "transit-station";
        poiIcon = "🚇";
      }

      pois.push({
        lat: pLat,
        lng: pLng,
        name: tags.name || `${POI_TYPES[poiType]?.label || "POI"} (nearby)`,
        type: poiType || "other",
        icon: poiIcon,
      });
    }

    poiCache.set(cacheKey, pois);
    return pois;
  } catch {
    return [];
  }
}

// ─── PoiOverlay Component ───────────────────────────────────────────

export function PoiOverlay({ bounds, visible }: PoiOverlayProps) {
  const [pois, setPois] = useState<PoiPoint[]>([]);

  useEffect(() => {
    if (!bounds || !visible) {
      const timer = setTimeout(() => setPois([]), 0);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    fetchNearbyPOIs(bounds[0], bounds[1]).then((results) => {
      if (!cancelled) setPois(results);
    });
    return () => {
      cancelled = true;
    };
  }, [bounds, visible]);

  if (!visible || !bounds || pois.length === 0) return null;

  return (
    <>
      {pois.map((poi, i) => {
        const poiIcon = L.divIcon({
          className: "poi-marker-icon",
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
                <span className="text-muted-foreground">
                  {POI_TYPES[poi.type]?.label || poi.type}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
