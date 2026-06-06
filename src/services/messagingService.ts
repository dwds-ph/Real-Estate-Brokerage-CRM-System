/**
 * Messaging Service — WhatsApp / Viber / SMS
 *
 * Provides deep link generation for wa.me and viber://, template filling,
 * message logging to Firestore, and template CRUD operations.
 */
import { where, orderBy, type QueryConstraint } from "firebase/firestore";
import {
  subscribeToQuery,
  createDocument,
  createDocumentWithUser,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firestore";
import {
  type MessageTemplate,
  type MessageLog,
  type MessagingChannel,
  type MessageTemplateType,
  DEFAULT_TEMPLATES,
} from "@/types";

// ─── Deep Link Generation ──────────────────────────────────────────

/**
 * Generate a deep link URL that opens the chat app with a pre-filled message.
 *
 * WhatsApp: https://wa.me/63{{phone}}?text={{encodedMessage}}
 * Viber:    viber://chat?number=%2B63{{phone}}&text={{encodedMessage}}
 * SMS:      sms:{{phone}}?body={{encodedMessage}}
 */
export function generateDeepLink(
  channel: MessagingChannel,
  phone: string,
  message: string,
): string {
  const encoded = encodeURIComponent(message);

  switch (channel) {
    case "whatsapp": {
      // Strip leading 0 or +63 if present, then prepend 63
      const clean = phone.replace(/^(\+?63|0)/, "");
      return `https://wa.me/63${clean}?text=${encoded}`;
    }
    case "viber": {
      const clean = phone.replace(/^(\+?63|0)/, "");
      return `viber://chat?number=%2B63${clean}&text=${encoded}`;
    }
    case "sms": {
      const clean = phone.replace(/^\+/, "");
      return `sms:${clean}?body=${encoded}`;
    }
    default:
      return "";
  }
}

// ─── Template Filling ─────────────────────────────────────────────

export type TemplateVariables = Record<string, string | number | undefined>;

/**
 * Replace {{placeholders}} in a template string with provided values.
 * Unresolved placeholders are left as-is in the output.
 */
export function fillTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

// ─── Send Message (open deep link + log) ──────────────────────────

export interface SendMessageMetadata {
  templateType: MessageTemplateType;
  recipientName: string;
  recipientPhone: string;
  messageBody: string;
  relatedId?: string;
  relatedType?: "lead" | "deal" | "listing";
  sentBy: string;
  brokerId: string;
}

/**
 * Open the chat channel deep link in a new tab and log the message to Firestore.
 * Returns the generated deep link URL.
 */
export async function sendMessageViaChannel(
  channel: MessagingChannel,
  phone: string,
  message: string,
  metadata: SendMessageMetadata,
): Promise<string> {
  const deepLink = generateDeepLink(channel, phone, message);

  // Open the deep link in a new tab
  window.open(deepLink, "_blank", "noopener,noreferrer");

  // Log the message to Firestore
  await logMessage({
    channel,
    templateType: metadata.templateType,
    recipientName: metadata.recipientName,
    recipientPhone: metadata.recipientPhone,
    messageBody: metadata.messageBody,
    deepLink,
    relatedId: metadata.relatedId,
    relatedType: metadata.relatedType,
    sentBy: metadata.sentBy,
    brokerId: metadata.brokerId,
    status: "sent",
  });

  return deepLink;
}

// ─── Message Logging ──────────────────────────────────────────────

export type LogMessageInput = Omit<MessageLog, "id" | "createdAt">;

/**
 * Create a message log entry in Firestore.
 */
export async function logMessage(data: LogMessageInput): Promise<string> {
  return createDocument(COLLECTIONS.MESSAGE_LOGS, data as unknown as Record<string, unknown>);
}

/**
 * Real-time listener for message logs scoped to a broker.
 * Returns an unsubscribe function.
 */
export function subscribeMessageLogs(
  brokerId: string,
  callback: (logs: MessageLog[]) => void,
  onError?: (error: string) => void,
) {
  const constraints: QueryConstraint[] = [
    where("brokerId", "==", brokerId),
    orderBy("createdAt", "desc"),
  ];

  return subscribeToQuery<MessageLog>(
    COLLECTIONS.MESSAGE_LOGS,
    constraints,
    callback,
    onError,
  );
}

/**
 * Real-time listener for message logs related to a specific entity.
 */
export function subscribeMessageLogsForEntity(
  relatedId: string,
  callback: (logs: MessageLog[]) => void,
  onError?: (error: string) => void,
) {
  const constraints: QueryConstraint[] = [
    where("relatedId", "==", relatedId),
    orderBy("createdAt", "desc"),
  ];

  return subscribeToQuery<MessageLog>(
    COLLECTIONS.MESSAGE_LOGS,
    constraints,
    callback,
    onError,
  );
}

// ─── Pre-built Message Generators ─────────────────────────────────

/**
 * Generate a "Property Inquiry" message using default template.
 */
export function generatePropertyInquiryMessage(
  clientName: string,
  propertyAddress: string,
  agentName: string,
): string {
  const template = DEFAULT_TEMPLATES.find((t) => t.type === "property-inquiry")!;
  return fillTemplate(template.bodyWhatsApp, {
    clientName,
    propertyAddress,
    agentName,
  });
}

/**
 * Generate a "Payment Reminder" message using default template.
 */
export function generatePaymentReminderMessage(
  clientName: string,
  amount: number | string,
  date: string,
  agentName: string,
): string {
  const template = DEFAULT_TEMPLATES.find((t) => t.type === "payment-reminder")!;
  return fillTemplate(template.bodyWhatsApp, {
    clientName,
    amount: String(amount),
    date,
    agentName,
  });
}

/**
 * Generate a "Tour Confirmation" message using default template.
 */
export function generateTourConfirmationMessage(
  clientName: string,
  date: string,
  propertyAddress: string,
  agentName: string,
): string {
  const template = DEFAULT_TEMPLATES.find((t) => t.type === "tour-confirmation")!;
  return fillTemplate(template.bodyWhatsApp, {
    clientName,
    date,
    propertyAddress,
    agentName,
  });
}

// ─── Template CRUD ────────────────────────────────────────────────

/**
 * Real-time listener for message templates scoped to a broker.
 * Returns an unsubscribe function.
 */
export function subscribeMessageTemplates(
  brokerId: string,
  callback: (templates: MessageTemplate[]) => void,
  onError?: (error: string) => void,
) {
  const constraints: QueryConstraint[] = [
    where("brokerId", "==", brokerId),
    orderBy("createdAt", "desc"),
  ];

  return subscribeToQuery<MessageTemplate>(
    COLLECTIONS.MESSAGE_TEMPLATES,
    constraints,
    callback,
    onError,
  );
}

/**
 * Save a new message template to Firestore.
 * The `type`, `name`, `description`, and body fields must be provided;
 * `createdBy` and `brokerId` are set automatically from the userId.
 */
export async function saveMessageTemplate(
  data: Omit<
    MessageTemplate,
    "id" | "createdBy" | "brokerId" | "createdAt" | "updatedAt"
  >,
  userId: string,
  brokerId: string,
): Promise<string> {
  return createDocumentWithUser(COLLECTIONS.MESSAGE_TEMPLATES, {
    ...data,
    brokerId,
  } as unknown as Record<string, unknown>, userId);
}

/**
 * Update an existing message template.
 */
export async function updateMessageTemplate(
  templateId: string,
  data: Partial<MessageTemplate>,
): Promise<void> {
  return updateDocument(COLLECTIONS.MESSAGE_TEMPLATES, templateId, data);
}

/**
 * Delete a message template by ID.
 */
export async function deleteMessageTemplate(
  templateId: string,
): Promise<void> {
  return deleteDocument(COLLECTIONS.MESSAGE_TEMPLATES, templateId);
}
