// =============================================================================
// API: POST /api/notifications/[id]/retry — Retry a failed notification
// =============================================================================

import { NextRequest } from "next/server";
import { retryNotification } from "@/lib/email";

export const dynamic = "force-dynamic";


export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await retryNotification(id);

  if (result.success) {
    return Response.json({ message: "Notification resent successfully", messageId: result.messageId });
  }

  return Response.json(
    { error: result.error || "Failed to retry notification" },
    { status: 500 }
  );
}
