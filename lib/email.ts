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
// Get configured recipients from env or DB settings
// ---------------------------------------------------------------------------

async function getHREmail(): Promise<string | null> {
  // DB setting takes precedence over env var
  try {
    const setting = await prisma.companySetting.findUnique({
      where: { key: "hr_notification_email" },
    });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (isValidEmail(parsed)) return parsed as string;
    }
  } catch {
    // fall through to env
  }
  const env = process.env.HR_NOTIFICATION_EMAIL;
  return isValidEmail(env) ? (env as string) : null;
}

async function getAdminEmail(): Promise<string | null> {
  try {
    const setting = await prisma.companySetting.findUnique({
      where: { key: "leave_notification_email" },
    });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (isValidEmail(parsed)) return parsed as string;
    }
  } catch {
    // fall through to env
  }
  const env = process.env.LEAVE_NOTIFICATION_EMAIL;
  return isValidEmail(env) ? (env as string) : null;
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

  // Collect manager, HR, admin recipients for notification
  const notifyList: Array<{
    email: string;
    name: string;
    type: NotificationType;
  }> = [];

  if (isValidEmail(data.reportingManagerEmail)) {
    notifyList.push({
      email: data.reportingManagerEmail,
      name: data.reportingManagerName,
      type: "MANAGER_NOTIFICATION",
    });
  }

  const hrEmail = await getHREmail();
  if (hrEmail) {
    notifyList.push({ email: hrEmail, name: "HR Department", type: "HR_NOTIFICATION" });
  }

  const adminEmail = await getAdminEmail();
  if (adminEmail) {
    notifyList.push({ email: adminEmail, name: "Leave Admin", type: "ADMIN_NOTIFICATION" });
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

  // 2. Notify manager and HR
  const notifyList: Array<{ email: string; name: string; type: NotificationType }> = [];
  if (isValidEmail(data.reportingManagerEmail)) {
    notifyList.push({
      email: data.reportingManagerEmail!,
      name: "Reporting Manager",
      type: "STATUS_UPDATE_MANAGER",
    });
  }
  const hrEmail = await getHREmail();
  if (hrEmail) {
    notifyList.push({ email: hrEmail, name: "HR Department", type: "STATUS_UPDATE_HR" });
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
