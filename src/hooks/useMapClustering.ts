import { useMemo } from "react";
import { type MapFiltersState } from "@/components/map/MapFilters";

// ─── Types ──────────────────────────────────────────────────────────

export interface ClusterPoint<T> {
  lat: number;
  lng: number;
  count: number;
  items: T[];
}

export interface ClusteringOptions {
  zoom?: number;
  gridSize?: number;
  minClusterSize?: number;
  singleMarker?: boolean;
  filters?: MapFiltersState;
}

// ─── Defaults ───────────────────────────────────────────────────────

const DEFAULT_GRID_SIZE = 0.02; // degrees (~2km at Philippine latitudes)
const DEFAULT_MIN_CLUSTER = 2;

// ─── Hook ───────────────────────────────────────────────────────────

export function useMapClustering<T extends { _lat: number; _lng: number }>(
  listings: T[],
  _bounds?: unknown,
  zoom?: number,
  options: ClusteringOptions = {},
): { clusters: ClusterPoint<T>[]; individuals: T[] } {
  const {
    gridSize = DEFAULT_GRID_SIZE,
    minClusterSize = DEFAULT_MIN_CLUSTER,
    singleMarker = false,
    filters,
  } = options;

  return useMemo(() => {
    if (singleMarker) return { clusters: [], individuals: [] };

    // Apply filters if provided
    const filtered = filters
      ? listings.filter((l) => {
          if (!l._lat || !l._lng) return false;
          if (
            filters.propertyTypes.length > 0 &&
            !filters.propertyTypes.includes(
              (l as unknown as Record<string, string>).propertyType,
            )
          )
            return false;
          if (
            filters.statuses.length > 0 &&
            !filters.statuses.includes(
              (l as unknown as Record<string, string>).status,
            )
          )
            return false;
          if (
            filters.floodRisks.length > 0 &&
            !filters.floodRisks.includes(
              (l as unknown as Record<string, string>).floodRisk,
            )
          )
            return false;
          const price = (l as unknown as Record<string, number>).price;
          if (price < filters.priceMin || price > filters.priceMax)
            return false;
          return true;
        })
      : listings.filter((l) => l._lat && l._lng);

    if (filtered.length <= minClusterSize) {
      return { clusters: [], individuals: filtered };
    }

    // Grid-based clustering
    const activeGridSize =
      zoom !== undefined ? gridSize * (1 + (15 - zoom) * 0.05) : gridSize;
    const grid = new Map<string, T[]>();
    for (const l of filtered) {
      const cx = Math.round(l._lng / activeGridSize);
      const cy = Math.round(l._lat / activeGridSize);
      const key = `${cx},${cy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(l);
    }

    const clusterList: ClusterPoint<T>[] = [];
    const individualList: T[] = [];

    for (const [, group] of grid) {
      if (group.length >= minClusterSize) {
        const avgLat = group.reduce((s, l) => s + l._lat, 0) / group.length;
        const avgLng = group.reduce((s, l) => s + l._lng, 0) / group.length;
        clusterList.push({
          lat: avgLat,
          lng: avgLng,
          count: group.length,
          items: group,
        });
      } else {
        individualList.push(...group);
      }
    }

    return { clusters: clusterList, individuals: individualList };
  }, [listings, zoom, gridSize, minClusterSize, singleMarker, filters]);
}
