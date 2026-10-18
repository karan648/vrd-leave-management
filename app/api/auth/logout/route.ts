// =============================================================================
// API: POST /api/auth/logout — Destroy admin session
// =============================================================================

import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroySession();
  return Response.json({ message: "Logged out successfully" });
}
