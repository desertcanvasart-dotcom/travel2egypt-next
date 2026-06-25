import { NextResponse, type NextRequest } from 'next/server';

/**
 * GET /api/admin/auth/callback — graceful degrade for stale magic links.
 *
 * The S10 admin sign-in was switched from PKCE magic-link to email OTP after
 * the PKCE verifier cookie proved fragile across the Gmail → Supabase →
 * localhost redirect chain. The current sign-in flow does not issue magic
 * links; this route only exists to redirect a user who clicked a pre-switch
 * (or template-still-shows-the-link) email link back to /admin/login with a
 * hint to use the 6-digit code from the email instead.
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL('/admin/login', req.url);
  url.searchParams.set('error', 'use_otp');
  return NextResponse.redirect(url, { status: 307 });
}
