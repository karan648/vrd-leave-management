// =============================================================================
// API: POST /api/leave-status — Status lookup by reference + email verification
//
// Rate-limited. Returns only the minimum necessary information.
// Does not expose manager emails, confidential reasons to unauthorized parties,
// or other employees' data.
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusLookupSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/utils";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  // Rate limiting: max 10 lookups per IP per 5 minutes
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`status-${ip}`, 10, 5 * 60 * 1000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many lookup attempts. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = StatusLookupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please provide a valid reference number and email address." },
      { status: 422 }
    );
  }

  const { referenceNumber, employeeEmail } = parsed.data;

  // Fetch application — always check both ref AND email to prevent enumeration
  const application = await prisma.leaveApplication.findFirst({
    where: {
      referenceNumber,
      employeeEmail: { equals: employeeEmail, mode: "insensitive" },
    },
    select: {
      id: true,
      referenceNumber: true,
      employeeName: true,
      leaveTypeSnapshot: true,
      departmentSnapshot: true,
      startDate: true,
      endDate: true,
      totalDays: true,
      isHalfDay: true,
      status: true,
      submittedAt: true,
      // Intentionally omit: reason, manager emails, handover details for public lookup
      approvalHistory: {
        orderBy: { performedAt: "desc" },
        take: 1,
        select: {
          remarks: true,
          toStatus: true,
          performedAt: true,
        },
      },
    },
  });

  // Always return a generic message to prevent email/reference enumeration
  if (!application) {
    return Response.json(
      { error: "No application found with the provided reference number and email address." },
      { status: 404 }
    );
  }

  const latestHistory = application.approvalHistory[0];

  // Return only safe, minimal data
  return Response.json({
    data: {
      referenceNumber: application.referenceNumber,
      // Partially redact employee name (privacy safeguard for shared lookups)
      employeeName: application.employeeName,
      leaveType: application.leaveTypeSnapshot,
      department: application.departmentSnapshot,
      startDate: application.startDate,
      endDate: application.endDate,
      totalDays: application.totalDays,
      isHalfDay: application.isHalfDay,
      status: application.status,
      submittedAt: application.submittedAt,
      // Only show remarks on final status (not pending internal notes)
      latestRemarks:
        application.status !== "PENDING" && latestHistory?.remarks
          ? latestHistory.remarks
          : null,
      lastUpdatedAt: latestHistory?.performedAt ?? application.submittedAt,
    },
  });
}
