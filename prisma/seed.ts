// =============================================================================
// VRD Exports Leave Management — Idempotent Database Seed Script
// =============================================================================
// Run with: npm run db:seed  (or npx tsx prisma/seed.ts)
// Safe to execute repeatedly — uses upsert everywhere.
// Never deletes or resets existing production data.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// -----------------------------------------------------------------------------
// Sample Departments
// -----------------------------------------------------------------------------
const DEPARTMENTS = [
  {
    code: "EXEC",
    name: "Executive Management",
    description: "Corporate leadership, strategic oversight, and general administration",
  },
  {
    code: "MERCH",
    name: "Merchandising & Sourcing",
    description: "Garment merchandising, vendor coordination, and sample approvals",
  },
  {
    code: "PROD",
    name: "Production & Manufacturing",
    description: "Garment cutting, stitching, finishing, and floor management",
  },
  {
    code: "QA",
    name: "Quality Assurance & Compliance",
    description: "In-line inspection, final audit, AQL compliance, and lab testing",
  },
  {
    code: "LOG",
    name: "Logistics & Shipping",
    description: "Export documentation, freight forwarding, customs clearance, and warehouse",
  },
  {
    code: "FIN",
    name: "Accounts & Finance",
    description: "Financial accounting, export billing, payroll, and compliance audits",
  },
  {
    code: "HR",
    name: "Human Resources",
    description: "Talent acquisition, workforce welfare, personnel records, and leave management",
  },
  {
    code: "IT",
    name: "IT & Systems",
    description: "Enterprise software, server infrastructure, networks, and technical support",
  },
];

// -----------------------------------------------------------------------------
// Sample Leave Types (Configurable defaults)
// -----------------------------------------------------------------------------
const LEAVE_TYPES = [
  {
    name: "Casual Leave (CL)",
    description: "For personal matters, unplanned events, or family occasions",
    annualAllowance: 12,
    isPaid: true,
    allowHalfDay: true,
    trackBalance: true,
  },
  {
    name: "Sick / Medical Leave (SL)",
    description: "For illness, injury, medical consultations, or recuperation",
    annualAllowance: 10,
    isPaid: true,
    allowHalfDay: true,
    trackBalance: true,
  },
  {
    name: "Earned / Privilege Leave (EL)",
    description: "Accumulated annual leave for planned vacations and longer personal leave",
    annualAllowance: 15,
    isPaid: true,
    allowHalfDay: false,
    trackBalance: true,
  },
  {
    name: "Compensatory Off (Comp-Off)",
    description: "Time off earned for overtime on weekends, public holidays, or critical production runs",
    annualAllowance: null,
    isPaid: true,
    allowHalfDay: true,
    trackBalance: false,
  },
  {
    name: "Maternity Leave",
    description: "Statutory leave for female employees for pregnancy and childbirth",
    annualAllowance: 182, // 26 weeks
    isPaid: true,
    allowHalfDay: false,
    trackBalance: false,
  },
  {
    name: "Paternity Leave",
    description: "Leave for new fathers upon the birth of a child",
    annualAllowance: 5,
    isPaid: true,
    allowHalfDay: false,
    trackBalance: false,
  },
  {
    name: "Leave Without Pay (LWP)",
    description: "Unpaid absence taken when other leave entitlements are exhausted",
    annualAllowance: null,
    isPaid: false,
    allowHalfDay: true,
    trackBalance: false,
  },
];

// -----------------------------------------------------------------------------
// Default Company Settings
// -----------------------------------------------------------------------------
const DEFAULT_SETTINGS = [
  {
    key: "company_name",
    value: JSON.stringify("VRD Exports"),
    description: "Official company display name",
  },
  {
    key: "count_weekends",
    value: JSON.stringify(false),
    description: "Whether Saturdays and Sundays count towards leave day deductions",
  },
  {
    key: "allow_half_day",
    value: JSON.stringify(true),
    description: "Global toggle permitting half-day leave applications",
  },
  {
    key: "hr_notification_email",
    value: JSON.stringify(process.env.HR_NOTIFICATION_EMAIL || "hr@vrdexports.com"),
    description: "Email address to receive HR leave notifications",
  },
  {
    key: "admin_notification_email",
    value: JSON.stringify(process.env.LEAVE_NOTIFICATION_EMAIL || "admin@vrdexports.com"),
    description: "Email address to receive administrative leave alerts",
  },
  {
    key: "annual_leave_cycle_start_month",
    value: JSON.stringify(1), // January (1 = Jan, 4 = April for Indian Fiscal Year)
    description: "Month when annual leave allowances reset (1 = Jan, 4 = Apr)",
  },
  {
    key: "require_manager_approval_first",
    value: JSON.stringify(true),
    description: "Whether reporting manager review is recommended before HR final sign-off",
  },
];

// -----------------------------------------------------------------------------
// Sample Initial Admin User (With Hashed Password for Basic Auth)
// -----------------------------------------------------------------------------
import { randomBytes, scryptSync } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || "VrdAdmin2026!";

const INITIAL_ADMIN = {
  fullName: process.env.INITIAL_ADMIN_NAME || "VRD Exports Administrator",
  email: (process.env.INITIAL_ADMIN_EMAIL || "admin@example.com").toLowerCase().trim(),
  username: "vrd_admin",
  role: "SUPER_ADMIN" as const,
  isActive: true,
};

async function main() {
  console.log("🌱 Starting idempotent database seed for VRD Exports Leave Management...");

  // 1. Seed Departments
  console.log("\n📁 Seeding departments...");
  for (const dept of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
        description: dept.description,
        isActive: true,
      },
      create: {
        code: dept.code,
        name: dept.name,
        description: dept.description,
        isActive: true,
      },
    });
    console.log(`  ✓ Department: [${record.code}] ${record.name}`);
  }

  // 2. Seed Leave Types
  console.log("\n📅 Seeding leave types...");
  for (const lt of LEAVE_TYPES) {
    const record = await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: {
        description: lt.description,
        annualAllowance: lt.annualAllowance,
        isPaid: lt.isPaid,
        allowHalfDay: lt.allowHalfDay,
        trackBalance: lt.trackBalance,
        isActive: true,
      },
      create: {
        name: lt.name,
        description: lt.description,
        annualAllowance: lt.annualAllowance,
        isPaid: lt.isPaid,
        allowHalfDay: lt.allowHalfDay,
        trackBalance: lt.trackBalance,
        isActive: true,
      },
    });
    console.log(`  ✓ Leave Type: ${record.name} (${record.isPaid ? "Paid" : "Unpaid"}, ${record.annualAllowance ?? "Unlimited"} days/yr)`);
  }

  // 3. Seed Company Settings
  console.log("\n⚙️  Seeding company settings...");
  for (const setting of DEFAULT_SETTINGS) {
    const record = await prisma.companySetting.upsert({
      where: { key: setting.key },
      update: {
        description: setting.description,
      },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
    console.log(`  ✓ Setting: ${record.key}`);
  }

  // 4. Seed Initial Admin User
  console.log("\n👤 Seeding initial admin dashboard user...");
  const adminPasswordHash = hashPassword(INITIAL_ADMIN_PASSWORD);
  const admin = await prisma.adminUser.upsert({
    where: { email: INITIAL_ADMIN.email },
    update: {
      fullName: INITIAL_ADMIN.fullName,
      role: INITIAL_ADMIN.role,
      passwordHash: adminPasswordHash,
      isActive: true,
    },
    create: {
      fullName: INITIAL_ADMIN.fullName,
      email: INITIAL_ADMIN.email,
      username: INITIAL_ADMIN.username,
      role: INITIAL_ADMIN.role,
      passwordHash: adminPasswordHash,
      isActive: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.fullName} (${admin.email}) [Role: ${admin.role}]`);
  console.log(`  🔑 Default Password: ${INITIAL_ADMIN_PASSWORD}`);
  console.log(`  ℹ️ Sign in at /login with: ${admin.email} / ${INITIAL_ADMIN_PASSWORD}`);

  console.log("\n✅ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
