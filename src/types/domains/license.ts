export type LicenseType =
  | "prc"
  | "broker-license"
  | "bir-accreditation"
  | "hlurb"
  | "other";
export type LicenseStatus = "active" | "expiring-soon" | "expired" | "renewed";

export interface License {
  id: string;
  agentId: string;
  agentName: string;
  type: LicenseType;
  licenseNumber: string;
  issuingBody: string;
  issueDate: number;
  expiryDate: number;
  status: LicenseStatus;
  renewedLicenseId?: string;
  notes?: string;
  documentUrl?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
