import { NextResponse, type NextRequest } from 'next/server';

import { adminAuthClient } from '@/lib/admin/auth';
import { isAdminEmail } from '@/lib/admin/whitelist';

/**
 * GET /api/admin/auth/callback — complete the magic-link sign-in.
 *
 * Supabase Auth redirects the visitor here with `?code=…` (PKCE flow). We:
 *   1. Exchange the code for a session — the SSR client sets the auth cookie
 *      via the cookie adapter in `lib/admin/auth.ts`.
 *   2. RE-CHECK the resulting user's email against ADMIN_EMAILS — covers the
 *      edge case where an admin email was removed from the allowlist between
 *      the link being sent and being clicked.
 *   3. If the re-check fails, sign out (clear the cookie) and redirect to
 *      the login page with an unauthorized notice.
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/admin/login?error=missing_code', req.url));
  }

  const supabase = await adminAuthClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error('[admin auth] exchangeCodeForSession failed:', exchangeError.message);
    return NextResponse.redirect(new URL('/admin/login?error=expired', req.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/admin/login?error=unauthorized', req.url));
  }

  return NextResponse.redirect(new URL('/admin', req.url));
}
