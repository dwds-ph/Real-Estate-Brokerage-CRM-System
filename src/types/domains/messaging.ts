export type MessagingChannel = "whatsapp" | "viber" | "sms";

export type MessageTemplateType =
  | "property-inquiry"
  | "payment-reminder"
  | "tour-confirmation"
  | "document-request"
  | "commission-update"
  | "follow-up"
  | "general";

export interface MessageTemplate {
  id: string;
  type: MessageTemplateType;
  name: string;
  description: string;
  /** Template with {{placeholders}} like {{clientName}}, {{propertyAddress}}, {{amount}}, {{date}}, {{agentName}}, {{brokerName}} */
  bodyWhatsApp: string;
  bodyViber: string;
  bodySms: string;
  createdBy: string;
  brokerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface MessageLog {
  id: string;
  channel: MessagingChannel;
  templateType: MessageTemplateType;
  recipientName: string;
  recipientPhone: string;
  messageBody: string;
  status: "sent" | "opened" | "failed";
  /** Deep link URL that was shared */
  deepLink?: string;
  /** Related entity (leadId, dealId, listingId) for context */
  relatedId?: string;
  /** Entity type context */
  relatedType?: "lead" | "deal" | "listing";
  sentBy: string;
  brokerId: string;
  createdAt: number;
}

export const DEFAULT_TEMPLATES: Omit<MessageTemplate, "id" | "createdBy" | "brokerId" | "createdAt" | "updatedAt">[] = [
  {
    type: "property-inquiry",
    name: "Property Inquiry",
    description: "Initial inquiry about a property listing",
    bodyWhatsApp: "Hi {{clientName}}! Thank you for your interest in {{propertyAddress}}. I'd be happy to provide more details and schedule a viewing. Best regards, {{agentName}}",
    bodyViber: "Hi {{clientName}}! Thank you for your interest in {{propertyAddress}}. I'd be happy to provide more details and schedule a viewing. Best regards, {{agentName}}",
    bodySms: "Hi {{clientName}}! Re: {{propertyAddress}}. Happy to help with details/a viewing. -{{agentName}}",
  },
  {
    type: "payment-reminder",
    name: "Payment Reminder",
    description: "Reminder about upcoming or overdue payment",
    bodyWhatsApp: "Hi {{clientName}}! This is a friendly reminder that your payment of PHP {{amount}} is due on {{date}}. Please process at your earliest convenience. Thank you! -{{agentName}}",
    bodyViber: "Hi {{clientName}}! Reminder: Payment of PHP {{amount}} due on {{date}}. Please process soon. Thank you! -{{agentName}}",
    bodySms: "Hi {{clientName}}! Reminder: PHP {{amount}} due {{date}}. Please settle. -{{agentName}}",
  },
  {
    type: "tour-confirmation",
    name: "Tour Confirmation",
    description: "Confirm a scheduled property tour",
    bodyWhatsApp: "Hi {{clientName}}! Your property tour is confirmed for {{date}}. We'll be viewing {{propertyAddress}}. See you there! -{{agentName}}",
    bodyViber: "Hi {{clientName}}! Tour confirmed: {{date}} at {{propertyAddress}}. See you! -{{agentName}}",
    bodySms: "Tour confirmed {{date}} - {{propertyAddress}}. See you! -{{agentName}}",
  },
  {
    type: "document-request",
    name: "Document Request",
    description: "Request documents from client",
    bodyWhatsApp: "Hi {{clientName}}! For the processing of your {{dealType}}, we need the following documents: {{documentList}}. Please submit at your earliest convenience. -{{agentName}}",
    bodyViber: "Hi {{clientName}}! Please submit {{documentList}} for {{dealType}} processing. -{{agentName}}",
    bodySms: "Please submit {{documentList}} for {{dealType}}. -{{agentName}}",
  },
  {
    type: "commission-update",
    name: "Commission Update",
    description: "Notify about commission status",
    bodyWhatsApp: "Hi {{agentName}}! Your commission for deal #{{dealRef}} of PHP {{amount}} has been updated to {{status}}. Check your dashboard for details. -{{brokerName}}",
    bodyViber: "Hi {{agentName}}! Commission for {{dealRef}}: PHP {{amount}} - {{status}}. Check dashboard. -{{brokerName}}",
    bodySms: "Commission {{dealRef}}: PHP {{amount}} {{status}}. Check dashboard. -{{brokerName}}",
  },
  {
    type: "follow-up",
    name: "Follow Up",
    description: "General follow-up with a client",
    bodyWhatsApp: "Hi {{clientName}}! Just following up on our conversation about {{propertyAddress}}. Let me know if you have any questions! -{{agentName}}",
    bodyViber: "Hi {{clientName}}! Following up on {{propertyAddress}}. Any questions? -{{agentName}}",
    bodySms: "Following up on {{propertyAddress}}. Any questions? -{{agentName}}",
  },
  {
    type: "general",
    name: "General Message",
    description: "Custom message with no template",
    bodyWhatsApp: "{{message}}",
    bodyViber: "{{message}}",
    bodySms: "{{message}}",
  },
];
