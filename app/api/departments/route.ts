// =============================================================================
// API: GET /api/departments — List active departments
// API: POST /api/departments — Create department (Admin)
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { DepartmentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const departments = await prisma.department.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      isActive: true,
      createdAt: true,
      _count: { select: { leaveApplications: true } },
    },
  });

  return Response.json({ data: departments });
}

export async function POST(request: NextRequest) {
  // ⚠️ SECURITY NOTE: Requires authentication before production use.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = DepartmentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, code, description, isActive } = parsed.data;

  // Check for duplicate code
  if (code) {
    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      return Response.json(
        { error: `Department code "${code}" is already in use.` },
        { status: 409 }
      );
    }
  }

  const department = await prisma.department.create({
    data: {
      name,
      code: code || null,
      description: description || null,
      isActive,
    },
  });

  return Response.json({ message: "Department created", data: department }, { status: 201 });
}
