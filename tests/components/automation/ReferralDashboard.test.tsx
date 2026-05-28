import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ReferralDashboard from "@/components/automation/ReferralDashboard";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { uid: "user-1" },
    userProfile: { id: "user-1", role: "broker", displayName: "Test Broker" },
    loading: false,
  })),
}));

// Mock useFirestore hooks
const mockDeals = vi.fn();

vi.mock("@/hooks/useFirestore", () => ({
  useCollection: vi.fn((collectionName: string) => {
    if (collectionName === "deals") {return { data: mockDeals(), loading: false, error: null };}
    return { data: [], loading: false, error: null };
  }),
  createDoc: vi.fn(),
  updateDocById: vi.fn(),
}));

// Mock referral service
const mockFetchReferrals = vi.fn();
const mockUpdateReferral = vi.fn();

vi.mock("@/services/referralService", () => ({
  fetchReferrals: (...args: unknown[]) => mockFetchReferrals(...args),
  updateReferral: (...args: unknown[]) => mockUpdateReferral(...args),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  formatCurrency: vi.fn((amount: number) => `₱${(amount / 1000).toFixed(0)}k`),
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

const sampleReferrals = [
  {
    id: "ref-1",
    dealId: "deal-1",
    referrerName: "John Doe",
    referrerContact: "09170000001",
    referralFee: 15000,
    status: "pending",
    createdAt: 1000000,
  },
  {
    id: "ref-2",
    dealId: "deal-2",
    referrerName: "Jane Smith",
    referrerContact: "09170000002",
    referralFee: 25000,
    status: "paid",
    paidAt: 2000000,
    createdAt: 1000000,
  },
];

const sampleDeals = [
  { id: "deal-1", clientName: "Client A", status: "closed" },
  { id: "deal-2", clientName: "Client B", status: "closed" },
];

describe("ReferralDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows referral summary", async () => {
    mockFetchReferrals.mockResolvedValue(sampleReferrals);
    mockDeals.mockReturnValue(sampleDeals);

    render(<ReferralDashboard />);

    // Summary cards should appear
    const pendingFees = await screen.findAllByText("₱15k");
    expect(pendingFees.length).toBeGreaterThanOrEqual(1);
    const paidFees = screen.getAllByText("₱25k");
    expect(paidFees.length).toBeGreaterThanOrEqual(1);

    // Referral names should appear
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("shows list of referrals", async () => {
    mockFetchReferrals.mockResolvedValue(sampleReferrals);
    mockDeals.mockReturnValue(sampleDeals);

    render(<ReferralDashboard />);

    // Status badges should appear
    const pendingBadge = await screen.findByText("pending");
    expect(pendingBadge).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockFetchReferrals.mockResolvedValue([]);
    mockDeals.mockReturnValue([]);

    render(<ReferralDashboard />);

    const emptyMessage = await screen.findByText("No referrals yet.");
    expect(emptyMessage).toBeInTheDocument();
  });
});
