import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { adminAuthClient } from '@/lib/admin/auth';
import { isAdminEmail } from '@/lib/admin/whitelist';

/**
 * Look up the auth.users row for `email` using the service role and report
 * whether the user is email-confirmed. Picks the right `verifyOtp` type:
 *   - unconfirmed (or missing) → 'signup' (Supabase signup confirmation OTP)
 *   - confirmed                → 'email' (existing-user sign-in OTP)
 *
 * Calling verifyOtp with the wrong type burns the OTP token, so detecting
 * up-front is more reliable than try/fallback.
 */
async function pickOtpType(email: string): Promise<'email' | 'signup'> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return 'email';
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // listUsers paginates; for the small ADMIN_EMAILS set this is a single page.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) {
    console.error('[admin auth] listUsers failed:', error.message);
    return 'email';
  }
  const needle = email.toLowerCase();
  const user = data.users.find((u) => u.email?.toLowerCase() === needle);
  if (!user) return 'signup';
  return user.email_confirmed_at ? 'email' : 'signup';
}

/**
 * POST /api/admin/auth/verify — consume the 6-digit OTP and sign in (S10).
 *
 * Accepts form-urlencoded or JSON `{ email, code }`. On success, Supabase
 * sets the session cookie via the SSR adapter; we redirect to `/admin`.
 *
 * Re-checks the allowlist post-verify to catch revocation between OTP-send
 * and OTP-submit. All failures redirect back to the code form with a
 * generic error; we never disclose whether the email or the code was wrong.
 */
export const runtime = 'nodejs';

interface VerifyInput {
  email: string | null;
  code: string | null;
}

async function readInput(req: NextRequest): Promise<VerifyInput> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const body = (await req.json()) as { email?: unknown; code?: unknown };
      return {
        email: typeof body.email === 'string' ? body.email.trim() : null,
        code: typeof body.code === 'string' ? body.code.trim() : null,
      };
    } catch {
      return { email: null, code: null };
    }
  }
  const form = await req.formData();
  const email = form.get('email');
  const code = form.get('code');
  return {
    email: typeof email === 'string' ? email.trim() : null,
    code: typeof code === 'string' ? code.trim().replace(/\s+/g, '') : null,
  };
}

function backToCodeForm(req: NextRequest, email: string | null, error: string): NextResponse {
  const url = new URL('/admin/login', req.url);
  url.searchParams.set('sent', '1');
  if (email) url.searchParams.set('email', email);
  url.searchParams.set('error', error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const { email, code } = await readInput(req);
  if (!email || !code) {
    return backToCodeForm(req, email, 'invalid_code');
  }

  try {
    const type = await pickOtpType(email);
    const supabase = await adminAuthClient();
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type });
    if (error) {
      console.error(`[admin auth] verifyOtp type=${type} failed:`, error.message);
      return backToCodeForm(req, email, 'invalid_code');
    }
    if (!data.user?.email) {
      return backToCodeForm(req, email, 'invalid_code');
    }

    // Re-check allowlist post-verify (catches revocation between the OTP
    // being sent and the code being submitted).
    if (!isAdminEmail(data.user.email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/admin/login?error=unauthorized', req.url), {
        status: 303,
      });
    }

    return NextResponse.redirect(new URL('/admin', req.url), { status: 303 });
  } catch (err) {
    console.error('[admin auth] verifyOtp threw:', err);
    return backToCodeForm(req, email, 'invalid_code');
  }
}
