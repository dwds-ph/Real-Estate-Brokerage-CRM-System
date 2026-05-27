import { type ContractTemplateId, type ContractData } from "./templates";

// ─── Field definitions: map Firestore data → contract fields ──────────

export interface ContractField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  section: "parties" | "property" | "financial" | "dates" | "other";
}

export function getFieldsForTemplate(
  templateId: ContractTemplateId,
): ContractField[] {
  const baseFields: ContractField[] = [
    // ── Parties ──
    {
      key: "sellerName",
      label: "Seller Name",
      type: "text",
      required: true,
      placeholder: "e.g. Juan Dela Cruz",
      section: "parties",
    },
    {
      key: "sellerAddress",
      label: "Seller Address",
      type: "text",
      required: false,
      section: "parties",
    },
    {
      key: "buyerName",
      label: "Buyer Name",
      type: "text",
      required: true,
      placeholder: "e.g. Maria Santos",
      section: "parties",
    },
    {
      key: "buyerAddress",
      label: "Buyer Address",
      type: "text",
      required: false,
      section: "parties",
    },
    {
      key: "brokerName",
      label: "Broker/Agent Name",
      type: "text",
      required: true,
      section: "parties",
    },
    {
      key: "brokerLicense",
      label: "Broker License / PRC No.",
      type: "text",
      required: false,
      placeholder: "e.g. 12345",
      section: "parties",
    },
    {
      key: "brokerAgency",
      label: "Agency/Office Name",
      type: "text",
      required: false,
      section: "parties",
    },

    // ── Property ──
    {
      key: "propertyTitle",
      label: "Property Title",
      type: "text",
      required: true,
      placeholder: "e.g. 2BR Condo at Aria Residences",
      section: "property",
    },
    {
      key: "propertyAddress",
      label: "Property Address",
      type: "text",
      required: true,
      section: "property",
    },
    {
      key: "propertyCity",
      label: "City",
      type: "text",
      required: true,
      section: "property",
    },
    {
      key: "propertyProvince",
      label: "Province",
      type: "text",
      required: false,
      section: "property",
    },
    {
      key: "propertyType",
      label: "Property Type",
      type: "select",
      required: true,
      options: [
        { value: "condo", label: "Condominium" },
        { value: "house-lot", label: "House & Lot" },
        { value: "lot-only", label: "Lot Only" },
        { value: "commercial", label: "Commercial" },
        { value: "foreclosed", label: "Foreclosed Property" },
      ],
      section: "property",
    },
    {
      key: "lotArea",
      label: "Lot Area (sqm)",
      type: "number",
      required: false,
      section: "property",
    },
    {
      key: "floorArea",
      label: "Floor Area (sqm)",
      type: "number",
      required: false,
      section: "property",
    },
    {
      key: "tctNumber",
      label: "TCT / Condo Cert of Title No.",
      type: "text",
      required: false,
      placeholder: "e.g. T-123456",
      section: "property",
    },

    // ── Financial ──
    {
      key: "purchasePrice",
      label: "Purchase Price (₱)",
      type: "number",
      required: true,
      section: "financial",
    },
    {
      key: "reservationFee",
      label: "Reservation Fee (₱)",
      type: "number",
      required: false,
      section: "financial",
    },
    {
      key: "downPayment",
      label: "Down Payment (₱)",
      type: "number",
      required: false,
      section: "financial",
    },
    {
      key: "paymentTerms",
      label: "Payment Terms",
      type: "text",
      required: false,
      placeholder: "e.g. 24 monthly installments",
      section: "financial",
    },
    {
      key: "commissionRate",
      label: "Commission Rate (%)",
      type: "number",
      required: false,
      placeholder: "e.g. 3",
      section: "financial",
    },

    // ── Dates ──
    {
      key: "dateOfAgreement",
      label: "Date of Agreement",
      type: "date",
      required: true,
      section: "dates",
    },
    {
      key: "targetClosingDate",
      label: "Target Closing Date",
      type: "date",
      required: false,
      section: "dates",
    },

    // ── Signatories ──
    {
      key: "sellerSignatory",
      label: "Seller Signatory Name",
      type: "text",
      required: false,
      section: "other",
    },
    {
      key: "buyerSignatory",
      label: "Buyer Signatory Name",
      type: "text",
      required: false,
      section: "other",
    },
    {
      key: "witness1",
      label: "Witness 1 Name",
      type: "text",
      required: false,
      section: "other",
    },
    {
      key: "witness2",
      label: "Witness 2 Name",
      type: "text",
      required: false,
      section: "other",
    },
  ];

  // Template-specific filtering
  if (templateId === "letter-of-intent") {
    return baseFields.filter(
      (f) =>
        ![
          "lotArea",
          "floorArea",
          "tctNumber",
          "reservationFee",
          "downPayment",
          "commissionRate",
          "brokerLicense",
          "brokerAgency",
          "sellerSignatory",
          "witness1",
          "witness2",
        ].includes(f.key),
    );
  }

  if (templateId === "broker-engagement") {
    return baseFields.filter(
      (f) =>
        ![
          "sellerName",
          "sellerAddress",
          "lotArea",
          "floorArea",
          "tctNumber",
          "reservationFee",
          "downPayment",
          "paymentTerms",
          "purchasePrice",
          "sellerSignatory",
          "witness1",
          "witness2",
        ].includes(f.key),
    );
  }

  return baseFields;
}

// ─── Auto-fill data from existing Firestore records ───────────────────

export function autoFillFromDeal(
  deal: { clientName: string; dealPrice: number; clientContact: string },
  listing?: {
    title: string;
    price: number;
    location: { address: string; city: string; province?: string };
    propertyType: string;
    propertyDetails?: { lotArea?: number; floorArea?: number };
  } | null,
): Partial<ContractData> {
  const data: Partial<ContractData> = {};

  if (deal) {
    data.buyerName = deal.clientName;
    data.purchasePrice = deal.dealPrice;
  }

  if (listing) {
    data.propertyTitle = listing.title;
    data.propertyAddress = listing.location.address;
    data.propertyCity = listing.location.city;
    data.propertyProvince = listing.location.province;
    data.propertyType = listing.propertyType;
    data.lotArea = listing.propertyDetails?.lotArea;
    data.floorArea = listing.propertyDetails?.floorArea;
    if (!data.purchasePrice) data.purchasePrice = listing.price;
  }

  data.dateOfAgreement = new Date().toISOString().split("T")[0];

  return data;
}
