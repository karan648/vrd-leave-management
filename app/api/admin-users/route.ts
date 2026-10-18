// =============================================================================
// API: Admin Users CRUD
//
// ⚠️ IMPORTANT: This manages user RECORDS for the dashboard interface only.
// These are NOT secure login accounts. Authentication is not implemented.
// Creating a user record does NOT grant any system access in this version.
// Integrate with an authentication provider (e.g., Clerk, Auth0) before deployment.
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdminUserSchema } from "@/lib/validations";
import { hashPassword, generateRandomPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || "20")));

  const [users, total] = await Promise.all([
    prisma.adminUser.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.adminUser.count(),
  ]);

  return Response.json({ data: users, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AdminUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const existingEmail = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (existingEmail) return Response.json({ error: `Email "${parsed.data.email}" is already registered.` }, { status: 409 });

  if (parsed.data.username) {
    const existingUsername = await prisma.adminUser.findUnique({ where: { username: parsed.data.username } });
    if (existingUsername) return Response.json({ error: `Username "${parsed.data.username}" is already taken.` }, { status: 409 });
  }

  const passwordToUse = parsed.data.password && parsed.data.password.trim() !== ""
    ? parsed.data.password.trim()
    : generateRandomPassword(12);

  const passwordHash = hashPassword(passwordToUse);

  const user = await prisma.adminUser.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      username: parsed.data.username || null,
      role: parsed.data.role,
      departmentId: parsed.data.departmentId || null,
      isActive: parsed.data.isActive,
      passwordHash,
    },
    select: {
      id: true, fullName: true, email: true, username: true,
      role: true, departmentId: true, isActive: true, createdAt: true,
    },
  });

  return Response.json({
    message: "Admin user created successfully",
    data: user,
    generatedPassword: passwordToUse,
  }, { status: 201 });
}
