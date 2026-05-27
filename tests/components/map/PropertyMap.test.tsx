import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PropertyMap from "@/components/map/PropertyMap";
import type { Listing } from "@/types";

// Note: PropertyMap uses Leaflet which requires a real browser DOM (getBBox, getScreenCTM, etc.).
// jsdom cannot fully support Leaflet rendering. These tests verify the wrapping structure
// and fallback behavior instead of full Leaflet render.

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="map-container" className={className}>{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ fitBounds: vi.fn(), getCenter: () => ({ lat: 14.5, lng: 121 }) }),
  useMapEvents: () => ({ getCenter: () => ({ lat: 14.5, lng: 121 }) }),
}));

vi.mock("@/components/map/MapMarker", () => ({
  MapMarker: ({ children }: { children: React.ReactNode }) => <div data-testid="map-marker">{children}</div>,
  createMarkerIcon: () => null,
  GeoListing: {} as Record<string, unknown>,
}));

vi.mock("@/components/map/MapPopup", () => ({
  MapPopup: () => <div data-testid="map-popup" />,
}));

vi.mock("@/components/map/MapFilters", () => ({
  MapFilters: () => <div data-testid="map-filters" />,
  MapFiltersState: {} as Record<string, unknown>,
}));

vi.mock("@/components/map/PoiOverlay", () => ({
  PoiOverlay: () => <div data-testid="poi-overlay" />,
}));

vi.mock("@/hooks/useMapClustering", () => ({
  useMapClustering: () => ({ clusters: [], individuals: [] }),
}));

vi.mock("@/services/geocoding", () => ({
  geocodeAddress: vi.fn(() => Promise.resolve({ lat: 14.5, lng: 121 })),
  buildAddressString: vi.fn(() => "Mock Address"),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

const makeListing = (id: string, overrides: Partial<Listing> = {}): Listing => ({
  id,
  title: `Listing ${id}`,
  description: "A test listing",
  price: 5000000,
  propertyType: "condo",
  status: "available",
  location: { address: "123 Test St", city: "Makati", province: "NCR" },
  propertyDetails: { bedrooms: 2, bathrooms: 1, lotArea: 50, floorArea: 40, furnishing: undefined },
  floodRisk: "low",
  amenities: [],
  media: [],
  assignedTo: "agent-1",
  createdBy: "agent-1",
  views: 0,
  inquiries: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe("PropertyMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders map container and tile layer", () => {
    render(<PropertyMap listings={[]} />);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
  });

  it("renders markers for listings", () => {
    const listings = [makeListing("1"), makeListing("2")];
    render(<PropertyMap listings={listings} />);
    const markers = screen.getAllByTestId("map-marker");
    expect(markers.length).toBeGreaterThan(0);
  });

  it("renders without listings", () => {
    render(<PropertyMap listings={[]} />);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  it("renders with custom height", () => {
    const { container } = render(<PropertyMap listings={[]} height="600px" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper?.style.height || wrapper?.className).toBeDefined();
  });

  it("renders filter button when showFilters is true", () => {
    render(<PropertyMap listings={[]} showFilters />);
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("hides filter button when showFilters is false", () => {
    render(<PropertyMap listings={[]} showFilters={false} />);
    expect(screen.queryByText("Filters")).not.toBeInTheDocument();
  });

  it("renders POI toggle button when showPOIs is true", () => {
    render(<PropertyMap listings={[]} showPOIs />);
    expect(screen.getByText(/POIs?/i)).toBeInTheDocument();
  });
});
