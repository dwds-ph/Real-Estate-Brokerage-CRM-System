export type ProjectStatus = "pre-selling" | "ongoing" | "completed" | "on-hold";
export type ProjectType = "subdivision" | "condo" | "commercial" | "mixed-use";

export interface ProjectPhase {
  id: string;
  name: string;
  status: ProjectStatus;
  totalUnits: number;
  availableUnits: number;
  launchDate?: number;
  targetCompletion?: number;
  priceRange: {
    min: number;
    max: number;
  };
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  developer: string;
  developerContact?: string;
  location: {
    address: string;
    city: string;
    province: string;
  };
  description: string;
  status: ProjectStatus;
  projectType: ProjectType;
  totalUnits: number;
  availableUnits: number;
  priceRange: {
    min: number;
    max: number;
  };
  phases: ProjectPhase[];
  amenities: string[];
  media: string[];
  commissionRate?: number;
  assignedTo?: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type UnitStatus =
  | "available"
  | "reserved"
  | "sold"
  | "under-contract"
  | "blocked";

export interface Unit {
  id: string;
  projectId: string;
  projectName: string;
  phaseId: string;
  phaseName: string;
  block: string;
  lot: string;
  floor?: number;
  model?: string;
  area: number;
  price: number;
  status: UnitStatus;
  buyerName?: string;
  buyerContact?: string;
  agentId?: string;
  agentName?: string;
  dealId?: string;
  notes?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
