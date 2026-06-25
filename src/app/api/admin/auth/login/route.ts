import { NextResponse, type NextRequest } from 'next/server';

import { adminAuthClient } from '@/lib/admin/auth';
import { isAdminEmail } from '@/lib/admin/whitelist';

/**
 * POST /api/admin/auth/login — start a magic-link sign-in (Session 10).
 *
 * Accepts form-urlencoded or JSON `{ email }`. We:
 *   1. Skip the Supabase Auth call entirely for emails not in ADMIN_EMAILS,
 *      so non-admins do not consume email quota.
 *   2. Return the SAME redirect ("?sent=1") regardless of whether the email
 *      is whitelisted, so the response never leaks who can sign in.
 *
 * The Supabase email link sends the visitor to
 * `${origin}/api/admin/auth/callback?code=…`. That URL must be added to the
 * Supabase Auth "Redirect URLs" allowlist in the Dashboard for each host.
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

export async function POST(req: NextRequest) {
  const email = await readEmail(req);

  const sentRedirect = NextResponse.redirect(new URL('/admin/login?sent=1', req.url), {
    status: 303,
  });

  if (!email) {
    return NextResponse.redirect(new URL('/admin/login?error=invalid', req.url), {
      status: 303,
    });
  }

  // Allowlist check happens BEFORE the Supabase call. Non-admins still get
  // the same "sent" response (no enumeration leak), but we never spend the
  // SMTP quota or create an auth.users row for them.
  if (!isAdminEmail(email)) return sentRedirect;

  try {
    const supabase = await adminAuthClient();
    const origin = new URL(req.url).origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/api/admin/auth/callback`,
      },
    });
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

  return sentRedirect;
}
