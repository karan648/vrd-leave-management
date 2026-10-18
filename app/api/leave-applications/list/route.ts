// =============================================================================
// API: GET /api/leave-applications (Admin - List with filters/pagination)
//
// ⚠️ SECURITY NOTE: This endpoint requires authentication before production use.
// It is currently open and protected only by being under /api/.
// Add authentication middleware before public deployment.
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationsQuerySchema } from "@/lib/validations";
import { z } from "zod";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = ApplicationsQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    page,
    pageSize,
    search,
    status,
    departmentId,
    leaveTypeId,
    startDate,
    endDate,
    sortBy,
    sortDir,
  } = parsed.data;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (leaveTypeId) {
    where.leaveTypeId = leaveTypeId;
  }

  if (startDate) {
    where.startDate = { ...(where.startDate as object || {}), gte: new Date(startDate) };
  }

  if (endDate) {
    where.endDate = { ...(where.endDate as object || {}), lte: new Date(endDate) };
  }

  if (search) {
    const s = search.trim();
    where.OR = [
      { employeeName: { contains: s, mode: "insensitive" } },
      { employeeEmail: { contains: s, mode: "insensitive" } },
      { employeeIdNumber: { contains: s, mode: "insensitive" } },
      { referenceNumber: { contains: s, mode: "insensitive" } },
    ];
  }

  // Build orderBy
  const orderBy = [{ [sortBy]: sortDir }];

  const [applications, total] = await Promise.all([
    prisma.leaveApplication.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      select: {
        id: true,
        referenceNumber: true,
        employeeName: true,
        employeeEmail: true,
        employeeIdNumber: true,
        departmentSnapshot: true,
        leaveTypeSnapshot: true,
        departmentId: true,
        leaveTypeId: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        isHalfDay: true,
        status: true,
        reportingManagerName: true,
        handoverPersonName: true,
        submittedAt: true,
        updatedAt: true,
        approvalHistory: {
          orderBy: { performedAt: "desc" },
          take: 1,
          select: {
            remarks: true,
            toStatus: true,
            performedAt: true,
            performedByName: true,
          },
        },
      },
    }),
    prisma.leaveApplication.count({ where }),
  ]);

  return Response.json({
    data: applications,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
