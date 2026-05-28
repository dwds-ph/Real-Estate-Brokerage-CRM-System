export interface CommTemplate {
  id: string;
  name: string;
  type: "call" | "text" | "meeting" | "email";
  body: string;
  createdBy: string;
  createdAt: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  scope: "lead" | "listing" | "deal";
  items: { label: string; required: boolean }[];
  createdBy: string;
  brokerId?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ChecklistInstance {
  id: string;
  templateId: string;
  templateName: string;
  scopeType: "lead" | "listing" | "deal";
  scopeId: string;
  items: { label: string; required: boolean; done: boolean }[];
  progress: number;
  createdAt: number;
}

export interface Referral {
  id: string;
  dealId: string;
  referrerName: string;
  referrerContact: string;
  referralFee: number;
  status: "pending" | "paid";
  paidAt?: number;
  createdAt: number;
}

export interface Office {
  id: string;
  name: string;
  address: string;
  brokerId: string;
  createdAt: number;
}
