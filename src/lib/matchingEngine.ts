/**
 * Buyer-Listing Matching Engine
 *
 * Matches buyer leads to available listings and project units
 * based on budget, location, property type, and unit preferences.
 * Returns scored results (0-100) with breakdown of match quality.
 */

import type { Lead, Listing, Unit, Project } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────

export interface MatchResult {
  type: "listing" | "unit";
  id: string;
  /** Display title for the matched item */
  title: string;
  /** Price of the matched property */
  price: number;
  /** Location info */
  location: string;
  /** Overall score 0-100 */
  score: number;
  /** Per-criterion breakdown */
  criteria: MatchCriteria[];
  /** Link to the detail page */
  href: string;
  /** Extra metadata */
  subTitle?: string;
  imageUrl?: string;
}

export interface MatchCriteria {
  label: string;
  matched: boolean;
  weight: number;
  detail?: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const DEFAULT_BUDGET_TOLERANCE = 0.3; // ±30%
const MIN_SCORE_TO_SHOW = 20;

// Weight for each criterion (total = 100)
const WEIGHTS = {
  BUDGET: 35,
  LOCATION: 25,
  PROPERTY_TYPE: 20,
  BEDROOMS: 10,
  STATUS: 10,
} as const;

// ─── Parsing ─────────────────────────────────────────────────────────

/** Extract structured preferences from a lead's free-text propertyInterest field */
export function parsePropertyInterest(text?: string): {
  propertyTypes: string[];
  bedrooms?: number;
  keywords: string[];
} {
  if (!text) return { propertyTypes: [], keywords: [] };

  const lower = text.toLowerCase();
  const keywords: string[] = [];
  const propertyTypes: string[] = [];
  let bedrooms: number | undefined;

  // Extract property type mentions
  const typeMap: Record<string, string> = {
    condo: "condo",
    condominium: "condo",
    apartment: "condo",
    house: "house-lot",
    "house and lot": "house-lot",
    "house & lot": "house-lot",
    "single detached": "house-lot",
    townhouse: "house-lot",
    lot: "lot-only",
    "empty lot": "lot-only",
    "vacant lot": "lot-only",
    land: "lot-only",
    commercial: "commercial",
    "commercial space": "commercial",
    warehouse: "commercial",
    foreclosed: "foreclosed",
    foreclosure: "foreclosed",
    "bank repo": "foreclosed",
  };

  for (const [phrase, type] of Object.entries(typeMap)) {
    if (lower.includes(phrase)) {
      propertyTypes.push(type);
    }
  }

  // Extract bedroom count (e.g., "2br", "2BR", "2 bedroom", "studio")
  const brMatch = lower.match(/(\d+)\s*(br|bedroom|bed|beds)\b/i);
  if (brMatch) {
    bedrooms = parseInt(brMatch[1], 10);
  }
  if (lower.includes("studio")) {
    bedrooms = 0;
  }

  // Clean keywords
  keywords.push(...lower.split(/[\s,]+/).filter((k) => k.length > 2));

  return {
    propertyTypes: [...new Set(propertyTypes)],
    bedrooms,
    keywords: [...new Set(keywords)],
  };
}

// ─── Location Matching ───────────────────────────────────────────────

function scoreLocation(
  leadLocation: string | undefined,
  listing: { city: string; province: string },
): { score: number; detail: string } {
  if (!leadLocation) return { score: 0, detail: "No location preference" };

  const ll = leadLocation.toLowerCase().trim();

  // Exact city match
  if (listing.city.toLowerCase() === ll) {
    return { score: 1, detail: `Same city: ${listing.city}` };
  }

  // City is contained in lead location
  if (ll.includes(listing.city.toLowerCase())) {
    return { score: 1, detail: `Matched city: ${listing.city}` };
  }

  // Province match
  if (ll.includes(listing.province.toLowerCase())) {
    return { score: 0.6, detail: `Same province: ${listing.province}` };
  }

  // Partial keyword overlap
  const leadWords = ll.split(/[\s,]+/).filter(Boolean);
  const listingWords = [
    listing.city.toLowerCase(),
    listing.province.toLowerCase(),
  ];
  const overlap = leadWords.filter((w) =>
    listingWords.some((lw) => lw.includes(w) || w.includes(lw)),
  );
  if (overlap.length > 0) {
    return { score: 0.3, detail: `Partial match: ${overlap.join(", ")}` };
  }

  return { score: 0, detail: "Location mismatch" };
}

// ─── Property Type Matching ──────────────────────────────────────────

function scorePropertyType(
  preferredTypes: string[],
  listingType: string,
  unitType?: string,
): { score: number; detail: string } {
  if (preferredTypes.length === 0) {
    return { score: 0.5, detail: "No type preference" };
  }

  // For project units, consider the project type
  const actualType = unitType || listingType;

  if (preferredTypes.includes(actualType)) {
    return { score: 1, detail: `Matches ${actualType}` };
  }

  // Partial: house-lot includes townhouse/condo adjacent interest
  return { score: 0, detail: `Wanted ${preferredTypes.join("/")}` };
}

// ─── Budget Matching ─────────────────────────────────────────────────

function scoreBudget(
  leadBudget: number | undefined,
  price: number,
): { score: number; detail: string } {
  if (!leadBudget || leadBudget <= 0) {
    return { score: 0.5, detail: "No budget set" };
  }

  const lower = leadBudget * (1 - DEFAULT_BUDGET_TOLERANCE);
  const upper = leadBudget * (1 + DEFAULT_BUDGET_TOLERANCE);

  if (price >= lower && price <= upper) {
    // Perfect: within 30% tolerance
    const proximity = 1 - Math.abs(price - leadBudget) / leadBudget;
    const score = Math.max(0.5, proximity);
    const ratio = ((price / leadBudget) * 100).toFixed(0);
    return { score, detail: `₱${price.toLocaleString()} (${ratio}% of budget)` };
  }

  // Within 50% tolerance (partial)
  if (price <= leadBudget * 1.5 && price >= leadBudget * 0.5) {
    return { score: 0.3, detail: `Outside ideal range by ${Math.abs(price - leadBudget).toLocaleString()}` };
  }

  return { score: 0, detail: `Budget mismatch: ₱${price.toLocaleString()}` };
}

// ─── Bedroom Matching ────────────────────────────────────────────────

function scoreBedrooms(
  preferred: number | undefined,
  listingBedrooms?: number,
): { score: number; detail: string } {
  if (preferred === undefined) {
    return { score: 0.5, detail: "No bedroom preference" };
  }
  if (!listingBedrooms && listingBedrooms !== 0) {
    return { score: 0.5, detail: "Bedroom count unknown" };
  }

  if (preferred === listingBedrooms) {
    return { score: 1, detail: `Exact: ${listingBedrooms} BR` };
  }

  if (Math.abs(preferred - listingBedrooms) <= 1) {
    return { score: 0.6, detail: `Close: ${listingBedrooms} BR (wanted ${preferred})` };
  }

  return { score: 0.2, detail: `Mismatch: ${listingBedrooms} BR (wanted ${preferred})` };
}

// ─── Status Scoring ──────────────────────────────────────────────────

function scoreStatus(status: string): { score: number; detail: string } {
  if (status === "available" || status === "pre-selling") {
    return { score: 1, detail: "Available" };
  }
  if (status === "under-option" || status === "reserved") {
    return { score: 0.5, detail: "Under option / Reserved" };
  }
  return { score: 0, detail: `Status: ${status}` };
}

// ─── Main Matching Functions ─────────────────────────────────────────

function computeMatchScore(
  criteriaResults: { score: number; weight: number }[],
): number {
  const totalWeight = criteriaResults.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = criteriaResults.reduce(
    (s, c) => s + c.score * c.weight,
    0,
  );
  return Math.round((weighted / totalWeight) * 100);
}

/** Match a lead against available listings */
export function matchLeadToListings(
  lead: Lead,
  listings: Listing[],
): MatchResult[] {
  const prefs = parsePropertyInterest(lead.propertyInterest);
  const results: MatchResult[] = [];

  for (const listing of listings) {
    if (listing.status === "sold" || listing.status === "off-market") continue;

    const budgetScore = scoreBudget(lead.budget, listing.price);
    const locationScore = scoreLocation(lead.location, listing.location);
    const typeScore = scorePropertyType(prefs.propertyTypes, listing.propertyType);
    const bedroomScore = scoreBedrooms(prefs.bedrooms, listing.propertyDetails.bedrooms);
    const statusSc = scoreStatus(listing.status);

    const criteriaItems: MatchCriteria[] = [
      {
        label: "Budget",
        matched: budgetScore.score >= 0.5,
        weight: WEIGHTS.BUDGET,
        detail: budgetScore.detail,
      },
      {
        label: "Location",
        matched: locationScore.score >= 0.3,
        weight: WEIGHTS.LOCATION,
        detail: locationScore.detail,
      },
      {
        label: "Property Type",
        matched: typeScore.score >= 0.5,
        weight: WEIGHTS.PROPERTY_TYPE,
        detail: typeScore.detail,
      },
      {
        label: "Bedrooms",
        matched: bedroomScore.score >= 0.5,
        weight: WEIGHTS.BEDROOMS,
        detail: bedroomScore.detail,
      },
      {
        label: "Status",
        matched: statusSc.score >= 0.5,
        weight: WEIGHTS.STATUS,
        detail: statusSc.detail,
      },
    ];

    const score = computeMatchScore(
      criteriaItems.map((c) => ({ score: c.matched ? 1 : 0, weight: c.weight })),
    );

    if (score < MIN_SCORE_TO_SHOW) continue;

    results.push({
      type: "listing",
      id: listing.id,
      title: listing.title,
      price: listing.price,
      location: `${listing.location.city}, ${listing.location.province}`,
      score,
      criteria: criteriaItems,
      href: `/listings/${listing.id}`,
      subTitle: listing.propertyType.replace("-", " "),
      imageUrl: listing.media?.[0],
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

/** Match a lead against project units */
export function matchLeadToUnits(
  lead: Lead,
  units: Unit[],
  projects: Map<string, Project>,
): MatchResult[] {
  const prefs = parsePropertyInterest(lead.propertyInterest);
  const results: MatchResult[] = [];

  for (const unit of units) {
    if (unit.status !== "available" && unit.status !== "reserved") continue;

    const project = projects.get(unit.projectId);
    if (!project) continue;

    const budgetScore = scoreBudget(lead.budget, unit.price);
    const locationScore = scoreLocation(
      lead.location,
      project.location,
    );
    const typeScore = scorePropertyType(
      prefs.propertyTypes,
      project.projectType,
    );
    const statusSc = scoreStatus(unit.status);

    const criteriaItems: MatchCriteria[] = [
      {
        label: "Budget",
        matched: budgetScore.score >= 0.5,
        weight: WEIGHTS.BUDGET,
        detail: budgetScore.detail,
      },
      {
        label: "Location",
        matched: locationScore.score >= 0.3,
        weight: WEIGHTS.LOCATION,
        detail: locationScore.detail,
      },
      {
        label: "Property Type",
        matched: typeScore.score >= 0.5,
        weight: WEIGHTS.PROPERTY_TYPE,
        detail: typeScore.detail,
      },
      {
        label: "Status",
        matched: statusSc.score >= 0.5,
        weight: WEIGHTS.STATUS,
        detail: statusSc.detail,
      },
    ];

    const score = computeMatchScore(
      criteriaItems.map((c) => ({ score: c.matched ? 1 : 0, weight: c.weight })),
    );

    if (score < MIN_SCORE_TO_SHOW) continue;

    results.push({
      type: "unit",
      id: unit.id,
      title: `${project.name} — ${unit.block} ${unit.lot}`,
      price: unit.price,
      location: `${project.location.city}, ${project.location.province}`,
      score,
      criteria: criteriaItems,
      href: `/projects/${unit.projectId}`,
      subTitle: `${project.projectType} | ${unit.phaseName} | ${unit.area} sqm`,
      imageUrl: project.media?.[0],
    });
  }

  return results.sort((a, b) => b.score - a.score);
}
