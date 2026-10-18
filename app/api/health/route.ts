// =============================================================================
// API: GET /api/health — Database and configuration health check
// Returns status without revealing credentials.
// =============================================================================

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function GET() {
  const checks: Record<string, { status: "ok" | "error" | "not_configured"; detail?: string }> = {};

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch (err) {
    checks.database = {
      status: "error",
      detail: "Database connection failed. Check DATABASE_URL and DIRECT_URL.",
    };
  }

  // Resend configuration check (does not make a live API call)
  checks.resend = {
    status: process.env.RESEND_API_KEY ? "ok" : "not_configured",
    detail: process.env.RESEND_API_KEY
      ? `From: ${process.env.RESEND_FROM_EMAIL || "not set"}`
      : "RESEND_API_KEY not configured. Emails will not be sent.",
  };

  // Notification recipients
  checks.hrEmail = {
    status: process.env.HR_NOTIFICATION_EMAIL ? "ok" : "not_configured",
  };
  checks.leaveNotificationEmail = {
    status: process.env.LEAVE_NOTIFICATION_EMAIL ? "ok" : "not_configured",
  };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return Response.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      // NEVER include credential values in response
    },
    { status: allOk ? 200 : 503 }
  );
}
