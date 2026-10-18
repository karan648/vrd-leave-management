// =============================================================================
// Email Service — Resend Integration
// =============================================================================
// SERVER-SIDE ONLY. Never import from client components.
// Email failures do not undo database operations.
// All delivery attempts are logged in NotificationLog.
// =============================================================================

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import {
  submissionConfirmationEmail,
  managerNotificationEmail,
  handoverNotificationEmail,
  approvalNotificationEmail,
  rejectionNotificationEmail,
  statusUpdateManagerEmail,
} from "@/lib/email-templates";
import type { NotificationType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Resend client (lazy-initialized to avoid errors at build time)
// ---------------------------------------------------------------------------

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not configured. Set it in your .env file to enable email notifications."
    );
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function getFromAddress(): string {
  const email = process.env.RESEND_FROM_EMAIL;
  const name = process.env.RESEND_FROM_NAME || "VRD Exports Leave Management";
  if (!email) {
    throw new Error(
      "RESEND_FROM_EMAIL is not configured. Set it in your .env file."
    );
  }
  return `${name} <${email}>`;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// ---------------------------------------------------------------------------
// Core send function with logging
// ---------------------------------------------------------------------------

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  type: NotificationType;
  leaveApplicationId: string;
  idempotencyKey?: string;
}

async function sendEmail(opts: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const {
    to,
    toName,
    subject,
    html,
    type,
    leaveApplicationId,
    idempotencyKey,
  } = opts;

  // Check idempotency: don't re-send if already sent
  if (idempotencyKey) {
    const existing = await prisma.notificationLog.findUnique({
      where: { idempotencyKey },
    });
    if (existing && existing.status === "SENT") {
      return {
        success: true,
        messageId: existing.resendMessageId ?? undefined,
      };
    }
  }

  // Create or update notification log entry
  let logId: string;
  try {
    const log = await prisma.notificationLog.upsert({
      where: { idempotencyKey: idempotencyKey || `${leaveApplicationId}-${type}-${to}` },
      update: {
        status: "PENDING",
        errorMessage: null,
        lastAttemptAt: new Date(),
        attemptCount: { increment: 1 },
      },
      create: {
        leaveApplicationId,
        type,
        recipientEmail: to,
        recipientName: toName,
        subject,
        status: "PENDING",
        idempotencyKey: idempotencyKey || `${leaveApplicationId}-${type}-${to}`,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      },
    });
    logId = log.id;
  } catch (err) {
    console.error("[Email] Failed to create notification log:", err);
    return { success: false, error: "Failed to create notification log" };
  }

  // Attempt to send
  try {
    const resend = getResend();
    const from = getFromAddress();

    const result = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    const messageId = (result.data as { id?: string } | null)?.id;

    // Update log to SENT
    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        status: "SENT",
        resendMessageId: messageId,
        sentAt: new Date(),
      },
    });

    return { success: true, messageId };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Email] Failed to send ${type} to ${to}:`, errorMessage);

    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        status: "FAILED",
        errorMessage: errorMessage.substring(0, 500),
      },
    });

    return { success: false, error: errorMessage };
  }
}

// ---------------------------------------------------------------------------
// Check if email is configured and valid
// ---------------------------------------------------------------------------

function isValidEmail(email?: string | null): boolean {
  if (!email || !email.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseEmailList(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  const items = raw.split(/[,;\n\r]+/);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const trimmed = item.trim().toLowerCase();
    if (isValidEmail(trimmed) && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Deduplicate recipients
// ---------------------------------------------------------------------------

function deduplicateRecipients<T extends { email: string }>(
  recipients: T[]
): T[] {
  const seen = new Set<string>();
  return recipients.filter(({ email }) => {
    const normalized = email.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Get configured recipients from env or DB settings (supports comma-separated)
// ---------------------------------------------------------------------------

async function getEmailListFromSetting(key: string, envVal?: string): Promise<string[]> {
  try {
    const setting = await prisma.companySetting.findUnique({
      where: { key },
    });
    if (setting?.value) {
      let parsed = setting.value;
      try {
        parsed = JSON.parse(setting.value);
      } catch {}
      if (Array.isArray(parsed)) {
        const list = parsed.flatMap((e) => parseEmailList(String(e)));
        if (list.length > 0) return list;
      }
      if (typeof parsed === "string") {
        const list = parseEmailList(parsed);
        if (list.length > 0) return list;
      }
    }
  } catch {
    // fall through to env
  }
  return parseEmailList(envVal);
}

export async function getHREmails(): Promise<string[]> {
  return getEmailListFromSetting("hr_notification_email", process.env.HR_NOTIFICATION_EMAIL);
}

export async function getAdminEmails(): Promise<string[]> {
  return getEmailListFromSetting(
    "admin_notification_email",
    process.env.LEAVE_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL
  );
}

export async function getEAEmails(): Promise<string[]> {
  return getEmailListFromSetting("ea_notification_email", process.env.EA_NOTIFICATION_EMAIL);
}

export async function getOwnerEmails(): Promise<string[]> {
  return getEmailListFromSetting("owner_notification_email", process.env.OWNER_NOTIFICATION_EMAIL);
}

export async function getAdditionalEmails(): Promise<string[]> {
  return getEmailListFromSetting(
    "additional_notification_emails",
    process.env.ADDITIONAL_NOTIFICATION_EMAILS
  );
}

export async function getApproverEmails(): Promise<string[]> {
  return getEmailListFromSetting(
    "approver_notification_emails",
    process.env.APPROVER_NOTIFICATION_EMAILS
  );
}

export async function getAdminUserEmails(): Promise<string[]> {
  try {
    const adminUsers = await prisma.adminUser.findMany({
      where: {
        isActive: true,
        role: { in: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"] },
      },
      select: { email: true },
    });
    return adminUsers.map((u) => u.email.toLowerCase().trim()).filter(Boolean);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public: Send post-submission notifications
// ---------------------------------------------------------------------------

export async function sendSubmissionNotifications(data: {
  leaveApplicationId: string;
  referenceNumber: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  reportingManagerName: string;
  reportingManagerEmail: string;
  handoverPersonName?: string | null;
  handoverPersonEmail?: string | null;
}) {
  const appUrl = getAppUrl();
  const adminUrl = `${appUrl}/admin/applications`;

  const applicationData = {
    referenceNumber: data.referenceNumber,
    employeeName: data.employeeName,
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    totalDays: data.totalDays,
    reason: data.reason,
    status: "PENDING",
    appUrl,
  };

  const results: Array<{ type: string; success: boolean }> = [];

  // 1. Employee submission confirmation
  try {
    const tpl = submissionConfirmationEmail(applicationData);
    const r = await sendEmail({
      to: data.employeeEmail,
      toName: data.employeeName,
      subject: tpl.subject,
      html: tpl.html,
      type: "SUBMISSION_CONFIRMATION",
      leaveApplicationId: data.leaveApplicationId,
      idempotencyKey: `${data.leaveApplicationId}-SUBMISSION_CONFIRMATION-${data.employeeEmail}`,
    });
    results.push({ type: "SUBMISSION_CONFIRMATION", success: r.success });
  } catch (err) {
    console.error("[Email] Submission confirmation failed:", err);
    results.push({ type: "SUBMISSION_CONFIRMATION", success: false });
  }

  // Collect manager, HR, EA, Owners, Admin, and Additional CCs for review notification
  const notifyList: Array<{
    email: string;
    name: string;
    type: NotificationType;
  }> = [];

  // Reporting Manager
  if (isValidEmail(data.reportingManagerEmail)) {
    notifyList.push({
      email: data.reportingManagerEmail.trim().toLowerCase(),
      name: data.reportingManagerName || "Reporting Manager",
      type: "MANAGER_NOTIFICATION",
    });
  }

  // HR Department
  const hrEmails = await getHREmails();
  for (const email of hrEmails) {
    notifyList.push({ email, name: "HR Department", type: "HR_NOTIFICATION" });
  }

  // Executive Assistant (EA)
  const eaEmails = await getEAEmails();
  for (const email of eaEmails) {
    notifyList.push({ email, name: "Executive Assistant (EA)", type: "ADMIN_NOTIFICATION" });
  }

  // Company Owners / Directors
  const ownerEmails = await getOwnerEmails();
  for (const email of ownerEmails) {
    notifyList.push({ email, name: "Company Management / Owner", type: "ADMIN_NOTIFICATION" });
  }

  // Leave Admin
  const adminEmails = await getAdminEmails();
  for (const email of adminEmails) {
    notifyList.push({ email, name: "Leave Admin", type: "ADMIN_NOTIFICATION" });
  }

  // Additional CCs / User's own inbox
  const additionalEmails = await getAdditionalEmails();
  for (const email of additionalEmails) {
    notifyList.push({ email, name: "Management Stakeholder", type: "ADMIN_NOTIFICATION" });
  }

  // Designated Approver Inboxes (up to 10+ approver emails)
  const approverEmails = await getApproverEmails();
  for (const email of approverEmails) {
    notifyList.push({ email, name: "Designated Leave Approver", type: "ADMIN_NOTIFICATION" });
  }

  // Active Admin Approvers from database
  const dbAdmins = await getAdminUserEmails();
  for (const email of dbAdmins) {
    notifyList.push({ email, name: "Admin Approver", type: "ADMIN_NOTIFICATION" });
  }

  // Deduplicate and send
  const unique = deduplicateRecipients(notifyList);
  for (const recipient of unique) {
    try {
      const tpl = managerNotificationEmail({
        ...applicationData,
        employeeEmail: data.employeeEmail,
        handoverPersonName: data.handoverPersonName ?? undefined,
        adminUrl,
      });
      const r = await sendEmail({
        to: recipient.email,
        toName: recipient.name,
        subject: tpl.subject,
        html: tpl.html,
        type: recipient.type,
        leaveApplicationId: data.leaveApplicationId,
        idempotencyKey: `${data.leaveApplicationId}-${recipient.type}-${recipient.email}`,
      });
      results.push({ type: recipient.type, success: r.success });
    } catch (err) {
      console.error(`[Email] Notification to ${recipient.email} failed:`, err);
      results.push({ type: recipient.type, success: false });
    }
  }

  // 3. Handover person notification
  if (isValidEmail(data.handoverPersonEmail) && data.handoverPersonName) {
    try {
      const tpl = handoverNotificationEmail({
        handoverPersonName: data.handoverPersonName,
        employeeName: data.employeeName,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        referenceNumber: data.referenceNumber,
        appUrl,
      });
      const r = await sendEmail({
        to: data.handoverPersonEmail!,
        toName: data.handoverPersonName,
        subject: tpl.subject,
        html: tpl.html,
        type: "HANDOVER_NOTIFICATION",
        leaveApplicationId: data.leaveApplicationId,
        idempotencyKey: `${data.leaveApplicationId}-HANDOVER_NOTIFICATION-${data.handoverPersonEmail}`,
      });
      results.push({ type: "HANDOVER_NOTIFICATION", success: r.success });
    } catch (err) {
      console.error("[Email] Handover notification failed:", err);
      results.push({ type: "HANDOVER_NOTIFICATION", success: false });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Public: Send post-approval/rejection notifications
// ---------------------------------------------------------------------------

export async function sendStatusUpdateNotifications(data: {
  leaveApplicationId: string;
  referenceNumber: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  newStatus: "APPROVED" | "DECLINED" | "CANCELLED";
  remarks?: string | null;
  performedByName?: string | null;
  reportingManagerEmail?: string | null;
  handoverPersonEmail?: string | null;
  handoverPersonName?: string | null;
}) {
  const appUrl = getAppUrl();

  const applicationData = {
    referenceNumber: data.referenceNumber,
    employeeName: data.employeeName,
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    totalDays: data.totalDays,
    reason: data.reason,
    status: data.newStatus,
    remarks: data.remarks ?? undefined,
    appUrl,
  };

  const results: Array<{ type: string; success: boolean }> = [];

  // 1. Notify employee
  if (data.newStatus === "APPROVED" || data.newStatus === "DECLINED") {
    try {
      const tpl =
        data.newStatus === "APPROVED"
          ? approvalNotificationEmail(applicationData)
          : rejectionNotificationEmail(applicationData);
      const notifType: NotificationType =
        data.newStatus === "APPROVED"
          ? "APPROVAL_NOTIFICATION"
          : "REJECTION_NOTIFICATION";
      const r = await sendEmail({
        to: data.employeeEmail,
        toName: data.employeeName,
        subject: tpl.subject,
        html: tpl.html,
        type: notifType,
        leaveApplicationId: data.leaveApplicationId,
        // No idempotency key here so HR can send again if re-approved after decline
        idempotencyKey: `${data.leaveApplicationId}-${notifType}-v${Date.now()}`,
      });
      results.push({ type: notifType, success: r.success });
    } catch (err) {
      console.error("[Email] Employee status notification failed:", err);
    }
  }

  // 2. Notify manager, HR, EA, Owners, Admin, and Additional CCs
  const notifyList: Array<{ email: string; name: string; type: NotificationType }> = [];
  if (isValidEmail(data.reportingManagerEmail)) {
    notifyList.push({
      email: data.reportingManagerEmail!.trim().toLowerCase(),
      name: "Reporting Manager",
      type: "STATUS_UPDATE_MANAGER",
    });
  }

  for (const email of await getHREmails()) {
    notifyList.push({ email, name: "HR Department", type: "STATUS_UPDATE_HR" });
  }

  for (const email of await getEAEmails()) {
    notifyList.push({ email, name: "Executive Assistant (EA)", type: "STATUS_UPDATE_HR" });
  }

  for (const email of await getOwnerEmails()) {
    notifyList.push({ email, name: "Company Management / Owner", type: "STATUS_UPDATE_HR" });
  }

  for (const email of await getAdminEmails()) {
    notifyList.push({ email, name: "Leave Admin", type: "STATUS_UPDATE_HR" });
  }

  for (const email of await getAdditionalEmails()) {
    notifyList.push({ email, name: "Management Stakeholder", type: "STATUS_UPDATE_HR" });
  }

  for (const email of await getApproverEmails()) {
    notifyList.push({ email, name: "Designated Leave Approver", type: "STATUS_UPDATE_HR" });
  }

  for (const email of await getAdminUserEmails()) {
    notifyList.push({ email, name: "Admin Approver", type: "STATUS_UPDATE_HR" });
  }

  for (const recipient of deduplicateRecipients(notifyList)) {
    try {
      const tpl = statusUpdateManagerEmail({
        ...applicationData,
        updatedBy: data.performedByName ?? "Admin",
      });
      const r = await sendEmail({
        to: recipient.email,
        subject: tpl.subject,
        html: tpl.html,
        type: recipient.type,
        leaveApplicationId: data.leaveApplicationId,
        idempotencyKey: `${data.leaveApplicationId}-${recipient.type}-${recipient.email}-${data.newStatus}`,
      });
      results.push({ type: recipient.type, success: r.success });
    } catch (err) {
      console.error(`[Email] Status update to ${recipient.email} failed:`, err);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Public: Retry a single failed notification
// ---------------------------------------------------------------------------

export async function retryNotification(notificationLogId: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const log = await prisma.notificationLog.findUnique({
    where: { id: notificationLogId },
    include: { leaveApplication: true },
  });

  if (!log) return { success: false, error: "Notification log not found" };
  if (log.status === "SENT") return { success: true };

  try {
    const resend = getResend();
    const from = getFromAddress();

    // Re-generate the email HTML by type
    // For retries, we send a simple re-notification; in production you'd re-render the template
    const result = await resend.emails.send({
      from,
      to: [log.recipientEmail],
      subject: `[Retry] ${log.subject}`,
      html: `<p>This is a retry of a previously failed notification regarding application ${log.leaveApplication.referenceNumber}.</p>`,
    });

    const messageId = (result.data as { id?: string } | null)?.id;

    await prisma.notificationLog.update({
      where: { id: notificationLogId },
      data: {
        status: "SENT",
        resendMessageId: messageId,
        sentAt: new Date(),
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    return { success: true, messageId };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await prisma.notificationLog.update({
      where: { id: notificationLogId },
      data: {
        status: "FAILED",
        errorMessage: errorMessage.substring(0, 500),
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });
    return { success: false, error: errorMessage };
  }
}
