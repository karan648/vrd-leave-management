// =============================================================================
// API: POST /api/leave-applications
// Creates a new leave application with idempotency protection.
//
// ⚠️ SECURITY NOTE: This is a public endpoint. Authentication is not
// implemented in this version. Do not expose sensitive HR data here.
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeaveApplicationSchema } from "@/lib/validations";
import { generateReferenceNumber, calculateLeaveDays, checkRateLimit } from "@/lib/utils";
import { sendSubmissionNotifications } from "@/lib/email";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  // Rate limiting: max 5 submissions per IP per 10 minutes
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`submit-${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LeaveApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Check for duplicate idempotency key
  if (data.idempotencyKey) {
    const existing = await prisma.leaveApplication.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
      select: { id: true, referenceNumber: true, status: true },
    });
    if (existing) {
      return Response.json(
        {
          message: "Application already submitted",
          referenceNumber: existing.referenceNumber,
          id: existing.id,
          status: existing.status,
          duplicate: true,
        },
        { status: 200 }
      );
    }
  }

  // Resolve department and leave type
  const [department, leaveType] = await Promise.all([
    prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.leaveType.findUnique({
      where: { id: data.leaveTypeId },
      select: { id: true, name: true, isActive: true, allowHalfDay: true },
    }),
  ]);

  if (!department || !department.isActive) {
    return Response.json(
      { error: "Selected department is not valid or has been deactivated." },
      { status: 422 }
    );
  }

  if (!leaveType || !leaveType.isActive) {
    return Response.json(
      { error: "Selected leave type is not valid or has been deactivated." },
      { status: 422 }
    );
  }

  if (data.isHalfDay && !leaveType.allowHalfDay) {
    return Response.json(
      { error: `${leaveType.name} does not support half-day leave.` },
      { status: 422 }
    );
  }

  // Get company settings for leave calculation
  let excludeWeekends = false;
  try {
    const setting = await prisma.companySetting.findUnique({
      where: { key: "exclude_weekends" },
    });
    if (setting) {
      excludeWeekends = JSON.parse(setting.value) === true;
    }
  } catch {
    // Use default
  }

  // Get holidays for the period
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const holidays = await prisma.holiday.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true },
  });

  const totalDays = calculateLeaveDays(startDate, endDate, {
    excludeWeekends,
    holidayDates: holidays.map((h) => h.date),
    isHalfDay: data.isHalfDay,
  });

  if (totalDays <= 0) {
    return Response.json(
      { error: "The selected date range results in zero leave days (all days may be weekends or holidays)." },
      { status: 422 }
    );
  }

  // Generate unique reference number (retry up to 3 times for collisions)
  let referenceNumber = generateReferenceNumber();
  let attempts = 0;
  while (attempts < 3) {
    const exists = await prisma.leaveApplication.findUnique({
      where: { referenceNumber },
      select: { id: true },
    });
    if (!exists) break;
    referenceNumber = generateReferenceNumber();
    attempts++;
  }

  // Create application in a transaction
  let application;
  try {
    application = await prisma.$transaction(async (tx) => {
      const app = await tx.leaveApplication.create({
        data: {
          referenceNumber,
          employeeName: data.employeeName,
          employeeEmail: data.employeeEmail,
          employeeIdNumber: data.employeeIdNumber || null,
          departmentId: department.id,
          leaveTypeId: leaveType.id,
          departmentSnapshot: department.name,
          leaveTypeSnapshot: leaveType.name,
          startDate,
          endDate,
          totalDays,
          isHalfDay: data.isHalfDay,
          halfDayPeriod: data.halfDayPeriod || null,
          reason: data.reason,
          reportingManagerName: data.reportingManagerName,
          reportingManagerEmail: data.reportingManagerEmail,
          handoverPersonName: data.handoverPersonName || null,
          handoverPersonEmail: data.handoverPersonEmail || null,
          contactDuringLeave: data.contactDuringLeave || null,
          additionalNotes: data.additionalNotes || null,
          status: "PENDING",
          idempotencyKey: data.idempotencyKey || null,
        },
      });

      // Create initial approval history entry
      await tx.approvalHistory.create({
        data: {
          leaveApplicationId: app.id,
          fromStatus: null,
          toStatus: "PENDING",
          remarks: "Application submitted",
          performedBy: "SYSTEM",
          performedByName: "Employee Portal",
        },
      });

      return app;
    });
  } catch (err: unknown) {
    console.error("[Leave Application] Database error:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) {
      return Response.json(
        { error: "A duplicate submission was detected. Your application may have already been submitted." },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Failed to save your application. Please try again." },
      { status: 500 }
    );
  }

  // Send notifications after successful DB commit (failures don't affect saved data)
  sendSubmissionNotifications({
    leaveApplicationId: application.id,
    referenceNumber: application.referenceNumber,
    employeeName: application.employeeName,
    employeeEmail: application.employeeEmail,
    leaveType: leaveType.name,
    startDate: application.startDate,
    endDate: application.endDate,
    totalDays: application.totalDays,
    reason: application.reason,
    reportingManagerName: application.reportingManagerName,
    reportingManagerEmail: application.reportingManagerEmail,
    handoverPersonName: application.handoverPersonName,
    handoverPersonEmail: application.handoverPersonEmail,
  }).catch((err) => {
    console.error("[Email] Post-submission notifications failed:", err);
  });

  return Response.json(
    {
      message: "Application submitted successfully",
      referenceNumber: application.referenceNumber,
      id: application.id,
      status: application.status,
      totalDays: application.totalDays,
      submittedAt: application.submittedAt,
    },
    { status: 201 }
  );
}
