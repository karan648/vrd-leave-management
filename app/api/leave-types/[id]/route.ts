// =============================================================================
// API: GET/PATCH/DELETE /api/leave-types/[id]
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeaveTypeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";


export async function GET(
  _r: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lt = await prisma.leaveType.findUnique({ where: { id } });
  if (!lt) return Response.json({ error: "Leave type not found" }, { status: 404 });
  return Response.json({ data: lt });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LeaveTypeSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const existing = await prisma.leaveType.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Leave type not found" }, { status: 404 });

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const conflict = await prisma.leaveType.findUnique({ where: { name: parsed.data.name } });
    if (conflict) return Response.json({ error: `Leave type "${parsed.data.name}" already exists.` }, { status: 409 });
  }

  const updated = await prisma.leaveType.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      ...(parsed.data.isPaid !== undefined && { isPaid: parsed.data.isPaid }),
      ...(parsed.data.allowHalfDay !== undefined && { allowHalfDay: parsed.data.allowHalfDay }),
      ...(parsed.data.trackBalance !== undefined && { trackBalance: parsed.data.trackBalance }),
      ...(parsed.data.annualAllowance !== undefined && { annualAllowance: parsed.data.annualAllowance }),
    },
  });

  return Response.json({ message: "Leave type updated", data: updated });
}

export async function DELETE(
  _r: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.leaveType.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Leave type not found" }, { status: 404 });

  const updated = await prisma.leaveType.update({
    where: { id },
    data: { isActive: false },
  });
  return Response.json({ message: "Leave type deactivated", data: updated });
}
