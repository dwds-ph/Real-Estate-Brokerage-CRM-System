const DEFAULT_VIEWPORT = {
  center: [14.5995, 120.9842] as [number, number],
  zoom: 12,
};

const geocodeCache = new Map<string, [number, number]>();

export async function geocodeAddress(
  address: string,
): Promise<[number, number] | null> {
  if (!address || !address.trim()) {return null;}
  const key = address.toLowerCase().trim();
  if (geocodeCache.has(key)) {return geocodeCache.get(key)!;}

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=ph`,
      { headers: { "User-Agent": "RealEstateCRM/1.0" } },
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [
        parseFloat(data[0].lat),
        parseFloat(data[0].lon),
      ];
      geocodeCache.set(key, coords);
      return coords;
    }
  } catch {
    // fallback
  }
  return null;
}

export function getMarkerColor(status: string): string {
  const colors: Record<string, string> = {
    available: "#22c55e",
    "under-option": "#eab308",
    sold: "#ef4444",
    rented: "#3b82f6",
    "off-market": "#6b7280",
  };
  return colors[status] || "#6b7280";
}

export { DEFAULT_VIEWPORT, geocodeCache };
