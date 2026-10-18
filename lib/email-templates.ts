// =============================================================================
// Email Templates — VRD Exports Leave Management
// =============================================================================
// All templates return HTML strings for use with Resend.
// No credentials, secrets, or unnecessary personal data are included.
// =============================================================================

import { formatDateLong } from "@/lib/utils";

// Brand colors
const BRAND = {
  primary: "#1e3a5f",
  accent: "#2563eb",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#d97706",
  bg: "#f8fafc",
  border: "#e2e8f0",
  text: "#1e293b",
  textMuted: "#64748b",
};

function baseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:8px;border:1px solid ${BRAND.border};overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.primary};padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;color:#93c5fd;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">VRD EXPORTS</p>
                    <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;">Leave Management System</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND.bg};padding:20px 32px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-size:12px;color:${BRAND.textMuted};text-align:center;">
                This is an automated message from VRD Exports Leave Management System.<br/>
                Please do not reply to this email.
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

function statusBadge(status: string): string {
  const colors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: "#fef3c7", text: "#92400e" },
    APPROVED: { bg: "#d1fae5", text: "#065f46" },
    DECLINED: { bg: "#fee2e2", text: "#991b1b" },
    CANCELLED: { bg: "#f1f5f9", text: "#475569" },
  };
  const c = colors[status] || colors.PENDING;
  return `<span style="display:inline-block;padding:4px 12px;border-radius:100px;font-size:12px;font-weight:700;letter-spacing:0.5px;background-color:${c.bg};color:${c.text};">${status}</span>`;
}

function detailRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};width:40%;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:${BRAND.text};font-weight:500;">${value || "—"}</td>
  </tr>`;
}

interface ApplicationDetails {
  referenceNumber: string;
  employeeName: string;
  leaveType: string;
  startDate: Date | string;
  endDate: Date | string;
  totalDays: number;
  reason: string;
  status: string;
  appUrl: string;
  remarks?: string;
}

// ---------------------------------------------------------------------------
// 1. Submission Confirmation (to employee)
// ---------------------------------------------------------------------------

export function submissionConfirmationEmail(data: ApplicationDetails): {
  subject: string;
  html: string;
} {
  const subject = `Leave Application Submitted — Ref: ${data.referenceNumber}`;

  const content = `
    <h2 style="margin:0 0 8px;color:${BRAND.text};font-size:18px;">Application Submitted Successfully</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">
      Dear ${data.employeeName}, your leave application has been submitted and is pending review.
    </p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.textMuted};font-weight:600;">Application Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Reference Number", `<strong>${data.referenceNumber}</strong>`)}
        ${detailRow("Leave Type", data.leaveType)}
        ${detailRow("From", formatDateLong(data.startDate))}
        ${detailRow("To", formatDateLong(data.endDate))}
        ${detailRow("Total Days", `${data.totalDays} day${data.totalDays !== 1 ? "s" : ""}`)}
        ${detailRow("Status", statusBadge("PENDING"))}
      </table>
    </div>

    <p style="font-size:13px;color:${BRAND.textMuted};margin:0 0 16px;">
      You can check the status of your application at any time using your reference number and registered email address.
    </p>

    <a href="${data.appUrl}/leave-status" style="display:inline-block;background-color:${BRAND.accent};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
      Check Application Status
    </a>

    <p style="margin:24px 0 0;font-size:12px;color:${BRAND.textMuted};">
      Reference: <strong>${data.referenceNumber}</strong> — Keep this for your records.
    </p>
  `;

  return { subject, html: baseTemplate(content, subject) };
}

// ---------------------------------------------------------------------------
// 2. Manager / HR Notification (on new submission)
// ---------------------------------------------------------------------------

export function managerNotificationEmail(
  data: ApplicationDetails & {
    employeeEmail: string;
    handoverPersonName?: string;
    adminUrl: string;
  }
): { subject: string; html: string } {
  const subject = `Leave Application — ${data.employeeName} (${data.referenceNumber})`;

  const content = `
    <h2 style="margin:0 0 8px;color:${BRAND.text};font-size:18px;">New Leave Application</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">
      A new leave application has been submitted and requires your attention.
    </p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.textMuted};font-weight:600;">Application Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Reference", `<strong>${data.referenceNumber}</strong>`)}
        ${detailRow("Employee", data.employeeName)}
        ${detailRow("Email", data.employeeEmail)}
        ${detailRow("Leave Type", data.leaveType)}
        ${detailRow("From", formatDateLong(data.startDate))}
        ${detailRow("To", formatDateLong(data.endDate))}
        ${detailRow("Total Days", `${data.totalDays} day${data.totalDays !== 1 ? "s" : ""}`)}
        ${data.handoverPersonName ? detailRow("Handover To", data.handoverPersonName) : ""}
        ${detailRow("Status", statusBadge("PENDING"))}
      </table>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#1e40af;">
        <strong>Reason:</strong> ${data.reason}
      </p>
    </div>

    <a href="${data.adminUrl}" style="display:inline-block;background-color:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
      Review in Admin Dashboard
    </a>

    <p style="margin:16px 0 0;font-size:11px;color:${BRAND.textMuted};">
      Note: This notification is for information purposes. Approval actions are taken through the admin dashboard.
    </p>
  `;

  return { subject, html: baseTemplate(content, subject) };
}

// ---------------------------------------------------------------------------
// 3. Handover / Assigned Person Notification
// ---------------------------------------------------------------------------

export function handoverNotificationEmail(data: {
  handoverPersonName: string;
  employeeName: string;
  leaveType: string;
  startDate: Date | string;
  endDate: Date | string;
  totalDays: number;
  referenceNumber: string;
  appUrl: string;
}): { subject: string; html: string } {
  const subject = `Handover Notification — ${data.employeeName} Leave (${data.referenceNumber})`;

  const content = `
    <h2 style="margin:0 0 8px;color:${BRAND.text};font-size:18px;">Handover Notification</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">
      Dear ${data.handoverPersonName}, you have been assigned as the handover contact for the following leave application.
    </p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Employee on Leave", data.employeeName)}
        ${detailRow("Leave Type", data.leaveType)}
        ${detailRow("From", formatDateLong(data.startDate))}
        ${detailRow("To", formatDateLong(data.endDate))}
        ${detailRow("Total Days", `${data.totalDays} day${data.totalDays !== 1 ? "s" : ""}`)}
      </table>
    </div>

    <p style="font-size:13px;color:${BRAND.textMuted};margin:0;">
      Please coordinate with ${data.employeeName} for any handover responsibilities during their absence.
    </p>
  `;

  return { subject, html: baseTemplate(content, subject) };
}

// ---------------------------------------------------------------------------
// 4. Approval Notification (to employee)
// ---------------------------------------------------------------------------

export function approvalNotificationEmail(data: ApplicationDetails): {
  subject: string;
  html: string;
} {
  const subject = `Leave Application Approved — Ref: ${data.referenceNumber}`;

  const content = `
    <h2 style="margin:0 0 8px;color:${BRAND.success};font-size:18px;">✓ Leave Application Approved</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">
      Dear ${data.employeeName}, your leave application has been approved.
    </p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Reference", `<strong>${data.referenceNumber}</strong>`)}
        ${detailRow("Leave Type", data.leaveType)}
        ${detailRow("From", formatDateLong(data.startDate))}
        ${detailRow("To", formatDateLong(data.endDate))}
        ${detailRow("Total Days", `${data.totalDays} day${data.totalDays !== 1 ? "s" : ""}`)}
        ${detailRow("Status", statusBadge("APPROVED"))}
        ${data.remarks ? detailRow("Remarks", data.remarks) : ""}
      </table>
    </div>

    <a href="${data.appUrl}/leave-status" style="display:inline-block;background-color:${BRAND.success};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
      View Application Status
    </a>
  `;

  return { subject, html: baseTemplate(content, subject) };
}

// ---------------------------------------------------------------------------
// 5. Rejection Notification (to employee)
// ---------------------------------------------------------------------------

export function rejectionNotificationEmail(data: ApplicationDetails): {
  subject: string;
  html: string;
} {
  const subject = `Leave Application Update — Ref: ${data.referenceNumber}`;

  const content = `
    <h2 style="margin:0 0 8px;color:${BRAND.danger};font-size:18px;">Leave Application Declined</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">
      Dear ${data.employeeName}, unfortunately your leave application has been declined.
    </p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Reference", `<strong>${data.referenceNumber}</strong>`)}
        ${detailRow("Leave Type", data.leaveType)}
        ${detailRow("From", formatDateLong(data.startDate))}
        ${detailRow("To", formatDateLong(data.endDate))}
        ${detailRow("Status", statusBadge("DECLINED"))}
        ${data.remarks ? detailRow("Reason for Decline", data.remarks) : ""}
      </table>
    </div>

    <p style="font-size:13px;color:${BRAND.textMuted};margin:0 0 16px;">
      If you have questions, please contact your reporting manager or HR department.
    </p>

    <a href="${data.appUrl}/leave-status" style="display:inline-block;background-color:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
      View Application Status
    </a>
  `;

  return { subject, html: baseTemplate(content, subject) };
}

// ---------------------------------------------------------------------------
// 6. Status Update to Manager/HR (on approval/rejection)
// ---------------------------------------------------------------------------

export function statusUpdateManagerEmail(data: ApplicationDetails & {
  updatedBy?: string;
}): { subject: string; html: string } {
  const action = data.status === "APPROVED" ? "Approved" : data.status === "DECLINED" ? "Declined" : "Updated";
  const subject = `Leave Application ${action} — ${data.employeeName} (${data.referenceNumber})`;

  const content = `
    <h2 style="margin:0 0 8px;color:${BRAND.text};font-size:18px;">Leave Application Status Updated</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">
      The following leave application status has been updated.
    </p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:6px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${detailRow("Reference", `<strong>${data.referenceNumber}</strong>`)}
        ${detailRow("Employee", data.employeeName)}
        ${detailRow("Leave Type", data.leaveType)}
        ${detailRow("From", formatDateLong(data.startDate))}
        ${detailRow("To", formatDateLong(data.endDate))}
        ${detailRow("New Status", statusBadge(data.status))}
        ${data.remarks ? detailRow("Remarks", data.remarks) : ""}
        ${data.updatedBy ? detailRow("Action By", data.updatedBy) : ""}
      </table>
    </div>
  `;

  return { subject, html: baseTemplate(content, subject) };
}
