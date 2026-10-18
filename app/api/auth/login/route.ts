// =============================================================================
// API: POST /api/auth/login — Admin login
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, hashPassword } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  email: z.string().email("Invalid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid email or password format" },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  // Find user
  let user = await prisma.adminUser.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });

  // If no admin users exist yet in DB (fresh deploy), auto-bootstrap default super admin
  if (!user) {
    try {
      const userCount = await prisma.adminUser.count();
      if (userCount === 0) {
        const defaultEmail = (process.env.INITIAL_ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
        const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || "VrdAdmin2026!";
        if (email === defaultEmail) {
          user = await prisma.adminUser.create({
            data: {
              fullName: process.env.INITIAL_ADMIN_NAME || "VRD Exports Administrator",
              email: defaultEmail,
              username: "vrd_admin",
              role: "SUPER_ADMIN",
              isActive: true,
              passwordHash: hashPassword(defaultPassword),
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              isActive: true,
              passwordHash: true,
            },
          });
        }
      }
    } catch (e) {
      console.warn("Auto-bootstrap check skipped:", e);
    }
  }

  // Generic error to avoid user enumeration
  const genericError = "Invalid email or password";

  if (!user || !user.passwordHash) {
    return Response.json({ error: genericError }, { status: 401 });
  }

  if (!user.isActive) {
    return Response.json({ error: "Account is deactivated. Contact your administrator." }, { status: 403 });
  }

  const passwordValid = verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return Response.json({ error: genericError }, { status: 401 });
  }

  // Create session cookie
  await createSession(user.id);

  return Response.json({
    message: "Login successful",
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
}
