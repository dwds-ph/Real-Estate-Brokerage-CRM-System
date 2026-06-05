/**
 * Email trigger integration layer.
 *
 * This module provides exportable functions that services can call when
 * certain events occur (deal status changes, payment creation, etc.).
 *
 * Each function checks the user's EmailPreferences before sending, and
 * gracefully degrades when no API key is configured.
 *
 * These are designed to be called imperatively from existing service code,
 * NOT as automatic hooks/listeners — keeping complexity manageable.
 */
import {
  sendEmail,
  isEmailEnabled,
  type EmailPayload,
} from "./emailService";
import {
  dealStatusChange,
  paymentReceived,
  paymentOverdue,
  tourConfirmed,
  newLeadAssigned,
  documentUploaded,
} from "./emailTemplates";

// ─── Trigger Functions ──────────────────────────────────────────────────

/**
 * Send a notification when a deal's status changes.
 *
 * @param dealTitle  The title of the deal
 * @param newStatus  The new deal status (pending / closed / cancelled)
 * @param recipientEmail  Email address of the recipient
 * @param userId     Authenticated user ID (for audit logging)
 * @param brokerId   Optional broker/org ID (for audit logging)
 */
export async function notifyDealStatusChange(
  dealTitle: string,
  newStatus: string,
  recipientEmail: string,
  userId?: string,
  brokerId?: string,
): Promise<void> {
  if (!isEmailEnabled() || !recipientEmail) return;

  const html = dealStatusChange(dealTitle, newStatus);
  const payload: EmailPayload = {
    to: recipientEmail,
    subject: `Deal Status Updated: ${dealTitle} → ${newStatus}`,
    html,
  };

  await sendEmail(payload, userId, brokerId, "dealStatusChange");
}

/**
 * Send a notification when a payment is received.
 */
export async function notifyPaymentReceived(
  amount: number,
  dealTitle: string,
  recipientEmail: string,
  userId?: string,
  brokerId?: string,
): Promise<void> {
  if (!isEmailEnabled() || !recipientEmail) return;

  const html = paymentReceived(amount, dealTitle);
  const payload: EmailPayload = {
    to: recipientEmail,
    subject: `Payment Received - ${dealTitle}`,
    html,
  };

  await sendEmail(payload, userId, brokerId, "paymentReceived");
}

/**
 * Send a notification when a payment is overdue.
 */
export async function notifyPaymentOverdue(
  amount: number,
  dueDate: string,
  recipientEmail: string,
  userId?: string,
  brokerId?: string,
): Promise<void> {
  if (!isEmailEnabled() || !recipientEmail) return;

  const html = paymentOverdue(amount, dueDate);
  const payload: EmailPayload = {
    to: recipientEmail,
    subject: `Payment Overdue - ${dueDate}`,
    html,
  };

  await sendEmail(payload, userId, brokerId, "paymentOverdue");
}

/**
 * Send a confirmation when a tour / viewing is scheduled.
 */
export async function notifyTourConfirmed(
  property: string,
  date: string,
  time: string,
  recipientEmail: string,
  userId?: string,
  brokerId?: string,
): Promise<void> {
  if (!isEmailEnabled() || !recipientEmail) return;

  const html = tourConfirmed(property, date, time);
  const payload: EmailPayload = {
    to: recipientEmail,
    subject: `Tour Confirmed - ${property}`,
    html,
  };

  await sendEmail(payload, userId, brokerId, "tourConfirmed");
}

/**
 * Send a notification when a new lead is assigned.
 */
export async function notifyNewLeadAssigned(
  leadName: string,
  agentName: string,
  recipientEmail: string,
  userId?: string,
  brokerId?: string,
): Promise<void> {
  if (!isEmailEnabled() || !recipientEmail) return;

  const html = newLeadAssigned(leadName, agentName);
  const payload: EmailPayload = {
    to: recipientEmail,
    subject: `New Lead Assigned - ${leadName}`,
    html,
  };

  await sendEmail(payload, userId, brokerId, "newLeadAssigned");
}

/**
 * Send a notification when a document is uploaded.
 */
export async function notifyDocumentUploaded(
  documentName: string,
  dealTitle: string,
  recipientEmail: string,
  userId?: string,
  brokerId?: string,
): Promise<void> {
  if (!isEmailEnabled() || !recipientEmail) return;

  const html = documentUploaded(documentName, dealTitle);
  const payload: EmailPayload = {
    to: recipientEmail,
    subject: `Document Uploaded - ${documentName}`,
    html,
  };

  await sendEmail(payload, userId, brokerId, "documentUploaded");
}
