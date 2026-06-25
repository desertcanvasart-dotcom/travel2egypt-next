import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { isAdminEmail } from './whitelist';

/**
 * Server-side Supabase Auth client + admin gate (Session 10).
 *
 * Auth runs on the same Supabase project as the concierge schema, but uses
 * the anon key + GoTrue endpoints — NOT the service-role key. Cookies are
 * managed via Next's `cookies()` so the Auth session lives in a HttpOnly
 * cookie that the browser carries on subsequent requests.
 *
 * The admin gate is two-factor by design (mirrors the locked decision in the
 * build brief S10):
 *   1. Valid Supabase Auth session
 *   2. Email in `ADMIN_EMAILS` allowlist
 * Anyone can create a Supabase Auth account by sending themselves a magic
 * link, so check 1 alone proves nothing. The boundary is the AND of both.
 *
 * Never import this from a Client Component — the anon key is meant for
 * server-side use of the auth API, and we never want client-side queries to
 * bypass the `/api/admin/*` guard.
 */

if (typeof window !== 'undefined') {
  throw new Error('lib/admin/auth.ts must never be imported client-side');
}

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} must be set`);
  return v;
}

/**
 * Per-request Supabase Auth client bound to the request's cookie jar.
 * Reads `SUPABASE_URL` + `SUPABASE_ANON_KEY` (not the service-role key).
 */
export async function adminAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(envOrThrow('SUPABASE_URL'), envOrThrow('SUPABASE_ANON_KEY'), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies during render — Route
          // Handlers and Server Actions can. We ignore the error here so a
          // page that only reads the session still works; mutations go
          // through `/api/admin/*` routes that CAN set cookies.
        }
      },
    },
  });
}

export interface AdminSession {
  email: string;
  userId: string;
}

/**
 * Returns the admin session if BOTH gates pass (valid Supabase Auth session
 * AND email in ADMIN_EMAILS). Otherwise null.
 *
 * Callers decide what to do with null:
 *   - Pages: redirect to /admin/login
 *   - API routes: 401 unauthorized
 *
 * Note `getSession()` reads from the cookie which is signed but not freshly
 * validated against the server; for the admin panel that is acceptable (the
 * value the cookie carries is the email we already vetted at login + we
 * check it against the allowlist every request).
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const supabase = await adminAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    if (!isAdminEmail(user.email)) return null;
    return { email: user.email, userId: user.id };
  } catch (err) {
    // Fail closed: missing SUPABASE_ANON_KEY, Supabase outage, or a malformed
    // cookie all collapse to "no session" — caller redirects to /admin/login.
    // The default-deny side is the safe side for an admin gate.
    console.error('[admin auth] getAdminSession failed:', err);
    return null;
  }
}
