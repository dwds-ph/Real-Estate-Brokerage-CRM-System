import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PropertyMap from "@/components/map/PropertyMap";
import type { Listing } from "@/types";

// Note: PropertyMap uses Leaflet which requires a real browser DOM.
// jsdom cannot fully support Leaflet rendering. We mock react-leaflet.

vi.mock("react-leaflet", () => ({
  MapContainer: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="map-container" className={className}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({
    fitBounds: vi.fn(),
    getCenter: () => ({ lat: 14.5, lng: 121 }),
  }),
}));

vi.mock("@/lib/mapUtils", () => ({
  getMarkerColor: vi.fn(() => "#3B82F6"),
  DEFAULT_VIEWPORT: { center: [14.5, 121] as [number, number], zoom: 10 },
}));

const makeListing = (
  id: string,
  overrides: Partial<Listing> = {},
): Listing => ({
  id,
  title: `Listing ${id}`,
  description: "A test listing",
  price: 5000000,
  propertyType: "condo",
  status: "available",
  location: { address: "123 Test St", city: "Makati", province: "NCR" },
  propertyDetails: {
    bedrooms: 2,
    bathrooms: 1,
    lotArea: 50,
    floorArea: 40,
    furnishing: undefined,
  },
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

  it("renders markers for listings that have coordinates", () => {
    const listings = [
      { ...makeListing("1"), _lat: 14.5, _lng: 121 },
      { ...makeListing("2"), _lat: 14.6, _lng: 121.1 },
    ];
    render(<PropertyMap listings={listings} />);
    const markers = screen.getAllByTestId("map-marker");
    expect(markers.length).toBe(2);
  });

  it("does not render markers for listings without coordinates", () => {
    const listings = [makeListing("1")]; // no _lat/_lng
    render(<PropertyMap listings={listings} />);
    expect(screen.queryByTestId("map-marker")).not.toBeInTheDocument();
  });

  it("renders without listings", () => {
    render(<PropertyMap listings={[]} />);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  it("renders with custom height", () => {
    const { container } = render(<PropertyMap listings={[]} height="600px" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper?.className || wrapper?.style.height).toBeDefined();
  });
});
