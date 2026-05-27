import { db } from "@/lib/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";

// ─── Helpers ──────────────────────────────────────────────────────────

const now = Date.now();
const DAY = 86400000;

function uid(prefix: string, index: number) {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

function daysAgo(n: number) {
  return now - n * DAY;
}

// ─── PH Real Estate Agents ────────────────────────────────────────────

const AGENTS = [
  { name: "Maria Santos", email: "maria@example.com", role: "agent" },
  { name: "Juan Dela Cruz", email: "juan@example.com", role: "agent" },
  { name: "Ana Gonzales", email: "ana@example.com", role: "agent" },
  { name: "Carlos Reyes", email: "carlos@example.com", role: "agent" },
  { name: "Patricia Lim", email: "pat@example.com", role: "agent" },
];

// ─── PH Property Listings ─────────────────────────────────────────────

const LISTINGS = [
  {
    title: "Modern Condo at BGC",
    description:
      "Studio unit at Uptown Bonifacio, 6th floor with city view. Walking distance to Market! Market! and Serendra.",
    price: 4500000,
    location: {
      address: "123 Rizal Drive",
      city: "Taguig",
      province: "Metro Manila",
    },
    propertyDetails: {
      bedrooms: 1,
      bathrooms: 1,
      floorArea: 28,
      furnishing: "semi-furnished",
    },
    propertyType: "condo" as const,
    status: "available" as const,
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Parking"],
  },
  {
    title: "3BR House in BF Homes",
    description:
      "Corner lot with garden, 3 bedrooms w/ master's bath. Near SLEX and SM Southmall.",
    price: 8500000,
    location: {
      address: "88 Aguirre Ave",
      city: "Parañaque",
      province: "Metro Manila",
    },
    propertyDetails: { bedrooms: 3, bathrooms: 2, lotArea: 120, floorArea: 96 },
    propertyType: "house-lot" as const,
    status: "available" as const,
    amenities: ["Garden", "Garage", "Balcony"],
  },
  {
    title: "Lot Only in Nuvali",
    description:
      "300sqm residential lot in Avida Settings Nuvali. Ready for construction, near Ayala Malls.",
    price: 3200000,
    location: {
      address: "Nuvali Blvd",
      city: "Santa Rosa",
      province: "Laguna",
    },
    propertyDetails: { lotArea: 300 },
    propertyType: "lot-only" as const,
    status: "available" as const,
    amenities: ["Clubhouse", "Parks"],
  },
  {
    title: "Commercial Space in Makati CBD",
    description:
      "Ground floor retail space along Ayala Avenue. High foot traffic, near MRT station.",
    price: 15000000,
    location: {
      address: "456 Ayala Ave",
      city: "Makati",
      province: "Metro Manila",
    },
    propertyDetails: { floorArea: 85, floors: 1 },
    propertyType: "commercial" as const,
    status: "available" as const,
    amenities: ["Aircon", "Security", "Parking"],
  },
  {
    title: "Foreclosed Townhouse in QC",
    description:
      "2-storey townhouse in Cubao. Near Gateway Mall, LRT-2, and Cubao bus terminal.",
    price: 3800000,
    location: {
      address: "789 P. Tuazon Blvd",
      city: "Quezon City",
      province: "Metro Manila",
    },
    propertyDetails: { bedrooms: 2, bathrooms: 1, lotArea: 64, floorArea: 80 },
    propertyType: "foreclosed" as const,
    status: "under-option" as const,
    amenities: ["Terrace", "Parking"],
  },
  {
    title: "Penthouse at The Rise Makati",
    description:
      "3BR penthouse with panoramic Makati skyline view. Top floor, 2 dedicated parking slots.",
    price: 25000000,
    location: {
      address: "100 Kamagong St",
      city: "Makati",
      province: "Metro Manila",
    },
    propertyDetails: {
      bedrooms: 3,
      bathrooms: 3,
      floorArea: 150,
      furnishing: "fully-furnished",
    },
    propertyType: "condo" as const,
    status: "available" as const,
    amenities: ["Pool", "Gym", "Function Room", "Concierge", "Parking x2"],
  },
  {
    title: "Beach Lot in Batangas",
    description:
      "350sqm beachside lot in San Juan, Batangas. Perfect for vacation house. 2hrs from Manila.",
    price: 5000000,
    location: {
      address: "Brgy. Laiya",
      city: "San Juan",
      province: "Batangas",
    },
    propertyDetails: { lotArea: 350 },
    propertyType: "lot-only" as const,
    status: "available" as const,
    amenities: ["Beach Access", "Electricity", "Road Access"],
  },
  {
    title: "Duplex in Alabang",
    description:
      "Dual-unit duplex in Ayala Alabang Village. Each unit has 2BR, good passive income.",
    price: 12000000,
    location: {
      address: "Acacia Ave",
      city: "Muntinlupa",
      province: "Metro Manila",
    },
    propertyDetails: {
      bedrooms: 4,
      bathrooms: 3,
      lotArea: 200,
      floorArea: 180,
    },
    propertyType: "house-lot" as const,
    status: "available" as const,
    amenities: ["Garden", "Garage x2", "Maids Quarter"],
  },
  {
    title: "Office Space in Ortigas",
    description:
      "50sqm office unit in a Grade-A building along ADB Avenue. Near MRT Ortigas station.",
    price: 7800000,
    location: {
      address: "ADB Avenue",
      city: "Pasig",
      province: "Metro Manila",
    },
    propertyDetails: { floorArea: 50, floors: 1 },
    propertyType: "commercial" as const,
    status: "sold" as const,
    amenities: ["Reception", "Parking", "24/7 Access"],
  },
  {
    title: "Renovated Apartment in Mandaluyong",
    description:
      "Recently renovated 2BR near Boni Avenue. Walking distance to MRT Boni station.",
    price: 4200000,
    location: {
      address: "Boni Ave",
      city: "Mandaluyong",
      province: "Metro Manila",
    },
    propertyDetails: { bedrooms: 2, bathrooms: 1, floorArea: 45 },
    propertyType: "condo" as const,
    status: "available" as const,
    amenities: ["Balcony", "Laundry Area"],
  },
];

// ─── PH Leads ──────────────────────────────────────────────────────────

const LEADS = [
  {
    name: "Eduardo Manaloto",
    phone: "09171234567",
    email: "eman@email.com",
    score: "hot" as const,
    source: "referral" as const,
  },
  {
    name: "Liza Soberano",
    phone: "09179876543",
    email: "liza@email.com",
    score: "warm" as const,
    source: "facebook" as const,
  },
  {
    name: "Ramon Bautista",
    phone: "09175556677",
    email: "ramon@email.com",
    score: "cold" as const,
    source: "website" as const,
  },
  {
    name: "Catherine Mercado",
    phone: "09174443322",
    email: "cath@email.com",
    score: "hot" as const,
    source: "walk-in" as const,
  },
  {
    name: "Dindo Angeles",
    phone: "09171112233",
    email: "dindo@email.com",
    score: "warm" as const,
    source: "call" as const,
  },
  {
    name: "Grace Valenzuela",
    phone: "09179998877",
    email: "grace@email.com",
    score: "hot" as const,
    source: "referral" as const,
  },
  {
    name: "Miguel Tan",
    phone: "09176665544",
    email: "miguel@email.com",
    score: "warm" as const,
    source: "email" as const,
  },
  {
    name: "Sofia Andres",
    phone: "09173332211",
    email: "sofia@email.com",
    score: "cold" as const,
    source: "open-house" as const,
  },
  {
    name: "Antonio Villanueva",
    phone: "09178889900",
    email: "tony@email.com",
    score: "warm" as const,
    source: "sms" as const,
  },
  {
    name: "Karen Cruz",
    phone: "09174445566",
    email: "karen@email.com",
    score: "hot" as const,
    source: "referral" as const,
  },
];

// ─── Deals ─────────────────────────────────────────────────────────────

const DEALS: {
  clientName: string;
  clientContact: string;
  dealPrice: number;
  status: "pending" | "closed" | "cancelled";
  listingIndex: number;
  leadIndex: number;
}[] = [
  {
    clientName: "Eduardo Manaloto",
    clientContact: "09171234567",
    dealPrice: 4500000,
    status: "pending",
    listingIndex: 0,
    leadIndex: 0,
  },
  {
    clientName: "Liza Soberano",
    clientContact: "09179876543",
    dealPrice: 8500000,
    status: "pending",
    listingIndex: 1,
    leadIndex: 1,
  },
  {
    clientName: "Catherine Mercado",
    clientContact: "09174443322",
    dealPrice: 15000000,
    status: "closed",
    listingIndex: 3,
    leadIndex: 3,
  },
  {
    clientName: "Grace Valenzuela",
    clientContact: "09179998877",
    dealPrice: 3800000,
    status: "closed",
    listingIndex: 4,
    leadIndex: 5,
  },
  {
    clientName: "Miguel Tan",
    clientContact: "09176665544",
    dealPrice: 7800000,
    status: "closed",
    listingIndex: 8,
    leadIndex: 6,
  },
  {
    clientName: "Karen Cruz",
    clientContact: "09174445566",
    dealPrice: 5000000,
    status: "pending",
    listingIndex: 6,
    leadIndex: 9,
  },
  {
    clientName: "Ramon Bautista",
    clientContact: "09175556677",
    dealPrice: 4200000,
    status: "cancelled",
    listingIndex: 9,
    leadIndex: 2,
  },
  {
    clientName: "Antonio Villanueva",
    clientContact: "09178889900",
    dealPrice: 3200000,
    status: "pending",
    listingIndex: 2,
    leadIndex: 8,
  },
];

// ─── Main seed function ───────────────────────────────────────────────

export interface SeedResult {
  success: boolean;
  agentsCreated: number;
  listingsCreated: number;
  leadsCreated: number;
  dealsCreated: number;
  error?: string;
}

export async function seedProductionData(): Promise<SeedResult> {
  const result: SeedResult = {
    success: false,
    agentsCreated: 0,
    listingsCreated: 0,
    leadsCreated: 0,
    dealsCreated: 0,
  };

  try {
    const BATCH_SIZE = 5;

    // ── 1. Create listings ─────────────────────────────────────────
    for (let i = 0; i < LISTINGS.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = LISTINGS.slice(i, i + BATCH_SIZE);
      for (let j = 0; j < chunk.length; j++) {
        const l = chunk[j];
        const ref = doc(collection(db, "listings"), uid("listing", i + j + 1));
        batch.set(ref, {
          ...l,
          id: ref.id,
          views: Math.floor(Math.random() * 500),
          inquiries: Math.floor(Math.random() * 30),
          media: [],
          floodRisk:
            Math.random() > 0.7
              ? "high"
              : Math.random() > 0.4
                ? "medium"
                : "low",
          assignedTo: uid("agent", ((i + j) % AGENTS.length) + 1),
          createdBy: uid("agent", ((i + j) % AGENTS.length) + 1),
          createdAt: daysAgo(Math.floor(Math.random() * 60) + 10),
          updatedAt: daysAgo(Math.floor(Math.random() * 10)),
        });
      }
      await batch.commit();
      result.listingsCreated += chunk.length;
    }

    // ── 2. Create leads ────────────────────────────────────────────
    const LEAD_STATUSES = [
      "new",
      "contacted",
      "viewed",
      "negotiating",
      "closed",
      "lost",
    ] as const;
    const PROPERTY_INTERESTS = ["condo", "house-lot", "lot-only", "commercial"];

    for (let i = 0; i < LEADS.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = LEADS.slice(i, i + BATCH_SIZE);
      for (let j = 0; j < chunk.length; j++) {
        const l = chunk[j];
        const ref = doc(collection(db, "leads"), uid("lead", i + j + 1));
        const leadStatus =
          i + j < DEALS.length
            ? "negotiating"
            : LEAD_STATUSES[(i + j) % LEAD_STATUSES.length];
        batch.set(ref, {
          id: ref.id,
          name: l.name,
          email: l.email,
          phone: l.phone,
          source: l.source,
          status: leadStatus,
          score: l.score,
          assignedTo: uid("agent", ((i + j) % AGENTS.length) + 1),
          propertyInterest:
            PROPERTY_INTERESTS[(i + j) % PROPERTY_INTERESTS.length],
          budget: [3000000, 5000000, 8000000, 12000000, 25000000][(i + j) % 5],
          location: ["Makati", "BGC", "Quezon City", "Alabang", "Nuvali"][
            (i + j) % 5
          ],
          notes: `Interested in ${PROPERTY_INTERESTS[(i + j) % PROPERTY_INTERESTS.length]}`,
          communicationLog: [],
          activityTimeline: [],
          createdAt: daysAgo(Math.floor(Math.random() * 45) + 5),
          updatedAt: daysAgo(Math.floor(Math.random() * 5)),
        });
      }
      await batch.commit();
      result.leadsCreated += chunk.length;
    }

    // ── 3. Create deals ────────────────────────────────────────────
    for (let i = 0; i < DEALS.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = DEALS.slice(i, i + BATCH_SIZE);
      for (let j = 0; j < chunk.length; j++) {
        const d = chunk[j];
        const ref = doc(collection(db, "deals"), uid("deal", i + j + 1));
        const agentIndex = d.listingIndex % AGENTS.length;
        const commission = d.dealPrice * 0.03;
        batch.set(ref, {
          id: ref.id,
          leadId: uid("lead", d.leadIndex + 1),
          listingId: uid("listing", d.listingIndex + 1),
          clientName: d.clientName,
          clientContact: d.clientContact,
          dealPrice: d.dealPrice,
          status: d.status,
          commission: {
            total: commission,
            brokerShare: commission * 0.4,
            agentShare: commission * 0.6,
          },
          assignedTo: uid("agent", agentIndex + 1),
          createdBy: uid("agent", agentIndex + 1),
          createdAt: daysAgo(Math.floor(Math.random() * 30) + 5),
          updatedAt: daysAgo(Math.floor(Math.random() * 5)),
        });
      }
      await batch.commit();
      result.dealsCreated += chunk.length;
    }

    result.success = true;
    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    return result;
  }
}

export function clearAllData(): Promise<void> {
  // Note: clearing requires Firestore delete operations.
  // This function provides the structure but actual deletion
  // is best done via Firebase Console or gcloud CLI for large datasets.
  return Promise.resolve();
}
