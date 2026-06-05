#!/usr/bin/env node
/**
 * scripts/seed-e2e-data.cjs
 *
 * Comprehensive Firestore emulator seed data script for E2E tests.
 * Seeds realistic PH-localized data (names, addresses, phone numbers, currencies)
 * into the Firestore emulator so Playwright tests have deterministic data to
 * interact with.
 *
 * Usage:
 *   node scripts/seed-e2e-data.cjs
 *
 * Environment:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080   (set automatically below)
 *   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
 */

"use strict";

// ─── Emulator connection ───────────────────────────────────────────────
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

const admin = require("firebase-admin");

const app = admin.initializeApp({ projectId: "demo-crm" });
const db = admin.firestore();
db.settings({ host: "localhost:8080", ssl: false });

// ─── Helpers ───────────────────────────────────────────────────────────

const now = Date.now();
const DAY = 86400000;

function uid(prefix, index) {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

function daysAgo(n) {
  return new Date(now - n * DAY);
}

function futureDays(n) {
  return new Date(now + n * DAY);
}

// ─── Static Data ───────────────────────────────────────────────────────

/** Broker user */
const BROKER = {
  id: "user-broker-001",
  displayName: "Antonio R. Dimagiba",
  email: "broker@crm.ph",
  phone: "+63 917 555 0101",
  role: "broker",
  licenseNumber: "PRC-BRKR-2019-00421",
  isActive: true,
  createdAt: daysAgo(180),
  updatedAt: daysAgo(1),
};

/** Branch / Office */
const BRANCH = {
  id: "branch-001",
  name: "Makati Flagship Office",
  address: "25F Ayala Tower One, Ayala Avenue",
  city: "Makati",
  province: "Metro Manila",
  phone: "+63 2 8123 4567",
  email: "makati@crm.ph",
  managerId: BROKER.id,
  isActive: true,
  createdAt: daysAgo(180),
  updatedAt: daysAgo(5),
};

/** 3 Agents with PH names */
const AGENTS = [
  {
    id: "user-agent-001",
    displayName: "Maria Concepcion Santos",
    email: "maria.santos@crm.ph",
    phone: "+63 917 555 0102",
    role: "agent",
    branchId: "branch-001",
    brokerId: BROKER.id,
    licenseNumber: "PRC-AGT-2020-00987",
    specialization: ["condo", "house-lot"],
    yearsExperience: 5,
    isActive: true,
    createdAt: daysAgo(150),
    updatedAt: daysAgo(3),
  },
  {
    id: "user-agent-002",
    displayName: "Juan Miguel Dela Cruz",
    email: "juan.dc@crm.ph",
    phone: "+63 917 555 0103",
    role: "agent",
    branchId: "branch-001",
    brokerId: BROKER.id,
    licenseNumber: "PRC-AGT-2021-00543",
    specialization: ["commercial", "lot-only"],
    yearsExperience: 3,
    isActive: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(2),
  },
  {
    id: "user-agent-003",
    displayName: "Ana Beatriz Gonzales-Lim",
    email: "ana.gonzales@crm.ph",
    phone: "+63 917 555 0104",
    role: "agent",
    branchId: "branch-001",
    brokerId: BROKER.id,
    licenseNumber: "PRC-AGT-2022-00215",
    specialization: ["townhouse", "condo"],
    yearsExperience: 2,
    isActive: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(1),
  },
];

/** 12 Leads with realistic PH data */
const LEADS = [
  {
    id: "lead-001",
    name: "Jose Protacio Rizal Mercado",
    phone: "+63 908 123 4567",
    email: "jose.rizal@email.ph",
    source: "referral",
    status: "negotiating",
    score: "hot",
    propertyInterest: "condo",
    budget: 4500000,
    location: "Makati",
    notes: "Looking for 2BR condo near Ayala Ave. Referred by Maria Santos.",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  },
  {
    id: "lead-002",
    name: "Maria Clara Santos-Dimasalang",
    phone: "+63 917 888 9999",
    email: "maria.clara@email.ph",
    source: "facebook",
    status: "contacted",
    score: "warm",
    propertyInterest: "house-lot",
    budget: 8500000,
    location: "Quezon City",
    notes: "Interested in BF Homes area. Has family of 4.",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(0),
  },
  {
    id: "lead-003",
    name: "Ramon Magsaysay Jr.",
    phone: "+63 922 333 4444",
    email: "ramon.jr@email.ph",
    source: "website",
    status: "new",
    score: "cold",
    propertyInterest: "lot-only",
    budget: 3200000,
    location: "Nuvali",
    notes: "Inquired via website contact form.",
    assignedTo: "user-agent-002",
    createdBy: "user-agent-002",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: "lead-004",
    name: "Catherine Mercado-Gonzales",
    phone: "+63 905 666 7777",
    email: "catherine.mercado@email.ph",
    source: "walk-in",
    status: "negotiating",
    score: "hot",
    propertyInterest: "commercial",
    budget: 15000000,
    location: "Makati CBD",
    notes: "Walked in to Makati office. Looking for retail space. Ready to buy.",
    assignedTo: "user-agent-002",
    createdBy: "user-agent-002",
    createdAt: daysAgo(21),
    updatedAt: daysAgo(0),
  },
  {
    id: "lead-005",
    name: "Dindo P. Angeles",
    phone: "+63 927 111 2233",
    email: "dindo.angeles@email.ph",
    source: "sms",
    status: "viewed",
    score: "warm",
    propertyInterest: "townhouse",
    budget: 4200000,
    location: "Cubao, Quezon City",
    notes: "Has viewed 2 properties. Saving up for downpayment.",
    assignedTo: "user-agent-003",
    createdBy: "user-agent-003",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(7),
  },
  {
    id: "lead-006",
    name: "Grace Valenzuela-Tan",
    phone: "+63 915 999 8877",
    email: "grace.vt@email.ph",
    source: "referral",
    status: "closed",
    score: "hot",
    propertyInterest: "townhouse",
    budget: 3800000,
    location: "Cubao, Quezon City",
    notes: "Successfully closed on foreclosed townhouse. Very satisfied client.",
    assignedTo: "user-agent-003",
    createdBy: "user-agent-003",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(45),
  },
  {
    id: "lead-007",
    name: "Miguel Enrique Tan",
    phone: "+63 918 666 5544",
    email: "miguel.tan@email.ph",
    source: "email",
    status: "negotiating",
    score: "warm",
    propertyInterest: "commercial",
    budget: 7800000,
    location: "Ortigas, Pasig",
    notes: "Looking for 50sqm office space. Flexible on location.",
    assignedTo: "user-agent-002",
    createdBy: "user-agent-002",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
  {
    id: "lead-008",
    name: "Sofia Marie Andres-Reyes",
    phone: "+63 929 333 2211",
    email: "sofia.andres@email.ph",
    source: "open-house",
    status: "new",
    score: "cold",
    propertyInterest: "condo",
    budget: 5500000,
    location: "BGC, Taguig",
    notes: "Attended open house at BGC condo. Just browsing.",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "lead-009",
    name: "Antonio Villanueva III",
    phone: "+63 920 888 9900",
    email: "tony.villanueva@email.ph",
    source: "call",
    status: "viewed",
    score: "warm",
    propertyInterest: "lot-only",
    budget: 5000000,
    location: "Batangas",
    notes: "Looking for beach lot in San Juan. Called after seeing online ad.",
    assignedTo: "user-agent-002",
    createdBy: "user-agent-002",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
  },
  {
    id: "lead-010",
    name: "Karen Cruz-Dimaano",
    phone: "+63 917 444 5566",
    email: "karen.cruz@email.ph",
    source: "referral",
    status: "negotiating",
    score: "hot",
    propertyInterest: "lot-only",
    budget: 5000000,
    location: "San Juan, Batangas",
    notes: "Referred by Grace Valenzuela. Wants beach lot. Pre-qualified.",
    assignedTo: "user-agent-003",
    createdBy: "user-agent-003",
    createdAt: daysAgo(18),
    updatedAt: daysAgo(1),
  },
  {
    id: "lead-011",
    name: "Ferdinand 'Bongbong' Marcos III",
    phone: "+63 908 777 8888",
    email: "bb.marcos@email.ph",
    source: "website",
    status: "contacted",
    score: "cold",
    propertyInterest: "house-lot",
    budget: 12000000,
    location: "Alabang",
    notes: "Inquired about Ayala Alabang properties. Wants 4BR house.",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(6),
  },
  {
    id: "lead-012",
    name: "Leni Robredo-Angeles",
    phone: "+63 917 222 1111",
    email: "leni.robredo@email.ph",
    source: "referral",
    status: "new",
    score: "warm",
    propertyInterest: "condo",
    budget: 4500000,
    location: "Naga City",
    notes: "Looking for investment condo in Naga. Prefers near Ateneo.",
    assignedTo: "user-agent-003",
    createdBy: "user-agent-003",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
];

/** 5 Listings (condo, house & lot, lot only, commercial, townhouse) + extras */
const LISTINGS = [
  {
    id: "listing-001",
    title: "Studio Condo at Uptown BGC",
    description:
      "Studio unit at Uptown Bonifacio, 6th floor with city view. Walking distance to Market! Market! and Serendra. Ready for occupancy.",
    price: 4500000,
    currency: "PHP",
    location: {
      address: "123 Rizal Drive, Uptown Bonifacio",
      city: "Taguig",
      province: "Metro Manila",
    },
    propertyDetails: {
      bedrooms: 1,
      bathrooms: 1,
      floorArea: 28,
      furnishing: "semi-furnished",
    },
    propertyType: "condo",
    status: "available",
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Parking"],
    views: 342,
    inquiries: 18,
    media: [],
    floodRisk: "low",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(3),
  },
  {
    id: "listing-002",
    title: "3BR House & Lot in BF Homes Parañaque",
    description:
      "Corner lot with garden, 3 bedrooms with master's bath. Near SLEX and SM Southmall. Gated community.",
    price: 8500000,
    currency: "PHP",
    location: {
      address: "88 Aguirre Avenue",
      city: "Parañaque",
      province: "Metro Manila",
    },
    propertyDetails: {
      bedrooms: 3,
      bathrooms: 2,
      lotArea: 120,
      floorArea: 96,
    },
    propertyType: "house-lot",
    status: "available",
    amenities: ["Garden", "Garage", "Balcony"],
    views: 189,
    inquiries: 9,
    media: [],
    floodRisk: "medium",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(7),
  },
  {
    id: "listing-003",
    title: "Residential Lot in Avida Settings Nuvali",
    description:
      "300sqm residential lot in Avida Settings Nuvali. Ready for construction, near Ayala Malls. Good investment.",
    price: 3200000,
    currency: "PHP",
    location: {
      address: "Nuvali Boulevard",
      city: "Santa Rosa",
      province: "Laguna",
    },
    propertyDetails: {
      lotArea: 300,
    },
    propertyType: "lot-only",
    status: "available",
    amenities: ["Clubhouse", "Parks", "Security"],
    views: 421,
    inquiries: 25,
    media: [],
    floodRisk: "low",
    assignedTo: "user-agent-002",
    createdBy: "user-agent-002",
    createdAt: daysAgo(35),
    updatedAt: daysAgo(2),
  },
  {
    id: "listing-004",
    title: "Commercial Space in Makati CBD",
    description:
      "Ground floor retail space along Ayala Avenue. High foot traffic, near MRT station. 85sqm with mezzanine.",
    price: 15000000,
    currency: "PHP",
    location: {
      address: "456 Ayala Avenue",
      city: "Makati",
      province: "Metro Manila",
    },
    propertyDetails: {
      floorArea: 85,
      floors: 1,
    },
    propertyType: "commercial",
    status: "available",
    amenities: ["Air Conditioning", "Security", "Parking", "Storefront"],
    views: 267,
    inquiries: 14,
    media: [],
    floodRisk: "low",
    assignedTo: "user-agent-002",
    createdBy: "user-agent-002",
    createdAt: daysAgo(50),
    updatedAt: daysAgo(1),
  },
  {
    id: "listing-005",
    title: "Foreclosed Townhouse in Cubao QC",
    description:
      "2-storey townhouse in Cubao. Near Gateway Mall, LRT-2, and Cubao bus terminal. Good for first-time buyers.",
    price: 3800000,
    currency: "PHP",
    location: {
      address: "789 P. Tuazon Boulevard",
      city: "Quezon City",
      province: "Metro Manila",
    },
    propertyDetails: {
      bedrooms: 2,
      bathrooms: 1,
      lotArea: 64,
      floorArea: 80,
    },
    propertyType: "townhouse",
    status: "under-option",
    amenities: ["Terrace", "Parking", "Maids Quarter"],
    views: 512,
    inquiries: 32,
    media: [],
    floodRisk: "medium",
    assignedTo: "user-agent-003",
    createdBy: "user-agent-003",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(5),
  },
  {
    id: "listing-006",
    title: "Penthouse at The Rise Makati",
    description:
      "3BR penthouse with panoramic Makati skyline view. Top floor, 2 dedicated parking slots. Fully furnished.",
    price: 25000000,
    currency: "PHP",
    location: {
      address: "100 Kamagong Street",
      city: "Makati",
      province: "Metro Manila",
    },
    propertyDetails: {
      bedrooms: 3,
      bathrooms: 3,
      floorArea: 150,
      furnishing: "fully-furnished",
    },
    propertyType: "condo",
    status: "available",
    amenities: ["Swimming Pool", "Gym", "Function Room", "Concierge", "Parking x2"],
    views: 876,
    inquiries: 45,
    media: [],
    floodRisk: "low",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    createdAt: daysAgo(70),
    updatedAt: daysAgo(1),
  },
  {
    id: "listing-007",
    title: "Beach Lot in San Juan, Batangas",
    description:
      "350sqm beachside lot in San Juan, Batangas. Perfect for vacation house. 2hrs from Manila via SLEX.",
    price: 5000000,
    currency: "PHP",
    location: {
      address: "Brgy. Laiya, San Juan",
      city: "San Juan",
      province: "Batangas",
    },
    propertyDetails: {
      lotArea: 350,
    },
    propertyType: "lot-only",
    status: "available",
    amenities: ["Beach Access", "Electricity", "Road Access"],
    views: 234,
    inquiries: 12,
    media: [],
    floodRisk: "medium",
    assignedTo: "user-agent-002",
    createdBy: "user-agent-002",
    createdAt: daysAgo(25),
    updatedAt: daysAgo(0),
  },
  {
    id: "listing-008",
    title: "Duplex in Ayala Alabang",
    description:
      "Dual-unit duplex in Ayala Alabang Village. Each unit has 2BR, good passive income opportunity.",
    price: 12000000,
    currency: "PHP",
    location: {
      address: "Acacia Avenue, Ayala Alabang",
      city: "Muntinlupa",
      province: "Metro Manila",
    },
    propertyDetails: {
      bedrooms: 4,
      bathrooms: 3,
      lotArea: 200,
      floorArea: 180,
    },
    propertyType: "house-lot",
    status: "available",
    amenities: ["Garden", "Garage x2", "Maids Quarter", "Swimming Pool"],
    views: 156,
    inquiries: 7,
    media: [],
    floodRisk: "low",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    createdAt: daysAgo(80),
    updatedAt: daysAgo(10),
  },
];

/** 3 Deals in various stages */
const DEALS = [
  {
    id: "deal-001",
    leadId: "lead-001",
    listingId: "listing-001",
    clientName: "Jose Protacio Rizal Mercado",
    clientContact: "+63 908 123 4567",
    dealPrice: 4500000,
    status: "under-review",
    commission: {
      total: 135000,
      brokerShare: 54000,
      agentShare: 81000,
    },
    stage: "negotiation",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
    expectedClosingDate: futureDays(45),
  },
  {
    id: "deal-002",
    leadId: "lead-004",
    listingId: "listing-004",
    clientName: "Catherine Mercado-Gonzales",
    clientContact: "+63 905 666 7777",
    dealPrice: 15000000,
    status: "closed",
    commission: {
      total: 450000,
      brokerShare: 180000,
      agentShare: 270000,
    },
    stage: "closed-won",
    assignedTo: "user-agent-002",
    createdBy: "user-agent-002",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
    expectedClosingDate: daysAgo(2),
  },
  {
    id: "deal-003",
    leadId: "lead-005",
    listingId: "listing-005",
    clientName: "Dindo P. Angeles",
    clientContact: "+63 927 111 2233",
    dealPrice: 3800000,
    status: "pending",
    commission: {
      total: 114000,
      brokerShare: 45600,
      agentShare: 68400,
    },
    stage: "documentation",
    assignedTo: "user-agent-003",
    createdBy: "user-agent-003",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
    expectedClosingDate: futureDays(30),
  },
];

/** Payments (some overdue) */
const PAYMENTS = [
  {
    id: "payment-001",
    dealId: "deal-002",
    clientName: "Catherine Mercado-Gonzales",
    amount: 15000000,
    type: "full-payment",
    status: "completed",
    method: "bank-transfer",
    dueDate: daysAgo(2),
    paidDate: daysAgo(3),
    referenceNumber: "BTRF-2025-001",
    notes: "Full payment via BDO wire transfer.",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
  },
  {
    id: "payment-002",
    dealId: "deal-001",
    clientName: "Jose Protacio Rizal Mercado",
    amount: 500000,
    type: "reservation-fee",
    status: "completed",
    method: "credit-card",
    dueDate: daysAgo(10),
    paidDate: daysAgo(12),
    referenceNumber: "CC-2025-0456",
    notes: "Reservation fee via credit card.",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(10),
  },
  {
    id: "payment-003",
    dealId: "deal-001",
    clientName: "Jose Protacio Rizal Mercado",
    amount: 1000000,
    type: "downpayment",
    status: "overdue",
    method: null,
    dueDate: futureDays(5),
    paidDate: null,
    referenceNumber: null,
    notes: "Downpayment due in 5 days. Send reminder.",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0),
  },
  {
    id: "payment-004",
    dealId: "deal-003",
    clientName: "Dindo P. Angeles",
    amount: 200000,
    type: "reservation-fee",
    status: "overdue",
    method: null,
    dueDate: daysAgo(3),
    paidDate: null,
    referenceNumber: null,
    notes: "OVERDUE: Reservation fee was due 3 days ago.",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(0),
  },
  {
    id: "payment-005",
    dealId: "deal-003",
    clientName: "Dindo P. Angeles",
    amount: 3800000,
    type: "full-payment",
    status: "pending",
    method: null,
    dueDate: futureDays(30),
    paidDate: null,
    referenceNumber: null,
    notes: "Full payment due on closing date.",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
];

/** Commission Plans */
const COMMISSION_PLANS = [
  {
    id: "commission-plan-001",
    name: "Standard Residential",
    description: "Standard 3% commission for residential properties",
    rate: 0.03,
    type: "percentage",
    appliesTo: ["condo", "house-lot", "townhouse"],
    brokerShare: 0.4,
    agentShare: 0.6,
    isActive: true,
    createdBy: BROKER.id,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(30),
  },
  {
    id: "commission-plan-002",
    name: "Commercial Rate",
    description: "5% commission for commercial properties",
    rate: 0.05,
    type: "percentage",
    appliesTo: ["commercial"],
    brokerShare: 0.35,
    agentShare: 0.65,
    isActive: true,
    createdBy: BROKER.id,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(30),
  },
  {
    id: "commission-plan-003",
    name: "Lot Only Rate",
    description: "3.5% commission for lot-only transactions",
    rate: 0.035,
    type: "percentage",
    appliesTo: ["lot-only"],
    brokerShare: 0.4,
    agentShare: 0.6,
    isActive: true,
    createdBy: BROKER.id,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(30),
  },
];

/** Tours / Viewings */
const TOURS = [
  {
    id: "tour-001",
    leadId: "lead-001",
    listingId: "listing-001",
    agentId: "user-agent-001",
    leadName: "Jose Protacio Rizal Mercado",
    listingTitle: "Studio Condo at Uptown BGC",
    scheduledDate: daysAgo(10),
    status: "completed",
    notes: "Client liked the unit but wants to see more options.",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(10),
  },
  {
    id: "tour-002",
    leadId: "lead-005",
    listingId: "listing-005",
    agentId: "user-agent-003",
    leadName: "Dindo P. Angeles",
    listingTitle: "Foreclosed Townhouse in Cubao QC",
    scheduledDate: daysAgo(5),
    status: "completed",
    notes: "Client brought family. Very interested. Discussed pricing.",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(5),
  },
  {
    id: "tour-003",
    leadId: "lead-009",
    listingId: "listing-007",
    agentId: "user-agent-002",
    leadName: "Antonio Villanueva III",
    listingTitle: "Beach Lot in San Juan, Batangas",
    scheduledDate: futureDays(3),
    status: "scheduled",
    notes: "Client confirmed. Meeting at site at 10AM.",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  },
  {
    id: "tour-004",
    leadId: "lead-003",
    listingId: "listing-003",
    agentId: "user-agent-002",
    leadName: "Ramon Magsaysay Jr.",
    listingTitle: "Residential Lot in Avida Settings Nuvali",
    scheduledDate: futureDays(7),
    status: "scheduled",
    notes: "Initial site visit. Client wants to see available lots.",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

/** Tasks */
const TASKS = [
  {
    id: "task-001",
    title: "Follow up on Jose Rizal downpayment",
    description: "Call Jose regarding the downpayment due for Studio Condo at BGC.",
    assignedTo: "user-agent-001",
    createdBy: "user-agent-001",
    relatedTo: { type: "deal", id: "deal-001" },
    priority: "high",
    status: "pending",
    dueDate: futureDays(3),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "task-002",
    title: "Prepare deed of sale for Catherine deal",
    description: "Draft deed of sale for commercial space in Makati CBD.",
    assignedTo: "user-agent-002",
    createdBy: "user-agent-002",
    relatedTo: { type: "deal", id: "deal-002" },
    priority: "high",
    status: "completed",
    dueDate: daysAgo(1),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2),
  },
  {
    id: "task-003",
    title: "Send brochure to Karen Cruz",
    description: "Email beach lot listings in San Juan, Batangas to Karen.",
    assignedTo: "user-agent-003",
    createdBy: "user-agent-003",
    relatedTo: { type: "lead", id: "lead-010" },
    priority: "medium",
    status: "pending",
    dueDate: futureDays(2),
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: "task-004",
    title: "Update listing photos for BF Homes",
    description: "Take new photos of the BF Homes property - current ones are outdated.",
    assignedTo: "user-agent-001",
    createdBy: BROKER.id,
    relatedTo: { type: "listing", id: "listing-002" },
    priority: "low",
    status: "pending",
    dueDate: futureDays(14),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: "task-005",
    title: "Verify Dindo Angeles employment docs",
    description:
      "Review and verify employment certificates and bank statements for loan application.",
    assignedTo: "user-agent-003",
    createdBy: "user-agent-003",
    relatedTo: { type: "deal", id: "deal-003" },
    priority: "medium",
    status: "in-progress",
    dueDate: futureDays(5),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0),
  },
];

/** Documents */
const DOCUMENTS = [
  {
    id: "doc-001",
    title: "Deed of Sale - Makati Commercial Space",
    description: "Signed deed of sale for commercial space at Ayala Avenue.",
    dealId: "deal-002",
    type: "deed-of-sale",
    status: "signed",
    fileUrl: "https://storage.crm.ph/documents/deed-of-sale-002.pdf",
    uploadedBy: "user-agent-002",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: "doc-002",
    title: "Reservation Agreement - BGC Condo",
    description: "Signed reservation agreement for studio condo.",
    dealId: "deal-001",
    type: "reservation-agreement",
    status: "signed",
    fileUrl: "https://storage.crm.ph/documents/reservation-001.pdf",
    uploadedBy: "user-agent-001",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: "doc-003",
    title: "Dindo Angeles - Employment Certificate",
    description: "Employment certificate from current employer.",
    dealId: "deal-003",
    type: "identification",
    status: "pending-review",
    fileUrl: "https://storage.crm.ph/documents/employment-dindo.pdf",
    uploadedBy: "user-agent-003",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "doc-004",
    title: "Jose Rizal - Government ID",
    description: "Copy of passport for KYC verification.",
    dealId: "deal-001",
    type: "identification",
    status: "verified",
    fileUrl: "https://storage.crm.ph/documents/passport-rizal.pdf",
    uploadedBy: "user-agent-001",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(6),
  },
  {
    id: "doc-005",
    title: "Property Title - BF Homes",
    description: "Certified true copy of TCT for BF Homes property.",
    listingId: "listing-002",
    type: "title",
    status: "verified",
    fileUrl: "https://storage.crm.ph/documents/tct-bfhomes.pdf",
    uploadedBy: BROKER.id,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(55),
  },
];

// ─── Firestore Write Helpers ───────────────────────────────────────────

async function setDoc(collectionName, docId, data) {
  const ref = db.collection(collectionName).doc(docId);
  await ref.set(data);
  return docId;
}

// ─── Main Seed Function ────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding Firestore emulator with PH-localized E2E data...");
  console.log(`   Project: demo-crm`);
  console.log(`   Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`   Auth:      ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  console.log("");

  const results = {
    users: 0,
    branch: 0,
    leads: 0,
    listings: 0,
    deals: 0,
    payments: 0,
    commissionPlans: 0,
    tours: 0,
    tasks: 0,
    documents: 0,
  };

  try {
    // 1. Broker user
    await setDoc("users", BROKER.id, BROKER);
    results.users++;

    // 2. Agents
    for (const agent of AGENTS) {
      await setDoc("users", agent.id, agent);
      results.users++;
    }
    console.log(`   ✅ Created ${results.users} user(s)`);

    // 3. Branch / Office
    await setDoc("branches", BRANCH.id, BRANCH);
    results.branch++;
    console.log(`   ✅ Created ${results.branch} branch(es)`);

    // 4. Leads
    for (const lead of LEADS) {
      await setDoc("leads", lead.id, lead);
      results.leads++;
    }
    console.log(`   ✅ Created ${results.leads} lead(s)`);

    // 5. Listings
    for (const listing of LISTINGS) {
      await setDoc("listings", listing.id, listing);
      results.listings++;
    }
    console.log(`   ✅ Created ${results.listings} listing(s)`);

    // 6. Deals
    for (const deal of DEALS) {
      await setDoc("deals", deal.id, deal);
      results.deals++;
    }
    console.log(`   ✅ Created ${results.deals} deal(s)`);

    // 7. Payments
    for (const payment of PAYMENTS) {
      await setDoc("payments", payment.id, payment);
      results.payments++;
    }
    console.log(`   ✅ Created ${results.payments} payment(s)`);

    // 8. Commission Plans
    for (const plan of COMMISSION_PLANS) {
      await setDoc("commissionPlans", plan.id, plan);
      results.commissionPlans++;
    }
    console.log(`   ✅ Created ${results.commissionPlans} commission plan(s)`);

    // 9. Tours / Viewings
    for (const tour of TOURS) {
      await setDoc("tours", tour.id, tour);
      results.tours++;
    }
    console.log(`   ✅ Created ${results.tours} tour(s)`);

    // 10. Tasks
    for (const task of TASKS) {
      await setDoc("tasks", task.id, task);
      results.tasks++;
    }
    console.log(`   ✅ Created ${results.tasks} task(s)`);

    // 11. Documents
    for (const doc of DOCUMENTS) {
      await setDoc("documents", doc.id, doc);
      results.documents++;
    }
    console.log(`   ✅ Created ${results.documents} document(s)`);

    console.log("");
    console.log("═══════════════════════════════════════════════════");
    console.log("   ✅ E2E seed data complete!");
    console.log(`   Total documents created: ${Object.values(results).reduce((a, b) => a + b, 0)}`);
    console.log("═══════════════════════════════════════════════════");
    console.log("");
    console.log("Document IDs for tests:");
    console.log(`   Broker:         ${BROKER.id}`);
    console.log(`   Agents:         ${AGENTS.map((a) => a.id).join(", ")}`);
    console.log(`   Branch:         ${BRANCH.id}`);
    console.log(`   Leads:          ${LEADS.length} (${LEADS[0].id} ... ${LEADS[LEADS.length - 1].id})`);
    console.log(`   Listings:       ${LISTINGS.length} (${LISTINGS[0].id} ... ${LISTINGS[LISTINGS.length - 1].id})`);
    console.log(`   Deals:          ${DEALS.length} (${DEALS[0].id} ... ${DEALS[DEALS.length - 1].id})`);

    return results;
  } catch (err) {
    console.error("");
    console.error("❌ Seeding failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

seed().then(() => {
  console.log("\nDone.");
  process.exit(0);
});
