// =============================================================================
// API: GET /api/auth/me — Current session user info
// =============================================================================

import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ user: null, authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
}
