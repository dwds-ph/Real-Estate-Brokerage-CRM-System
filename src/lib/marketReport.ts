import { Listing, Deal, PropertyType, ListingStatus } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────

export interface MarketOverview {
  totalListings: number;
  totalActive: number;
  totalSold: number;
  totalVolume: number;
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  averagePricePerSqm: number;
  averageDaysOnMarket: number;
}

export interface PropertyTypeBreakdown {
  type: PropertyType;
  label: string;
  count: number;
  percentage: number;
  averagePrice: number;
}

export interface StatusBreakdown {
  status: ListingStatus;
  label: string;
  count: number;
  percentage: number;
}

export interface LocationData {
  city: string;
  province: string;
  count: number;
  averagePrice: number;
  totalVolume: number;
}

export interface MonthlyTrend {
  month: string; // "YYYY-MM"
  yearMonth: number; // sortable: 202401
  averagePrice: number;
  medianPrice: number;
  listingCount: number;
  totalVolume: number;
}

export interface MarketReport {
  overview: MarketOverview;
  propertyTypeBreakdown: PropertyTypeBreakdown[];
  statusBreakdown: StatusBreakdown[];
  locationData: LocationData[];
  priceTrends: MonthlyTrend[];
  generatedAt: number;
}

// ─── Computation ────────────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  condo: "Condo",
  "house-lot": "House & Lot",
  "lot-only": "Lot Only",
  commercial: "Commercial",
  foreclosed: "Foreclosed",
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  available: "Available",
  "under-option": "Under Option",
  sold: "Sold",
  rented: "Rented",
  "off-market": "Off Market",
};

export function computeMarketReport(
  listings: Listing[],
  deals: Deal[],
): MarketReport {
  const now = Date.now();

  // ─── Overview ───────────────────────────────────────────────────
  const prices = listings
    .filter((l) => l.price > 0)
    .map((l) => l.price)
    .sort((a, b) => a - b);

  const activeListings = listings.filter(
    (l) => l.status === "available" || l.status === "under-option",
  );
  const soldListings = listings.filter(
    (l) => l.status === "sold" || l.status === "rented",
  );

  const closedDeals = deals.filter((d) => d.status === "closed");

  const totalVolume = closedDeals.reduce((sum, d) => sum + d.dealPrice, 0);
  const averagePrice =
    prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;
  const medianPrice =
    prices.length > 0
      ? prices.length % 2 === 0
        ? Math.round(
            (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2,
          )
        : prices[Math.floor(prices.length / 2)]
      : 0;

  // Price per sqm
  const listingsWithArea = listings.filter(
    (l) => l.price > 0 && (l.propertyDetails.floorArea || l.propertyDetails.lotArea),
  );
  const avgPricePerSqm =
    listingsWithArea.length > 0
      ? Math.round(
          listingsWithArea.reduce((sum, l) => {
            const area =
              l.propertyDetails.floorArea || l.propertyDetails.lotArea || 1;
            return sum + l.price / area;
          }, 0) / listingsWithArea.length,
        )
      : 0;

  // Days on market (from createdAt to status change or now)
  const daysOnMarket = listings.map((l) =>
    Math.floor(
      ((l.updatedAt || now) - l.createdAt) / (1000 * 60 * 60 * 24),
    ),
  );
  const averageDaysOnMarket =
    daysOnMarket.length > 0
      ? Math.round(
          daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length,
        )
      : 0;

  const overview: MarketOverview = {
    totalListings: listings.length,
    totalActive: activeListings.length,
    totalSold: soldListings.length,
    totalVolume,
    averagePrice,
    medianPrice,
    minPrice: prices[0] || 0,
    maxPrice: prices[prices.length - 1] || 0,
    averagePricePerSqm: avgPricePerSqm,
    averageDaysOnMarket,
  };

  // ─── Property Type Breakdown ────────────────────────────────────
  const typeMap = new Map<PropertyType, { count: number; totalPrice: number }>();
  for (const l of listings) {
    const entry = typeMap.get(l.propertyType) || { count: 0, totalPrice: 0 };
    entry.count++;
    entry.totalPrice += l.price;
    typeMap.set(l.propertyType, entry);
  }

  const propertyTypeBreakdown: PropertyTypeBreakdown[] = (
    Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]
  )
    .map((type) => {
      const data = typeMap.get(type);
      return {
        type,
        label: PROPERTY_TYPE_LABELS[type],
        count: data?.count || 0,
        percentage:
          listings.length > 0
            ? Math.round(((data?.count || 0) / listings.length) * 100)
            : 0,
        averagePrice: data?.count
          ? Math.round(data.totalPrice / data.count)
          : 0,
      };
    })
    .filter((t) => t.count > 0);

  // ─── Status Breakdown ───────────────────────────────────────────
  const statusMap = new Map<ListingStatus, number>();
  for (const l of listings) {
    statusMap.set(l.status, (statusMap.get(l.status) || 0) + 1);
  }

  const statusBreakdown: StatusBreakdown[] = (
    Object.keys(STATUS_LABELS) as ListingStatus[]
  )
    .map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: statusMap.get(status) || 0,
      percentage:
        listings.length > 0
          ? Math.round(((statusMap.get(status) || 0) / listings.length) * 100)
          : 0,
    }))
    .filter((s) => s.count > 0);

  // ─── Location Analysis ──────────────────────────────────────────
  const cityMap = new Map<
    string,
    { count: number; totalPrice: number; province: string }
  >();
  for (const l of listings) {
    const city = l.location.city || "Unknown";
    const entry = cityMap.get(city) || {
      count: 0,
      totalPrice: 0,
      province: l.location.province || "",
    };
    entry.count++;
    entry.totalPrice += l.price;
    cityMap.set(city, entry);
  }

  const locationData: LocationData[] = Array.from(cityMap.entries())
    .map(([city, data]) => ({
      city,
      province: data.province,
      count: data.count,
      averagePrice: Math.round(data.totalPrice / data.count),
      totalVolume: data.totalPrice,
    }))
    .sort((a, b) => b.count - a.count);

  // ─── Monthly Price Trends ───────────────────────────────────────
  const monthMap = new Map<
    string,
    { prices: number[]; totalVolume: number }
  >();

  for (const l of listings) {
    const d = new Date(l.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key) || { prices: [], totalVolume: 0 };
    entry.prices.push(l.price);
    entry.totalVolume += l.price;
    monthMap.set(key, entry);
  }

  // Also add deal months
  for (const d of closedDeals) {
    const date = new Date(d.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key) || { prices: [], totalVolume: 0 };
    entry.prices.push(d.dealPrice);
    entry.totalVolume += d.dealPrice;
    monthMap.set(key, entry);
  }

  const priceTrends: MonthlyTrend[] = Array.from(monthMap.entries())
    .map(([month, data]) => {
      const sorted = [...data.prices].sort((a, b) => a - b);
      const median =
        sorted.length % 2 === 0
          ? Math.round(
              (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2,
            )
          : sorted[Math.floor(sorted.length / 2)];

      const [yearStr, monthStr] = month.split("-");
      const yearMonth =
        parseInt(yearStr) * 100 + parseInt(monthStr);

      return {
        month,
        yearMonth,
        averagePrice: Math.round(
          data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
        ),
        medianPrice: median,
        listingCount: data.prices.length,
        totalVolume: data.totalVolume,
      };
    })
    .sort((a, b) => a.yearMonth - b.yearMonth);

  return {
    overview,
    propertyTypeBreakdown,
    statusBreakdown,
    locationData,
    priceTrends,
    generatedAt: Date.now(),
  };
}

// ─── Formatters ─────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `₱${(value / 1_000).toFixed(0)}K`;
  }
  return `₱${value.toLocaleString()}`;
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `₱${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `₱${(value / 1_000).toFixed(0)}K`;
  }
  return `₱${value.toLocaleString()}`;
}

export function getPropertyTypeColor(type: PropertyType): string {
  const colors: Record<string, string> = {
    condo: "bg-blue-500",
    "house-lot": "bg-green-500",
    "lot-only": "bg-yellow-500",
    commercial: "bg-purple-500",
    foreclosed: "bg-red-500",
  };
  return colors[type] || "bg-gray-500";
}

export function getStatusColor(status: ListingStatus): string {
  const colors: Record<string, string> = {
    available: "bg-green-500",
    "under-option": "bg-blue-500",
    sold: "bg-purple-500",
    rented: "bg-yellow-500",
    "off-market": "bg-gray-500",
  };
  return colors[status] || "bg-gray-500";
}
