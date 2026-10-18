// =============================================================================
// API: GET /api/leave-types — List leave types
// API: POST /api/leave-types — Create leave type (Admin)
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeaveTypeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const leaveTypes = await prisma.leaveType.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      isPaid: true,
      allowHalfDay: true,
      trackBalance: true,
      annualAllowance: true,
      createdAt: true,
    },
  });

  return Response.json({ data: leaveTypes });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LeaveTypeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Check for duplicate name
  const existing = await prisma.leaveType.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return Response.json(
      { error: `Leave type "${parsed.data.name}" already exists.` },
      { status: 409 }
    );
  }

  const leaveType = await prisma.leaveType.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      isActive: parsed.data.isActive,
      isPaid: parsed.data.isPaid,
      allowHalfDay: parsed.data.allowHalfDay,
      trackBalance: parsed.data.trackBalance,
      annualAllowance: parsed.data.annualAllowance ?? null,
      eligibilityRules: parsed.data.eligibilityRules || null,
    },
  });

  return Response.json({ message: "Leave type created", data: leaveType }, { status: 201 });
}
