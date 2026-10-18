// =============================================================================
// API: GET /api/settings — Read company settings
// API: PATCH /api/settings — Update company settings (Admin)
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";


// Default settings keys
export const SETTING_KEYS = {
  EXCLUDE_WEEKENDS: "exclude_weekends",
  HR_NOTIFICATION_EMAIL: "hr_notification_email",
  LEAVE_NOTIFICATION_EMAIL: "leave_notification_email",
  COMPANY_NAME: "company_name",
  ALLOW_HALF_DAY: "allow_half_day",
  NOTIFY_MANAGER_ON_SUBMIT: "notify_manager_on_submit",
  NOTIFY_HR_ON_SUBMIT: "notify_hr_on_submit",
  NOTIFY_MANAGER_ON_DECISION: "notify_manager_on_decision",
  NOTIFY_HR_ON_DECISION: "notify_hr_on_decision",
} as const;

export async function GET() {
  const settings = await prisma.companySetting.findMany({
    orderBy: { key: "asc" },
  });

  // Parse values from JSON storage
  const parsed = settings.reduce<Record<string, unknown>>((acc, s) => {
    try {
      acc[s.key] = JSON.parse(s.value);
    } catch {
      acc[s.key] = s.value;
    }
    return acc;
  }, {});

  return Response.json({ data: parsed, raw: settings });
}

const BulkUpdateSchema = z.record(z.string(), z.unknown());

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BulkUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid settings format" }, { status: 422 });
  }

  const updates = Object.entries(parsed.data).map(([key, value]) =>
    prisma.companySetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: {
        key,
        value: JSON.stringify(value),
        description: `Setting: ${key}`,
      },
    })
  );

  await prisma.$transaction(updates);

  return Response.json({ message: "Settings updated" });
}
