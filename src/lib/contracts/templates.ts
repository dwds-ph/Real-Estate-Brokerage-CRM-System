export type ContractTemplateId =
  | "reservation-agreement"
  | "contract-to-sell"
  | "deed-of-absolute-sale"
  | "letter-of-intent"
  | "broker-engagement";

export interface ContractTemplate {
  id: ContractTemplateId;
  name: string;
  description: string;
  icon: string;
  lawReference?: string;
}

export interface ContractData {
  // Parties
  sellerName: string;
  sellerAddress?: string;
  buyerName: string;
  buyerAddress?: string;
  brokerName: string;
  brokerLicense?: string;
  brokerAgency?: string;

  // Property
  propertyTitle: string;
  propertyAddress: string;
  propertyCity: string;
  propertyProvince: string;
  propertyType: string;
  lotArea?: number;
  floorArea?: number;
  tctNumber?: string; // Transfer Certificate of Title

  // Financial
  purchasePrice: number;
  reservationFee?: number;
  downPayment?: number;
  paymentTerms?: string;
  commissionRate?: number;

  // Dates
  dateOfAgreement: string;
  targetClosingDate?: string;

  // Signatures
  sellerSignatory?: string;
  buyerSignatory?: string;
  witness1?: string;
  witness2?: string;
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "reservation-agreement",
    name: "Reservation Agreement",
    description:
      "Locks in a buyer's interest with a reservation fee. Includes property details, payment schedule, and RA 9646 disclosure.",
    icon: "📋",
    lawReference: "Republic Act No. 9646 (Real Estate Service Act)",
  },
  {
    id: "contract-to-sell",
    name: "Contract to Sell",
    description:
      "Standard installment sale contract. Includes Maceda Law (RA 6552) protections for buyers.",
    icon: "📝",
    lawReference: "Maceda Law (Republic Act No. 6552)",
  },
  {
    id: "deed-of-absolute-sale",
    name: "Deed of Absolute Sale",
    description:
      "Final transfer of ownership. Includes CGT, DST computation and notarial acknowledgment block.",
    icon: "📜",
    lawReference: "National Internal Revenue Code (CGT/DST)",
  },
  {
    id: "letter-of-intent",
    name: "Letter of Intent",
    description:
      "Non-binding expression of interest to purchase a property at stated terms.",
    icon: "✉️",
  },
  {
    id: "broker-engagement",
    name: "Broker Engagement Letter",
    description:
      "Formal agreement between broker and client for exclusive representation.",
    icon: "🤝",
    lawReference: "Republic Act No. 9646 (Real Estate Service Act)",
  },
];
