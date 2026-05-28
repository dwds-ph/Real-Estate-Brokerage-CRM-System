export interface VaultDocument {
  id: string;
  dealId?: string;
  listingId?: string;
  stage?: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  uploadedBy: string;
  uploadedAt: number;
  version: number;
  previousVersionId?: string;
  expiryDate?: number;
  notes?: string;
  tags: string[];
}

export interface DocumentRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  dealId?: string;
  description: string;
  status: "pending" | "uploaded" | "cancelled";
  createdAt: number;
  respondedAt?: number;
  uploadedDocId?: string;
}

export type DocumentCategory =
  | "title"
  | "tax-declaration"
  | "tax-clearance"
  | "permit"
  | "contract"
  | "hoa-docs"
  | "appraisal"
  | "inspection"
  | "deed-of-sale"
  | "identification"
  | "financial"
  | "legal"
  | "other";

export interface PropertyDocument {
  id: string;
  listingId?: string;
  dealId?: string;
  name: string;
  category: DocumentCategory;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  notes?: string;
  expiryDate?: number;
  uploadedBy: string;
  uploadedByName?: string;
  brokerId: string;
  createdAt: number;
}

export interface ComplianceItem {
  id: string;
  label: string;
  category: "legal" | "tax" | "documentary" | "financial";
  required: boolean;
  completed: boolean;
  completedAt?: number;
  completedBy?: string;
  notes?: string;
  documentId?: string;
}

export interface ComplianceChecklist {
  id: string;
  dealId: string;
  dealTitle?: string;
  items: ComplianceItem[];
  progress: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface CMReport {
  id: string;
  listingId: string;
  listingTitle?: string;
  subjectProperty: {
    address: string;
    propertyType: string;
    size: number;
    price: number;
    pricePerSqm: number;
  };
  comparables: {
    address: string;
    propertyType: string;
    size: number;
    price: number;
    pricePerSqm: number;
    distance: string;
    adjustment: number;
    adjustedPrice: number;
  }[];
  adjustedRange: { min: number; max: number };
  recommendedPrice: number;
  notes?: string;
  createdBy: string;
  createdAt: number;
}
