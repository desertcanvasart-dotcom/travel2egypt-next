import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin/guard';

/**
 * GET /api/admin/whoami — heartbeat for the admin panel.
 *
 * Returns the current admin session ({ email, userId }) or 401. Useful both
 * as a smoke test for the auth wiring and as a client-side check that the
 * session has not silently expired during a long review session.
 */
export const runtime = 'nodejs';

export async function GET() {
  const gate = await requireAdminSession();
  if (gate instanceof NextResponse) return gate;
  return NextResponse.json({ email: gate.email, userId: gate.userId });
}
