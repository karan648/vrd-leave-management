// =============================================================================
// API: GET/PATCH/DELETE /api/admin-users/[id]
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdminUserSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true, fullName: true, email: true, username: true,
      role: true, departmentId: true, isActive: true, createdAt: true, updatedAt: true,
    },
  });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  return Response.json({ data: user });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AdminUserSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "User not found" }, { status: 404 });

  const updated = await prisma.adminUser.update({
    where: { id },
    data: {
      ...(parsed.data.fullName !== undefined && { fullName: parsed.data.fullName }),
      ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      ...(parsed.data.departmentId !== undefined && { departmentId: parsed.data.departmentId || null }),
      ...(parsed.data.password && parsed.data.password.trim() !== "" && {
        passwordHash: hashPassword(parsed.data.password.trim()),
      }),
    },
    select: {
      id: true, fullName: true, email: true, username: true,
      role: true, departmentId: true, isActive: true, createdAt: true, updatedAt: true,
    },
  });

  return Response.json({ message: "User updated", data: updated });
}

export async function DELETE(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "User not found" }, { status: 404 });

  // Deactivate rather than delete
  const updated = await prisma.adminUser.update({ where: { id }, data: { isActive: false } });
  return Response.json({ message: "User deactivated", data: { id: updated.id, isActive: updated.isActive } });
}
