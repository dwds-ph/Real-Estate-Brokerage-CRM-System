export type EmailStatus = "sent" | "failed" | "pending";

export interface EmailLog {
  id: string;
  to: string[];
  subject: string;
  template?: string;
  status: EmailStatus;
  resendId?: string;
  error?: string;
  userId: string;
  brokerId?: string;
  createdAt: number;
}

export type NotificationType =
  | "deal_updates"
  | "payment_reminders"
  | "document_sharing"
  | "broker_notifications"
  | "tour_confirmations"
  | "new_lead_alerts";

export interface EmailPreferences {
  id: string;
  userId: string;
  deal_updates: { email: boolean; inApp: boolean };
  payment_reminders: { email: boolean; inApp: boolean };
  document_sharing: { email: boolean; inApp: boolean };
  broker_notifications: { email: boolean; inApp: boolean };
  tour_confirmations: { email: boolean; inApp: boolean };
  new_lead_alerts: { email: boolean; inApp: boolean };
  updatedAt: number;
}
