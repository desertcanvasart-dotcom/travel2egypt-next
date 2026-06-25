import { NextResponse } from 'next/server';

import { getAdminSession, type AdminSession } from './auth';

/**
 * Guard for `/api/admin/*` routes (Session 10).
 *
 * Wraps the two-factor admin check (Supabase Auth session AND ADMIN_EMAILS
 * allowlist; see `getAdminSession`) and returns the typed session on success
 * or a `NextResponse` 401 on failure. The 401 has a JSON body the panel can
 * surface, never any detail about WHY (whitelist vs no session vs error) —
 * the page-level redirect handles the UX nudge to /admin/login.
 *
 * Usage:
 *
 *   const gate = await requireAdminSession();
 *   if (gate instanceof NextResponse) return gate;
 *   // gate is AdminSession here
 *   ...
 *
 * Every mutating admin route additionally must check same-origin / CSRF
 * (S11), but auth identity flows through this single point.
 */
export async function requireAdminSession(): Promise<AdminSession | NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return session;
}
