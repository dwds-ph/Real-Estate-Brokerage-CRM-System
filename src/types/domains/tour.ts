export type TourStatus =
  | "draft"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface TourStop {
  id: string;
  listingId: string;
  listingTitle: string;
  listingAddress: string;
  order: number;
  estimatedDuration: number; // minutes
  scheduledTime?: number; // epoch ms — specific time for this stop
  driveTime?: number; // minutes from previous stop
  notes?: string;
  feedback?: {
    interestLevel: "low" | "medium" | "high";
    concerns?: string;
    nextSteps?: string;
  };
  photoUrls?: string[];
}

export interface Tour {
  id: string;
  title: string;
  clientName: string;
  clientContact?: string;
  clientEmail?: string;
  leadId?: string;
  agentId: string;
  scheduledDate: number; // epoch ms
  status: TourStatus;
  notes?: string;
  stops: TourStop[];
  createdAt: number;
  updatedAt: number;
}
