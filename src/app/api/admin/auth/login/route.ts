import { NextResponse, type NextRequest } from 'next/server';

import { adminAuthClient } from '@/lib/admin/auth';
import { isAdminEmail } from '@/lib/admin/whitelist';

/**
 * POST /api/admin/auth/login — start an email OTP sign-in (Session 10).
 *
 * Switched from PKCE magic-link to OTP because the PKCE verifier cookie was
 * fragile across the Gmail → Supabase → localhost redirect chain (different
 * Chrome window/profile between submit and click would lose the verifier).
 * The OTP flow has no verifier roundtrip — Supabase emails a 6-digit code,
 * the user types it into the second stage of the same form, server calls
 * verifyOtp. Same browser not required.
 *
 * Accepts form-urlencoded or JSON `{ email }`. We:
 *   1. Skip the Supabase call entirely for emails not in ADMIN_EMAILS, so
 *      non-admins do not consume email quota.
 *   2. Return the SAME redirect ("?sent=1&email=…") regardless of whether
 *      the email is whitelisted, so the response never leaks who can sign in.
 *
 * Requires the Supabase Auth "Magic Link" email template to include the
 * 6-digit `{{ .Token }}` token (the default template only shows the magic
 * link; update the template in Dashboard → Auth → Email Templates).
 */
export const runtime = 'nodejs';

async function readEmail(req: NextRequest): Promise<string | null> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const body = (await req.json()) as { email?: unknown };
      if (typeof body.email === 'string') return body.email.trim();
    } catch {
      return null;
    }
    return null;
  }
  const form = await req.formData();
  const raw = form.get('email');
  return typeof raw === 'string' ? raw.trim() : null;
}

function sentRedirect(req: NextRequest, email: string): NextResponse {
  const url = new URL('/admin/login', req.url);
  url.searchParams.set('sent', '1');
  url.searchParams.set('email', email);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const email = await readEmail(req);

  if (!email) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', req.url), {
      status: 303,
    });
  }

  // Allowlist check happens BEFORE the Supabase call. Non-admins still get
  // the same "sent" response (no enumeration leak), but we never spend the
  // SMTP quota or create an auth.users row for them.
  if (!isAdminEmail(email)) return sentRedirect(req, email);

  try {
    const supabase = await adminAuthClient();
    // No `emailRedirectTo` — the user types the code from the email into the
    // second stage of /admin/login, not by clicking a link. shouldCreateUser
    // defaults to true (admin user is created on first sign-in).
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      console.error('[admin auth] signInWithOtp failed:', error.message);
      return NextResponse.redirect(new URL('/admin/login?error=send_failed', req.url), {
        status: 303,
      });
    }
  } catch (err) {
    console.error('[admin auth] login route failed:', err);
    return NextResponse.redirect(new URL('/admin/login?error=send_failed', req.url), {
      status: 303,
    });
  }

  return sentRedirect(req, email);
}
