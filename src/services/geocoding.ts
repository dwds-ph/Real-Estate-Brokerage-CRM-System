// ─── Geocoding Service ─────────────────────────────────────────────
// Uses OpenStreetMap/Nominatim free API with rate limiting + sessionStorage caching

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const CACHE_PREFIX = 'geocode_';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
}

interface GeocodedPoint {
  lat: number;
  lng: number;
  displayName: string;
}

// Nominatim requires max 1 request/second
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100;

function getCacheKey(address: string): string {
  return CACHE_PREFIX + address.toLowerCase().replace(/\s+/g, '_').slice(0, 200);
}

function getFromCache(address: string): GeocodedPoint | null {
  try {
    const cached = sessionStorage.getItem(getCacheKey(address));
    if (cached) {
      return JSON.parse(cached) as GeocodedPoint;
    }
  } catch {
    // Corrupted cache entry
  }
  return null;
}

function setCache(address: string, point: GeocodedPoint): void {
  try {
    sessionStorage.setItem(getCacheKey(address), JSON.stringify(point));
  } catch {
    // sessionStorage full or unavailable
  }
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Geocode a full address string to lat/lng using Nominatim.
 * Results are cached in sessionStorage to minimize API calls.
 */
export async function geocodeAddress(address: string): Promise<GeocodedPoint | null> {
  if (!address || address.trim().length === 0) return null;

  // Check cache first
  const cached = getFromCache(address);
  if (cached) return cached;

  try {
    await rateLimit();

    const url = new URL(NOMINATIM_BASE);
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '0');

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'RealEstateCRM/1.0 (brokerage-internal)',
      },
    });

    if (!res.ok) {
      console.warn(`Nominatim geocoding failed: ${res.status} for "${address}"`);
      return null;
    }

    const results: NominatimResult[] = await res.json();

    if (!results || results.length === 0) {
      console.warn(`No geocoding results for "${address}"`);
      return null;
    }

    const best = results[0];
    const point: GeocodedPoint = {
      lat: parseFloat(best.lat),
      lng: parseFloat(best.lon),
      displayName: best.display_name,
    };

    // Cache for future lookups
    setCache(address, point);

    return point;
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

/**
 * Geocode multiple addresses in parallel with rate limiting.
 * Returns a Map of address → GeocodedPoint (null if failed).
 */
export async function geocodeAddresses(
  addresses: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, GeocodedPoint | null>> {
  const results = new Map<string, GeocodedPoint | null>();
  const unique = [...new Set(addresses.filter((a) => a.trim().length > 0))];

  for (let i = 0; i < unique.length; i++) {
    const addr = unique[i];
    results.set(addr, await geocodeAddress(addr));
    onProgress?.(i + 1, unique.length);
  }

  return results;
}

/**
 * Build a searchable address string from listing location fields.
 */
export function buildAddressString(
  address: string,
  city: string,
  province: string,
): string {
  const parts = [address, city, province, 'Philippines'].filter(Boolean);
  return parts.join(', ');
}
