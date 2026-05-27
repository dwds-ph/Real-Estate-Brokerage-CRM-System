import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ListingsPage from "@/pages/ListingsPage";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    userProfile: { id: "user-1", displayName: "Agent", role: "agent" },
  }),
}));

// Mock useFirestore hooks
const mockUseListings = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useFirestore", () => ({
  useListings: () => mockUseListings(),
  createDoc: vi.fn(),
  updateDocById: vi.fn(),
  deleteDocById: vi.fn(),
}));

// Mock PropertyMap
vi.mock("@/components/map/PropertyMap", () => ({
  default: () => <div data-testid="property-map" />,
}));

const mockListings = [
  {
    id: "listing-1",
    title: "Modern Condo in Makati",
    description: "A beautiful condo",
    price: 5000000,
    propertyType: "condo",
    status: "available",
    location: { address: "123 St", city: "Makati", province: "NCR" },
    propertyDetails: {
      bedrooms: 2,
      bathrooms: 1,
      lotArea: 50,
      floorArea: 40,
      furnishing: null,
    },
    floodRisk: "low",
    amenities: ["pool", "gym"],
    media: [],
    assignedTo: "user-1",
    createdBy: "user-1",
    views: 10,
    inquiries: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <ListingsPage />
    </MemoryRouter>,
  );

describe("ListingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders listings page", () => {
    mockUseListings.mockReturnValue({ data: [], loading: false });
    renderPage();
    expect(screen.getByText("Listings")).toBeInTheDocument();
  });

  it("shows listing cards", () => {
    mockUseListings.mockReturnValue({ data: mockListings, loading: false });
    renderPage();
    expect(screen.getByText("Modern Condo in Makati")).toBeInTheDocument();
    expect(screen.getByText("1 total listings")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    mockUseListings.mockReturnValue({ data: [], loading: false });
    renderPage();
    expect(screen.getByText("0 total listings")).toBeInTheDocument();
  });

  it("shows map toggle", () => {
    mockUseListings.mockReturnValue({ data: mockListings, loading: false });
    renderPage();
    expect(screen.getByText(/Grid/)).toBeInTheDocument();
    expect(screen.getByText(/Map/)).toBeInTheDocument();
  });

  it("switches to map view and shows PropertyMap", () => {
    mockUseListings.mockReturnValue({ data: mockListings, loading: false });
    renderPage();

    // Click Map toggle
    fireEvent.click(screen.getByText(/Map/));
    expect(screen.getByTestId("property-map")).toBeInTheDocument();
  });

  it("shows filter chips for listing statuses", () => {
    mockUseListings.mockReturnValue({ data: mockListings, loading: false });
    renderPage();
    expect(screen.getByText("All (1)")).toBeInTheDocument();
    expect(screen.getByText("available")).toBeInTheDocument();
  });

  it("shows search input", () => {
    mockUseListings.mockReturnValue({ data: [], loading: false });
    renderPage();
    expect(
      screen.getByPlaceholderText("Search by title or city..."),
    ).toBeInTheDocument();
  });
});
