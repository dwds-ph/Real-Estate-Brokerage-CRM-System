/**
 * HTML email template builder.
 *
 * Each function returns a complete HTML string with inline CSS for
 * optimal email client compatibility. All templates are responsive
 * and follow a consistent branded design.
 */

// ─── Base wrapper ───────────────────────────────────────────────────────

function baseWrapper(content: string, title?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || "CRM Notification"}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a73e8;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Real Estate CRM</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;padding:16px 32px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="margin:0;font-size:12px;color:#6c757d;">
                Real Estate Brokerage CRM &bull; Automated notification
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#adb5bd;">
                This is an automated message. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    pending: "#f59e0b",
    closed: "#10b981",
    cancelled: "#ef4444",
  };
  const bg = colors[status.toLowerCase()] || "#6b7280";
  return `<span style="display:inline-block;padding:4px 12px;border-radius:12px;color:#ffffff;background-color:${bg};font-size:13px;font-weight:500;">${status}</span>`;
}

// ─── Template functions ─────────────────────────────────────────────────

/**
 * Template for when a deal's status changes.
 */
export function dealStatusChange(dealTitle: string, newStatus: string): string {
  const content = `
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:18px;">Deal Status Updated</h2>
    <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
      The status of <strong>${dealTitle}</strong> has been updated.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <td style="padding:12px;background-color:#f8f9fa;border-radius:6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Deal</td>
            </tr>
            <tr>
              <td style="font-size:16px;font-weight:600;color:#1a1a2e;padding-bottom:12px;">${dealTitle}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">New Status</td>
            </tr>
            <tr>
              <td>${statusBadge(newStatus)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6c757d;font-size:13px;">Log in to the CRM to view details and take any necessary action.</p>
  `;
  return baseWrapper(content, "Deal Status Updated");
}

/**
 * Template for when a payment is received.
 */
export function paymentReceived(amount: number, dealTitle: string): string {
  const formattedAmount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);

  const content = `
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:18px;">Payment Received ✓</h2>
    <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
      A payment has been received for <strong>${dealTitle}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <td style="padding:12px;background-color:#f0fdf4;border-radius:6px;border:1px solid #bbf7d0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Amount Received</td>
            </tr>
            <tr>
              <td style="font-size:24px;font-weight:700;color:#16a34a;">${formattedAmount}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Deal</td>
      </tr>
      <tr>
        <td style="font-size:15px;font-weight:600;color:#1a1a2e;">${dealTitle}</td>
      </tr>
    </table>
    <p style="margin:0;color:#6c757d;font-size:13px;">View the full payment history in the CRM.</p>
  `;
  return baseWrapper(content, "Payment Received");
}

/**
 * Template for overdue payment reminders.
 */
export function paymentOverdue(amount: number, dueDate: string): string {
  const formattedAmount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);

  const content = `
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:18px;">Payment Overdue ⚠️</h2>
    <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
      This is a reminder that a payment is now overdue.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <td style="padding:12px;background-color:#fef2f2;border-radius:6px;border:1px solid #fecaca;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Overdue Amount</td>
            </tr>
            <tr>
              <td style="font-size:24px;font-weight:700;color:#dc2626;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-top:8px;padding-bottom:4px;">Due Date</td>
            </tr>
            <tr>
              <td style="font-size:15px;font-weight:600;color:#1a1a2e;">${dueDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6c757d;font-size:13px;">Please arrange payment at your earliest convenience. Log in to the CRM for more details.</p>
  `;
  return baseWrapper(content, "Payment Overdue");
}

/**
 * Template for tour/ viewing confirmations.
 */
export function tourConfirmed(property: string, date: string, time: string): string {
  const content = `
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:18px;">Tour Confirmed 🎯</h2>
    <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
      A property tour has been confirmed.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <td style="padding:12px;background-color:#f0f9ff;border-radius:6px;border:1px solid #bae6fd;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Property</td>
            </tr>
            <tr>
              <td style="font-size:16px;font-weight:600;color:#1a1a2e;padding-bottom:12px;">${property}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Date</td>
            </tr>
            <tr>
              <td style="font-size:15px;font-weight:600;color:#1a1a2e;padding-bottom:8px;">${date}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Time</td>
            </tr>
            <tr>
              <td style="font-size:15px;font-weight:600;color:#1a1a2e;">${time}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6c757d;font-size:13px;">Review the tour details in the CRM and prepare accordingly.</p>
  `;
  return baseWrapper(content, "Tour Confirmed");
}

/**
 * Template for when a new lead is assigned.
 */
export function newLeadAssigned(leadName: string, agentName: string): string {
  const content = `
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:18px;">New Lead Assigned ✨</h2>
    <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
      A new lead has been assigned to <strong>${agentName}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <td style="padding:12px;background-color:#f5f3ff;border-radius:6px;border:1px solid #ddd6fe;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Lead Name</td>
            </tr>
            <tr>
              <td style="font-size:16px;font-weight:600;color:#1a1a2e;padding-bottom:12px;">${leadName}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Assigned To</td>
            </tr>
            <tr>
              <td style="font-size:15px;font-weight:600;color:#1a1a2e;">${agentName}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6c757d;font-size:13px;">View the lead profile in the CRM and follow up promptly.</p>
  `;
  return baseWrapper(content, "New Lead Assigned");
}

/**
 * Template for when a document is uploaded to a deal.
 */
export function documentUploaded(documentName: string, dealTitle: string): string {
  const content = `
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:18px;">Document Uploaded 📄</h2>
    <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
      A new document has been uploaded for <strong>${dealTitle}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <td style="padding:12px;background-color:#f8f9fa;border-radius:6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Document</td>
            </tr>
            <tr>
              <td style="font-size:16px;font-weight:600;color:#1a1a2e;padding-bottom:12px;">${documentName}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#6c757d;padding-bottom:4px;">Deal</td>
            </tr>
            <tr>
              <td style="font-size:15px;font-weight:600;color:#1a1a2e;">${dealTitle}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6c757d;font-size:13px;">Access the document in the CRM vault.</p>
  `;
  return baseWrapper(content, "Document Uploaded");
}
