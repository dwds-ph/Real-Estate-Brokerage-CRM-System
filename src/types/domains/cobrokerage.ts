export type BranchType = "head-office" | "branch" | "satellite";

export interface Branch {
  id: string;
  name: string;
  type: BranchType;
  address: string;
  city: string;
  province: string;
  phone?: string;
  email?: string;
  manager?: string;
  managerId?: string;
  brokerId: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AgentTeam {
  id: string;
  name: string;
  description?: string;
  teamLeadId: string;
  teamLeadName?: string;
  memberIds: string[];
  brokerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface TeamMember {
  userId: string;
  displayName: string;
  role: string;
  joinedAt: number;
}

export interface CoBroker {
  id: string;
  name: string;
  brokerage: string;
  licenseNumber?: string;
  phone: string;
  email?: string;
  address?: string;
  referralFeeRate?: number;
  notes?: string;
  createdBy: string;
  brokerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CoBrokerDeal {
  id: string;
  dealId: string;
  coBrokerId: string;
  coBrokerName: string;
  coBrokerBrokerage: string;
  splitPercentage: number;
  commissionAmount: number;
  status: "pending" | "approved" | "paid";
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SplitAgreement {
  id: string;
  dealId: string;
  parties: {
    agentId?: string;
    agentName?: string;
    coBrokerId?: string;
    coBrokerName?: string;
    role: string;
    percentage: number;
    amount: number;
  }[];
  totalCommission: number;
  brokerShare: number;
  brokerId: string;
  createdBy: string;
  createdAt: number;
}
