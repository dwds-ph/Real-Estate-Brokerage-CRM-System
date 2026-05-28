import { describe, it, expect } from "vitest";
import {
  parsePropertyInterest,
  matchLeadToListings,
  matchLeadToUnits,
} from "@/lib/matchingEngine";
import type { Lead, Listing, Unit, Project } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    name: "Juan Dela Cruz",
    email: "juan@example.com",
    phone: "09170000000",
    source: "facebook",
    status: "new",
    score: "hot",
    propertyInterest: "2 bedroom condo Makati",
    budget: 5_000_000,
    location: "Makati",
    communicationLog: [],
    activityTimeline: [],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "lst-1",
    title: "2BR Condo in Makati",
    description: "A nice condo unit",
    price: 4_500_000,
    location: {
      address: "123 Legazpi St",
      city: "Makati",
      province: "Metro Manila",
    },
    propertyDetails: {
      bedrooms: 2,
      bathrooms: 1,
      floorArea: 45,
      lotArea: undefined,
      furnishing: "semi-furnished",
      floors: undefined,
    },
    propertyType: "condo",
    floodRisk: "low",
    amenities: ["pool", "gym"],
    status: "available",
    assignedTo: "agent-1",
    createdBy: "broker-1",
    media: ["https://example.com/photo1.jpg"],
    views: 10,
    inquiries: 2,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: "unit-1",
    projectId: "proj-1",
    projectName: "Sunrise Residences",
    phaseId: "phase-1",
    phaseName: "Phase 1",
    block: "Block A",
    lot: "Lot 12",
    floor: 5,
    model: "2BR Standard",
    area: 48,
    price: 4_200_000,
    status: "available",
    notes: "",
    createdBy: "broker-1",
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj-1",
    name: "Sunrise Residences",
    developer: "ABC Developer",
    developerContact: "dev@abc.com",
    location: {
      address: "456 Sunrise Ave",
      city: "Makati",
      province: "Metro Manila",
    },
    description: "A premium condo development",
    status: "ongoing",
    projectType: "condo",
    totalUnits: 100,
    availableUnits: 25,
    priceRange: { min: 3_000_000, max: 10_000_000 },
    phases: [],
    amenities: ["pool", "gym", "parking"],
    media: ["https://example.com/proj-photo.jpg"],
    commissionRate: 3,
    assignedTo: ["agent-1"],
    createdBy: "broker-1",
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

// ─── parsePropertyInterest ───────────────────────────────────────────

describe("parsePropertyInterest", () => {
  it("returns empty arrays when text is undefined", () => {
    const result = parsePropertyInterest(undefined);
    expect(result).toEqual({ propertyTypes: [], keywords: [] });
  });

  it("returns empty arrays when text is empty string", () => {
    const result = parsePropertyInterest("");
    expect(result).toEqual({ propertyTypes: [], keywords: [] });
  });

  it("extracts a single property type from text", () => {
    const result = parsePropertyInterest("looking for a condo");
    expect(result.propertyTypes).toEqual(["condo"]);
  });

  it("maps 'condominium' to 'condo'", () => {
    const result = parsePropertyInterest("condominium unit");
    expect(result.propertyTypes).toEqual(["condo"]);
  });

  it("maps 'apartment' to 'condo'", () => {
    const result = parsePropertyInterest("apartment near school");
    expect(result.propertyTypes).toEqual(["condo"]);
  });

  it("maps 'house' to 'house-lot'", () => {
    const result = parsePropertyInterest("house with garden");
    expect(result.propertyTypes).toEqual(["house-lot"]);
  });

  it("maps 'townhouse' to 'house-lot'", () => {
    const result = parsePropertyInterest("townhouse in QC");
    expect(result.propertyTypes).toEqual(["house-lot"]);
  });

  it("maps 'house and lot' to 'house-lot'", () => {
    const result = parsePropertyInterest("house and lot project");
    // "lot" also matches "lot-only"
    expect(result.propertyTypes).toEqual(["house-lot", "lot-only"]);
  });

  it("maps 'house & lot' to 'house-lot'", () => {
    const result = parsePropertyInterest("house & lot");
    // "lot" also matches "lot-only"
    expect(result.propertyTypes).toEqual(["house-lot", "lot-only"]);
  });

  it("maps 'lot' to 'lot-only'", () => {
    const result = parsePropertyInterest("vacant lot for sale");
    expect(result.propertyTypes).toEqual(["lot-only"]);
  });

  it("maps 'land' to 'lot-only'", () => {
    const result = parsePropertyInterest("commercial land");
    expect(result.propertyTypes).toEqual(["lot-only", "commercial"]);
  });

  it("maps 'commercial' and 'warehouse' to 'commercial'", () => {
    const result = parsePropertyInterest("commercial warehouse space");
    // "warehouse" contains "house" so "house-lot" is also added
    expect(result.propertyTypes).toEqual(["house-lot", "commercial"]);
  });

  it("maps 'foreclosed' to 'foreclosed'", () => {
    const result = parsePropertyInterest("foreclosed property");
    expect(result.propertyTypes).toEqual(["foreclosed"]);
  });

  it("maps 'bank repo' to 'foreclosed'", () => {
    const result = parsePropertyInterest("bank repo house");
    // "house" is matched before "bank repo" in iteration order
    expect(result.propertyTypes).toEqual(["house-lot", "foreclosed"]);
  });

  it("deduplicates property types", () => {
    const result = parsePropertyInterest("condo apartment unit");
    // Both "condo" and "apartment" map to "condo"
    expect(result.propertyTypes).toEqual(["condo"]);
  });

  it("extracts bedroom count from '2br'", () => {
    const result = parsePropertyInterest("2br condo");
    expect(result.bedrooms).toBe(2);
  });

  it("extracts bedroom count from '3 BR'", () => {
    const result = parsePropertyInterest("3 BR house and lot");
    expect(result.bedrooms).toBe(3);
  });

  it("extracts bedroom count from '4 bedroom'", () => {
    const result = parsePropertyInterest("4 bedroom townhouse");
    expect(result.bedrooms).toBe(4);
  });

  it("extracts bedroom count from '1 bed'", () => {
    const result = parsePropertyInterest("1 bed apartment");
    expect(result.bedrooms).toBe(1);
  });

  it("extracts bedroom count from '5 beds'", () => {
    const result = parsePropertyInterest("5 beds lot");
    expect(result.bedrooms).toBe(5);
  });

  it("sets bedrooms to 0 for 'studio'", () => {
    const result = parsePropertyInterest("studio unit");
    expect(result.bedrooms).toBe(0);
  });

  it("extracts keywords from text", () => {
    const result = parsePropertyInterest("modern condo near BGC");
    expect(result.keywords).toContain("modern");
    expect(result.keywords).toContain("condo");
    expect(result.keywords).toContain("near");
    expect(result.keywords).toContain("bgc");
  });

  it("filters out short words (≤ 2 chars)", () => {
    const result = parsePropertyInterest("a 2br in QC condo");
    // "a", "in" are short; "qc" is short
    expect(result.keywords).not.toContain("a");
    expect(result.keywords).not.toContain("in");
    expect(result.keywords).not.toContain("qc");
    expect(result.keywords).toContain("condo");
  });

  it("deduplicates keywords", () => {
    const result = parsePropertyInterest("condo condo condo");
    expect(result.keywords).toEqual(["condo"]);
  });

  it("handles mixed case", () => {
    const result = parsePropertyInterest("Condo 2BR MAKATI");
    expect(result.propertyTypes).toEqual(["condo"]);
    expect(result.bedrooms).toBe(2);
  });
});

// ─── matchLeadToListings ─────────────────────────────────────────────

describe("matchLeadToListings", () => {
  it("returns an empty array when given no listings", () => {
    const lead = makeLead();
    const result = matchLeadToListings(lead, []);
    expect(result).toEqual([]);
  });

  it("filters out sold listings", () => {
    const lead = makeLead();
    const sold = makeListing({ id: "lst-sold", status: "sold" });
    const available = makeListing({ id: "lst-avail" });
    const result = matchLeadToListings(lead, [sold, available]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lst-avail");
  });

  it("filters out off-market listings", () => {
    const lead = makeLead();
    const offMarket = makeListing({ id: "lst-off", status: "off-market" });
    const available = makeListing({ id: "lst-avail" });
    const result = matchLeadToListings(lead, [offMarket, available]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lst-avail");
  });

  it("keeps under-option and available listings", () => {
    const lead = makeLead();
    const underOption = makeListing({ id: "lst-uo", status: "under-option" });
    const available = makeListing({ id: "lst-avail" });
    const result = matchLeadToListings(lead, [underOption, available]);
    expect(result).toHaveLength(2);
  });

  it("returns results sorted by score descending", () => {
    const lead = makeLead({
      location: "Makati",
      propertyInterest: "condo 2br",
      budget: 5_000_000,
    });
    const perfect = makeListing({
      id: "lst-perfect",
      title: "Perfect 2BR Condo",
      price: 5_000_000,
      location: { address: "123", city: "Makati", province: "Metro Manila" },
      propertyType: "condo",
      propertyDetails: { bedrooms: 2 },
      status: "available",
    });
    const mediocre = makeListing({
      id: "lst-mediocre",
      title: "Lot Only Far",
      price: 10_000_000,
      location: { address: "456", city: "Laguna", province: "Laguna" },
      propertyType: "lot-only",
      propertyDetails: { bedrooms: 1 },
      status: "available",
    });
    const result = matchLeadToListings(lead, [mediocre, perfect]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("lst-perfect");
    expect(result[1].id).toBe("lst-mediocre");
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it("filters out results below MIN_SCORE_TO_SHOW (20)", () => {
    const lead = makeLead({
      location: "Davao",
      propertyInterest: "5br condo", // explicit mismatch
      budget: 1_000_000,
    });
    const mismatch = makeListing({
      id: "lst-bad",
      title: "Expensive House",
      price: 100_000_000,
      location: { address: "789", city: "Cebu", province: "Cebu" },
      propertyType: "house-lot", // condo != house-lot
      propertyDetails: { bedrooms: 2 }, // 5 != 2 (diff=3 > 1 → score 0.2)
      status: "rented", // score 0
    });
    const result = matchLeadToListings(lead, [mismatch]);
    // Budget=0, Location=0, PropertyType=0, Bedrooms=0.2(<0.5), Status=0
    // All matched=false → score = 0 < 20
    expect(result).toHaveLength(0);
  });

  it("includes a listing that matches all criteria perfectly", () => {
    const lead = makeLead({
      location: "Makati",
      propertyInterest: "condo 2br",
      budget: 5_000_000,
    });
    const listing = makeListing({
      price: 5_000_000,
      location: { address: "123", city: "Makati", province: "Metro Manila" },
      propertyType: "condo",
      propertyDetails: { bedrooms: 2 },
      status: "available",
    });
    const result = matchLeadToListings(lead, [listing]);
    expect(result).toHaveLength(1);
    const match = result[0];
    expect(match.type).toBe("listing");
    expect(match.id).toBe(listing.id);
    expect(match.title).toBe(listing.title);
    expect(match.price).toBe(listing.price);
    expect(match.location).toBe("Makati, Metro Manila");
    expect(match.href).toBe("/listings/lst-1");
    expect(match.subTitle).toBe("condo"); // propertyType.replace("-", " ")
    expect(match.imageUrl).toBe(listing.media[0]);
    expect(match.score).toBeGreaterThanOrEqual(70); // high score
  });

  it("includes criteria breakdown with correct labels", () => {
    const lead = makeLead({ budget: 5_000_000, location: "Makati" });
    const listing = makeListing({ price: 5_000_000 });
    const result = matchLeadToListings(lead, [listing]);
    expect(result).toHaveLength(1);
    const criteria = result[0].criteria;
    const labels = criteria.map((c) => c.label);
    expect(labels).toEqual([
      "Budget",
      "Location",
      "Property Type",
      "Bedrooms",
      "Status",
    ]);
  });

  it("assigns correct weights to criteria", () => {
    const lead = makeLead();
    const listing = makeListing();
    const result = matchLeadToListings(lead, [listing]);
    const criteria = result[0].criteria;
    const budget = criteria.find((c) => c.label === "Budget")!;
    const location = criteria.find((c) => c.label === "Location")!;
    const ptype = criteria.find((c) => c.label === "Property Type")!;
    const bedrooms = criteria.find((c) => c.label === "Bedrooms")!;
    const status = criteria.find((c) => c.label === "Status")!;
    expect(budget.weight).toBe(35);
    expect(location.weight).toBe(25);
    expect(ptype.weight).toBe(20);
    expect(bedrooms.weight).toBe(10);
    expect(status.weight).toBe(10);
  });

  it("marks budget as matched when within 30% tolerance", () => {
    const lead = makeLead({ budget: 5_000_000 });
    const listing = makeListing({ price: 5_000_000 }); // exactly at budget
    const result = matchLeadToListings(lead, [listing]);
    const budget = result[0].criteria.find((c) => c.label === "Budget")!;
    expect(budget.matched).toBe(true);
  });

  it("marks budget as matched when slightly above budget but within tolerance", () => {
    const lead = makeLead({ budget: 5_000_000 });
    const listing = makeListing({ price: 6_200_000 }); // 24% above — within 30%
    const result = matchLeadToListings(lead, [listing]);
    const budget = result[0].criteria.find((c) => c.label === "Budget")!;
    expect(budget.matched).toBe(true);
  });

  it("marks budget as partially matched when outside 30% but within 50%", () => {
    const lead = makeLead({ budget: 5_000_000 });
    const listing = makeListing({ price: 7_200_000 }); // 44% above — within 50%
    const result = matchLeadToListings(lead, [listing]);
    const budget = result[0].criteria.find((c) => c.label === "Budget")!;
    // scoreBudget returns 0.3 for within 50% tolerance, which is < 0.5 → matched=false
    expect(budget.matched).toBe(false);
  });

  it("marks budget as not matched when outside 50% tolerance", () => {
    const lead = makeLead({ budget: 5_000_000 });
    const listing = makeListing({ price: 20_000_000 }); // 300% above
    const result = matchLeadToListings(lead, [listing]);
    const budget = result[0].criteria.find((c) => c.label === "Budget")!;
    expect(budget.matched).toBe(false);
  });

  it("handles lead with no budget set (partial score)", () => {
    const lead = makeLead({ budget: undefined });
    const listing = makeListing();
    const result = matchLeadToListings(lead, [listing]);
    const budget = result[0].criteria.find((c) => c.label === "Budget")!;
    // No budget → score 0.5 → matched=true (0.5 >= 0.5)
    expect(budget.matched).toBe(true);
    expect(budget.detail).toBe("No budget set");
  });

  it("marks location as matched when lead location equals listing city", () => {
    const lead = makeLead({ location: "Makati" });
    const listing = makeListing();
    const result = matchLeadToListings(lead, [listing]);
    const loc = result[0].criteria.find((c) => c.label === "Location")!;
    expect(loc.matched).toBe(true);
    expect(loc.detail).toContain("Same city");
  });

  it("marks location as matched when lead location contains listing city", () => {
    const lead = makeLead({ location: "Makati City" });
    const listing = makeListing();
    const result = matchLeadToListings(lead, [listing]);
    const loc = result[0].criteria.find((c) => c.label === "Location")!;
    expect(loc.matched).toBe(true);
    expect(loc.detail).toContain("Matched city");
  });

  it("marks location as partial (0.3) when lead has province instead of city", () => {
    const lead = makeLead({ location: "Metro Manila" });
    const listing = makeListing();
    const result = matchLeadToListings(lead, [listing]);
    const loc = result[0].criteria.find((c) => c.label === "Location")!;
    // Province match → score 0.6 → matched=true (0.6 >= 0.3)
    expect(loc.matched).toBe(true);
    expect(loc.detail).toContain("Same province");
  });

  it("marks location as partial match on keyword overlap", () => {
    const lead = makeLead({ location: "Manila" });
    const listing = makeListing({
      location: { address: "123", city: "Makati", province: "Metro Manila" },
    });
    const result = matchLeadToListings(lead, [listing]);
    const loc = result[0].criteria.find((c) => c.label === "Location")!;
    // "Manila" appears in listing province "Metro Manila" → partial overlap
    expect(loc.matched).toBe(true); // 0.3 >= 0.3
    expect(loc.detail).toContain("Partial match");
  });

  it("reports location mismatch when no overlap", () => {
    const lead = makeLead({ location: "Davao" });
    const listing = makeListing({
      location: { address: "123", city: "Baguio", province: "Benguet" },
    });
    const result = matchLeadToListings(lead, [listing]);
    const loc = result[0].criteria.find((c) => c.label === "Location")!;
    expect(loc.matched).toBe(false);
    expect(loc.detail).toBe("Location mismatch");
  });

  it("handles undefined lead location gracefully", () => {
    const lead = makeLead({ location: undefined });
    const listing = makeListing();
    const result = matchLeadToListings(lead, [listing]);
    expect(result).toHaveLength(1);
    const loc = result[0].criteria.find((c) => c.label === "Location")!;
    expect(loc.matched).toBe(false);
    expect(loc.detail).toBe("No location preference");
  });

  it("marks property type as matched when preferred type matches listing type", () => {
    const lead = makeLead({ propertyInterest: "condo" });
    const listing = makeListing({ propertyType: "condo" });
    const result = matchLeadToListings(lead, [listing]);
    const pt = result[0].criteria.find((c) => c.label === "Property Type")!;
    expect(pt.matched).toBe(true);
    expect(pt.detail).toBe("Matches condo");
  });

  it("marks property type as not matched when types differ", () => {
    const lead = makeLead({ propertyInterest: "house" });
    const listing = makeListing({ propertyType: "condo" });
    const result = matchLeadToListings(lead, [listing]);
    const pt = result[0].criteria.find((c) => c.label === "Property Type")!;
    expect(pt.matched).toBe(false);
    expect(pt.detail).toContain("Wanted");
  });

  it("gives partial property type score when no preference set", () => {
    const lead = makeLead({ propertyInterest: "" });
    const listing = makeListing({ propertyType: "condo" });
    const result = matchLeadToListings(lead, [listing]);
    const pt = result[0].criteria.find((c) => c.label === "Property Type")!;
    // score = 0.5 for no preference → matched=true (0.5 >= 0.5)
    expect(pt.matched).toBe(true);
    expect(pt.detail).toBe("No type preference");
  });

  it("marks bedrooms as matched on exact match", () => {
    const lead = makeLead({ propertyInterest: "2br condo" });
    const listing = makeListing({
      propertyDetails: { bedrooms: 2 },
    });
    const result = matchLeadToListings(lead, [listing]);
    const br = result[0].criteria.find((c) => c.label === "Bedrooms")!;
    expect(br.matched).toBe(true);
    expect(br.detail).toBe("Exact: 2 BR");
  });

  it("marks bedrooms as partially matched when within 1 bedroom", () => {
    const lead = makeLead({ propertyInterest: "2br condo" });
    const listing = makeListing({
      propertyDetails: { bedrooms: 3 },
    });
    const result = matchLeadToListings(lead, [listing]);
    const br = result[0].criteria.find((c) => c.label === "Bedrooms")!;
    // score 0.6 for close → matched=true (0.6 >= 0.5)
    expect(br.matched).toBe(true);
    expect(br.detail).toContain("Close:");
  });

  it("marks bedrooms as not matched when more than 1 bedroom apart", () => {
    const lead = makeLead({ propertyInterest: "2br condo" });
    const listing = makeListing({
      propertyDetails: { bedrooms: 5 },
    });
    const result = matchLeadToListings(lead, [listing]);
    const br = result[0].criteria.find((c) => c.label === "Bedrooms")!;
    // score 0.2 → matched=false
    expect(br.matched).toBe(false);
  });

  it("handles no bedroom preference as partial score", () => {
    const lead = makeLead({ propertyInterest: "condo" }); // no bedroom mentioned
    const listing = makeListing({
      propertyDetails: { bedrooms: 2 },
    });
    const result = matchLeadToListings(lead, [listing]);
    const br = result[0].criteria.find((c) => c.label === "Bedrooms")!;
    // No preference → score 0.5 → matched=true
    expect(br.matched).toBe(true);
    expect(br.detail).toBe("No bedroom preference");
  });

  it("handles listing with unknown bedrooms", () => {
    const lead = makeLead({ propertyInterest: "2br condo" });
    const listing = makeListing({
      propertyDetails: { bedrooms: undefined },
    });
    const result = matchLeadToListings(lead, [listing]);
    const br = result[0].criteria.find((c) => c.label === "Bedrooms")!;
    // Listing bedrooms unknown → score 0.5 → matched=true
    expect(br.matched).toBe(true);
    expect(br.detail).toBe("Bedroom count unknown");
  });

  it("marks status as matched for available listings", () => {
    const lead = makeLead();
    const listing = makeListing({ status: "available" });
    const result = matchLeadToListings(lead, [listing]);
    const s = result[0].criteria.find((c) => c.label === "Status")!;
    expect(s.matched).toBe(true);
    expect(s.detail).toBe("Available");
  });

  it("marks status as matched for pre-selling listings", () => {
    const lead = makeLead();
    const listing = makeListing({ status: "pre-selling" });
    const result = matchLeadToListings(lead, [listing]);
    const s = result[0].criteria.find((c) => c.label === "Status")!;
    expect(s.matched).toBe(true);
  });

  it("marks status as partial for under-option listings", () => {
    const lead = makeLead();
    const listing = makeListing({ status: "under-option" });
    const result = matchLeadToListings(lead, [listing]);
    const s = result[0].criteria.find((c) => c.label === "Status")!;
    // score 0.5 → matched=true (0.5 >= 0.5)
    expect(s.matched).toBe(true);
    expect(s.detail).toContain("Under option");
  });

  it("marks status as partial for reserved listings", () => {
    const lead = makeLead();
    const listing = makeListing({ status: "reserved" });
    const result = matchLeadToListings(lead, [listing]);
    const s = result[0].criteria.find((c) => c.label === "Status")!;
    expect(s.matched).toBe(true);
    expect(s.detail).toContain("Reserved");
  });

  it("marks status as not matched for rented listings", () => {
    const lead = makeLead();
    const listing = makeListing({ status: "rented" });
    const result = matchLeadToListings(lead, [listing]);
    const s = result[0].criteria.find((c) => c.label === "Status")!;
    expect(s.matched).toBe(false);
    expect(s.detail).toContain("Status:");
  });

  it("returns correct href, subtitle, and imageUrl", () => {
    const lead = makeLead();
    const listing = makeListing({
      id: "lst-abc",
      title: "Test Listing",
      propertyType: "house-lot",
      media: ["https://example.com/img.jpg"],
    });
    const result = matchLeadToListings(lead, [listing]);
    expect(result).toHaveLength(1);
    const match = result[0];
    expect(match.href).toBe("/listings/lst-abc");
    expect(match.subTitle).toBe("house lot"); // hyphen replaced with space
    expect(match.imageUrl).toBe("https://example.com/img.jpg");
  });

  it("handles listing with no media gracefully", () => {
    const lead = makeLead();
    const listing = makeListing({ media: [] });
    const result = matchLeadToListings(lead, [listing]);
    expect(result[0].imageUrl).toBeUndefined();
  });
});

// ─── matchLeadToUnits ────────────────────────────────────────────────

describe("matchLeadToUnits", () => {
  it("returns an empty array when given no units", () => {
    const lead = makeLead();
    const projects = new Map<string, Project>();
    const result = matchLeadToUnits(lead, [], projects);
    expect(result).toEqual([]);
  });

  it("skips units whose project is not in the map", () => {
    const lead = makeLead();
    const unit = makeUnit({ projectId: "unknown-proj" });
    const projects = new Map<string, Project>();
    projects.set("other-proj", makeProject());
    const result = matchLeadToUnits(lead, [unit], projects);
    expect(result).toEqual([]);
  });

  it("filters out units with status 'sold'", () => {
    const lead = makeLead();
    const sold = makeUnit({ id: "unit-sold", status: "sold" });
    const avail = makeUnit({ id: "unit-avail" });
    const projects = new Map<string, Project>();
    projects.set("proj-1", makeProject());
    const result = matchLeadToUnits(lead, [sold, avail], projects);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("unit-avail");
  });

  it("filters out units with status 'under-contract'", () => {
    const lead = makeLead();
    const uc = makeUnit({ id: "unit-uc", status: "under-contract" });
    const avail = makeUnit({ id: "unit-avail" });
    const projects = new Map<string, Project>();
    projects.set("proj-1", makeProject());
    const result = matchLeadToUnits(lead, [uc, avail], projects);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("unit-avail");
  });

  it("filters out units with status 'blocked'", () => {
    const lead = makeLead();
    const blocked = makeUnit({ id: "unit-blk", status: "blocked" });
    const projects = new Map<string, Project>();
    projects.set("proj-1", makeProject());
    const result = matchLeadToUnits(lead, [blocked], projects);
    expect(result).toEqual([]);
  });

  it("keeps 'available' and 'reserved' units", () => {
    const lead = makeLead();
    const avail = makeUnit({ id: "unit-avail", status: "available" });
    const reserved = makeUnit({ id: "unit-res", status: "reserved" });
    const projects = new Map<string, Project>();
    projects.set("proj-1", makeProject());
    const result = matchLeadToUnits(lead, [avail, reserved], projects);
    expect(result).toHaveLength(2);
  });

  it("returns results sorted by score descending", () => {
    const lead = makeLead({
      location: "Makati",
      propertyInterest: "condo",
      budget: 5_000_000,
    });
    const perfect = makeUnit({
      id: "unit-perfect",
      price: 5_000_000,
      status: "available",
    });
    const mediocre = makeUnit({
      id: "unit-mediocre",
      price: 20_000_000,
      status: "available",
    });
    const projects = new Map<string, Project>();
    projects.set("proj-1", makeProject({ projectType: "condo" }));
    const result = matchLeadToUnits(lead, [mediocre, perfect], projects);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("unit-perfect");
    expect(result[1].id).toBe("unit-mediocre");
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it("includes criteria breakdown for units (no Bedrooms criterion)", () => {
    const lead = makeLead();
    const unit = makeUnit();
    const projects = new Map<string, Project>();
    projects.set("proj-1", makeProject());
    const result = matchLeadToUnits(lead, [unit], projects);
    expect(result).toHaveLength(1);
    const labels = result[0].criteria.map((c) => c.label);
    // Unit matching uses Budget, Location, Property Type, Status — no Bedrooms
    expect(labels).toEqual(["Budget", "Location", "Property Type", "Status"]);
  });

  it("assigns correct weights to unit criteria", () => {
    const lead = makeLead();
    const unit = makeUnit();
    const projects = new Map<string, Project>();
    projects.set("proj-1", makeProject());
    const result = matchLeadToUnits(lead, [unit], projects);
    const criteria = result[0].criteria;
    const budget = criteria.find((c) => c.label === "Budget")!;
    const location = criteria.find((c) => c.label === "Location")!;
    const ptype = criteria.find((c) => c.label === "Property Type")!;
    const status = criteria.find((c) => c.label === "Status")!;
    expect(budget.weight).toBe(35);
    expect(location.weight).toBe(25);
    expect(ptype.weight).toBe(20);
    expect(status.weight).toBe(10);
  });

  it("constructs the correct result for a unit match", () => {
    const lead = makeLead({
      location: "Makati",
      propertyInterest: "condo",
      budget: 5_000_000,
    });
    const unit = makeUnit({
      id: "unit-result",
      price: 4_800_000,
      block: "Block B",
      lot: "Lot 7",
      phaseName: "Phase 2",
      area: 50,
      status: "available",
    });
    const project = makeProject({
      id: "proj-1",
      name: "Sunrise Residences",
      projectType: "condo",
      media: ["https://example.com/proj.jpg"],
    });
    const projects = new Map<string, Project>();
    projects.set("proj-1", project);
    const result = matchLeadToUnits(lead, [unit], projects);
    expect(result).toHaveLength(1);
    const match = result[0];
    expect(match.type).toBe("unit");
    expect(match.id).toBe("unit-result");
    expect(match.title).toBe("Sunrise Residences — Block B Lot 7");
    expect(match.price).toBe(4_800_000);
    expect(match.location).toBe("Makati, Metro Manila");
    expect(match.href).toBe("/projects/proj-1");
    expect(match.subTitle).toBe("condo | Phase 2 | 50 sqm");
    expect(match.imageUrl).toBe("https://example.com/proj.jpg");
  });

  it("filters out results below MIN_SCORE_TO_SHOW (20)", () => {
    const lead = makeLead({
      location: "Davao",
      propertyInterest: "warehouse",
      budget: 500_000,
    });
    const unit = makeUnit({
      id: "unit-bad",
      price: 100_000_000,
      status: "reserved",
    });
    const project = makeProject({
      projectType: "subdivision", // doesn't match "warehouse" → "commercial"
      location: { address: "1", city: "Cebu", province: "Cebu" },
    });
    const projects = new Map<string, Project>();
    projects.set("proj-1", project);
    const result = matchLeadToUnits(lead, [unit], projects);
    // Score: only Status may match (weight 10) → 10/100*100 = 10 < 20
    expect(result).toHaveLength(0);
  });

  it("uses project type for property type scoring", () => {
    const lead = makeLead({ propertyInterest: "house" });
    const unit = makeUnit({ status: "available" });
    const project = makeProject({ projectType: "subdivision" });
    const projects = new Map<string, Project>();
    projects.set("proj-1", project);
    const result = matchLeadToUnits(lead, [unit], projects);
    // "house" maps to "house-lot" but project type is "subdivision" — no match
    const pt = result[0].criteria.find((c) => c.label === "Property Type")!;
    expect(pt.matched).toBe(false);
  });

  it("matches project type 'condo' for unit matching", () => {
    const lead = makeLead({ propertyInterest: "condo" });
    const unit = makeUnit({ status: "available" });
    const project = makeProject({ projectType: "condo" });
    const projects = new Map<string, Project>();
    projects.set("proj-1", project);
    const result = matchLeadToUnits(lead, [unit], projects);
    const pt = result[0].criteria.find((c) => c.label === "Property Type")!;
    expect(pt.matched).toBe(true);
    expect(pt.detail).toBe("Matches condo");
  });

  it("handles undefined lead location for unit matching", () => {
    const lead = makeLead({ location: undefined });
    const unit = makeUnit({ status: "available" });
    const projects = new Map<string, Project>();
    projects.set("proj-1", makeProject());
    const result = matchLeadToUnits(lead, [unit], projects);
    expect(result).toHaveLength(1);
    const loc = result[0].criteria.find((c) => c.label === "Location")!;
    expect(loc.matched).toBe(false);
    expect(loc.detail).toBe("No location preference");
  });

  it("includes unit without media on project when project has no media", () => {
    const lead = makeLead();
    const unit = makeUnit({ status: "available" });
    const project = makeProject({ media: [] });
    const projects = new Map<string, Project>();
    projects.set("proj-1", project);
    const result = matchLeadToUnits(lead, [unit], projects);
    expect(result[0].imageUrl).toBeUndefined();
  });

  it("handles multiple projects and units in same project", () => {
    const lead = makeLead({
      location: "Makati",
      propertyInterest: "condo",
      budget: 5_000_000,
    });
    const unit1 = makeUnit({
      id: "u1",
      price: 4_500_000,
      status: "available",
    });
    const unit2 = makeUnit({
      id: "u2",
      price: 6_000_000,
      status: "reserved",
    });
    const project = makeProject({ projectType: "condo" });
    const projects = new Map<string, Project>();
    projects.set("proj-1", project);

    const result = matchLeadToUnits(lead, [unit1, unit2], projects);
    expect(result).toHaveLength(2);
  });
});
