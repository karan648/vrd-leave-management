// =============================================================================
// API: GET /api/leave-applications/[id] — Full application details (Admin)
// API: PATCH /api/leave-applications/[id] — Update status (Admin)
//
// Admin-only route; the active session supplies the audit identity.
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ApprovalActionSchema } from "@/lib/validations";
import { sendStatusUpdateNotifications } from "@/lib/email";

export const dynamic = "force-dynamic";


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.leaveApplication.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      leaveType: { select: { id: true, name: true } },
      approvalHistory: {
        orderBy: { performedAt: "desc" },
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!application) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  return Response.json({ data: application, ...application });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawBody = typeof body === "object" && body !== null ? body : {};
  const parsed = ApprovalActionSchema.safeParse({ ...rawBody, applicationId: id });
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { action, remarks } = parsed.data;
  const performedBy = auth.user.username?.trim() || auth.user.email;
  const performedByName = auth.user.fullName?.trim() || performedBy;

  // Load application with optimistic lock check
  const application = await prisma.leaveApplication.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      referenceNumber: true,
      employeeName: true,
      employeeEmail: true,
      leaveTypeSnapshot: true,
      startDate: true,
      endDate: true,
      totalDays: true,
      reason: true,
      reportingManagerEmail: true,
      handoverPersonEmail: true,
      handoverPersonName: true,
    },
  });

  if (!application) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    PENDING: ["APPROVED", "DECLINED", "CANCELLED"],
    APPROVED: ["CANCELLED"],
    DECLINED: [],
    CANCELLED: [],
  };

  const allowed = validTransitions[application.status] ?? [];
  if (!allowed.includes(action)) {
    return Response.json(
      {
        error: `Cannot change status from ${application.status} to ${action}. Valid transitions: ${allowed.join(", ") || "none"}`,
      },
      { status: 409 }
    );
  }

  // Perform update in transaction
  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const app = await tx.leaveApplication.update({
        where: {
          id,
          status: application.status, // Optimistic lock: only update if status hasn't changed
        },
        data: {
          status: action as "APPROVED" | "DECLINED" | "CANCELLED",
        },
      });

      if (action === "APPROVED") {
        await tx.$executeRaw`
          UPDATE "leave_applications"
          SET "approvedById" = ${auth.user.id},
              "approvedByUsername" = ${auth.user.username || auth.user.fullName || auth.user.email}
          WHERE "id" = ${id}
        `;
      }

      await tx.approvalHistory.create({
        data: {
          leaveApplicationId: id,
          fromStatus: application.status as "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED",
          toStatus: action as "APPROVED" | "DECLINED" | "CANCELLED",
          remarks: remarks || null,
          performedBy,
          performedByName,
        },
      });

      return app;
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Record to update not found")) {
      return Response.json(
        { error: "Concurrent update detected. The application may have been modified by another user. Please refresh and try again." },
        { status: 409 }
      );
    }
    console.error("[Approval] Transaction error:", err);
    return Response.json(
      { error: "Failed to update application status. Please try again." },
      { status: 500 }
    );
  }

  // Send notifications (failures don't affect the completed approval)
  if (action === "APPROVED" || action === "DECLINED") {
    try {
      await sendStatusUpdateNotifications({
        leaveApplicationId: id,
        referenceNumber: application.referenceNumber,
        employeeName: application.employeeName,
        employeeEmail: application.employeeEmail,
        leaveType: application.leaveTypeSnapshot,
        startDate: application.startDate,
        endDate: application.endDate,
        totalDays: application.totalDays,
        reason: application.reason,
        newStatus: action as "APPROVED" | "DECLINED",
        remarks,
        performedByName,
        reportingManagerEmail: application.reportingManagerEmail,
        handoverPersonEmail: application.handoverPersonEmail,
        handoverPersonName: application.handoverPersonName,
      });
    } catch (err) {
      console.error("[Email] Status update notifications failed:", err);
    }
  }

  return Response.json({
    message: `Application ${action.toLowerCase()} successfully`,
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt,
  });
}
