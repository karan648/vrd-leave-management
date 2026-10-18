// =============================================================================
// API: Employees CRUD
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmployeeSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));

  const where: Record<string, unknown> = includeInactive ? {} : { isActive: true };
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { employeeId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fullName: "asc" },
      include: { department: { select: { id: true, name: true } } },
    }),
    prisma.employee.count({ where }),
  ]);

  return Response.json({ data: employees, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = EmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  // Check unique employee ID
  const existingId = await prisma.employee.findUnique({ where: { employeeId: parsed.data.employeeId } });
  if (existingId) return Response.json({ error: `Employee ID "${parsed.data.employeeId}" is already in use.` }, { status: 409 });

  // Check unique email
  const existingEmail = await prisma.employee.findUnique({ where: { email: parsed.data.email } });
  if (existingEmail) return Response.json({ error: `Email "${parsed.data.email}" is already registered.` }, { status: 409 });

  const employee = await prisma.employee.create({
    data: {
      employeeId: parsed.data.employeeId,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      departmentId: parsed.data.departmentId || null,
      managerName: parsed.data.managerName || null,
      managerEmail: parsed.data.managerEmail || null,
      isActive: parsed.data.isActive,
    },
    include: { department: { select: { id: true, name: true } } },
  });

  return Response.json({ message: "Employee created", data: employee }, { status: 201 });
}
