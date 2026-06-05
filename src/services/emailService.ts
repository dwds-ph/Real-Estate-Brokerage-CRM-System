/**
 * Client-side email sending service using Resend's REST API.
 *
 * Since this is a client-only app (no Cloud Functions), we use the Resend
 * JavaScript SDK directly with a restricted API key from environment config.
 * The API key is expected to be set in VITE_RESEND_API_KEY.
 *
 * If the API key is not set, all send operations gracefully degrade to no-ops
 * — no errors are thrown.
 */
import { Resend } from "resend";
import { COLLECTIONS, createDocument } from "@/lib/firestore";

// ─── Types ───────────────────────────────────────────────────────────────

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string; // default: 'CRM <crm@yourdomain.com>'
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ─── Resend client (lazy) ───────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = getApiKey();
  if (!apiKey) return null;
  _resend = new Resend(apiKey);
  return _resend;
}

function getApiKey(): string {
  try {
    return import.meta.env.VITE_RESEND_API_KEY ?? "";
  } catch {
    return "";
  }
}

/**
 * True if a Resend API key is configured and sending is possible.
 */
export function isEmailEnabled(): boolean {
  return !!getApiKey();
}

// ─── Logging helper (audit trail) ──────────────────────────────────────

async function logEmail(
  to: string[],
  subject: string,
  template: string | undefined,
  status: "sent" | "failed" | "pending",
  userId: string,
  brokerId?: string,
  resendId?: string,
  error?: string,
): Promise<void> {
  try {
    await createDocument(COLLECTIONS.EMAIL_LOGS, {
      to,
      subject,
      template,
      status,
      userId,
      brokerId: brokerId ?? "",
      resendId,
      error,
    } as any);
  } catch {
    // Silently fail — logging should never block the app
  }
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Send a single email via Resend.
 *
 * Returns `{ success: true, id }` on success, or `{ success: false, error }`
 * on failure. Gracefully returns `{ success: false, error: "not configured" }`
 * when VITE_RESEND_API_KEY is not set.
 *
 * @param payload  Email content (to, subject, html, optional from/cc/bcc)
 * @param userId   Authenticated user ID (for audit logging)
 * @param brokerId Optional broker/org ID (for audit logging)
 * @param template Optional template name used (for audit logging)
 */
export async function sendEmail(
  payload: EmailPayload,
  userId?: string,
  brokerId?: string,
  template?: string,
): Promise<SendResult> {
  const client = getResend();
  if (!client) {
    const result: SendResult = { success: false, error: "Email service not configured — set VITE_RESEND_API_KEY" };
    // Still log the attempt
    if (userId) {
      const toArr = Array.isArray(payload.to) ? payload.to : [payload.to];
      await logEmail(toArr, payload.subject, template, "failed", userId, brokerId, undefined, result.error);
    }
    return result;
  }

  try {
    const { data, error } = await client.emails.send({
      from: payload.from || "CRM <crm@yourdomain.com>",
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      cc: payload.cc ? (Array.isArray(payload.cc) ? payload.cc : [payload.cc]) : undefined,
      bcc: payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc]) : undefined,
    });

    if (error) {
      // Log failure
      const toArr = Array.isArray(payload.to) ? payload.to : [payload.to];
      if (userId) {
        await logEmail(toArr, payload.subject, template, "failed", userId, brokerId, undefined, error.message);
      }
      return { success: false, error: error.message };
    }

    // Log success
    const toArr = Array.isArray(payload.to) ? payload.to : [payload.to];
    if (userId) {
      await logEmail(toArr, payload.subject, template, "sent", userId, brokerId, data?.id);
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    const toArr = Array.isArray(payload.to) ? payload.to : [payload.to];
    if (userId) {
      await logEmail(toArr, payload.subject, template, "failed", userId, brokerId, undefined, message);
    }
    return { success: false, error: message };
  }
}

/**
 * Send multiple emails sequentially.
 *
 * Each email is sent independently; failures for one do not affect others.
 * Returns an array of results corresponding to each payload in order.
 */
export async function sendBulkEmails(
  payloads: EmailPayload[],
  userId?: string,
  brokerId?: string,
  template?: string,
): Promise<SendResult[]> {
  return Promise.all(
    payloads.map((p) => sendEmail(p, userId, brokerId, template)),
  );
}
