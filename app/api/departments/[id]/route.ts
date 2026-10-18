// =============================================================================
// API: GET /api/departments/[id] — Get department
// API: PATCH /api/departments/[id] — Update department
// API: DELETE /api/departments/[id] — Deactivate department (soft delete)
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { DepartmentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { leaveApplications: true, employees: true } } },
  });
  if (!dept) return Response.json({ error: "Department not found" }, { status: 404 });
  return Response.json({ data: dept });
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

  const parsed = DepartmentSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Department not found" }, { status: 404 });

  if (parsed.data.code && parsed.data.code !== existing.code) {
    const conflict = await prisma.department.findUnique({ where: { code: parsed.data.code } });
    if (conflict) {
      return Response.json({ error: `Department code "${parsed.data.code}" is already in use.` }, { status: 409 });
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.code !== undefined && { code: parsed.data.code || null }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
  });

  return Response.json({ message: "Department updated", data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Soft delete — never destroy historical data
  const { id } = await params;
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Department not found" }, { status: 404 });

  const updated = await prisma.department.update({
    where: { id },
    data: { isActive: false },
  });
  return Response.json({ message: "Department deactivated", data: updated });
}
