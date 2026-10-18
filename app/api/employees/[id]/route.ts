// =============================================================================
// API: GET/PATCH/DELETE /api/employees/[id]
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmployeeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";


export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { department: { select: { id: true, name: true } } },
  });
  if (!employee) return Response.json({ error: "Employee not found" }, { status: 404 });
  return Response.json({ data: employee });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = EmployeeSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Employee not found" }, { status: 404 });

  if (parsed.data.employeeId && parsed.data.employeeId !== existing.employeeId) {
    const conflict = await prisma.employee.findUnique({ where: { employeeId: parsed.data.employeeId } });
    if (conflict) return Response.json({ error: `Employee ID "${parsed.data.employeeId}" is already in use.` }, { status: 409 });
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      ...(parsed.data.employeeId !== undefined && { employeeId: parsed.data.employeeId }),
      ...(parsed.data.fullName !== undefined && { fullName: parsed.data.fullName }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email }),
      ...(parsed.data.departmentId !== undefined && { departmentId: parsed.data.departmentId || null }),
      ...(parsed.data.managerName !== undefined && { managerName: parsed.data.managerName || null }),
      ...(parsed.data.managerEmail !== undefined && { managerEmail: parsed.data.managerEmail || null }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
    include: { department: { select: { id: true, name: true } } },
  });

  return Response.json({ message: "Employee updated", data: updated });
}

export async function DELETE(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Employee not found" }, { status: 404 });

  // Soft delete — preserve historical leave application data
  const updated = await prisma.employee.update({ where: { id }, data: { isActive: false } });
  return Response.json({ message: "Employee deactivated", data: updated });
}
