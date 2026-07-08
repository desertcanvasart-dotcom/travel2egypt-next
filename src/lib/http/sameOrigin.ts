import { NextResponse, type NextRequest } from 'next/server';

/**
 * Same-origin assertion for mutating API routes (Session 11 defense-in-depth).
 *
 * The signed session cookie is `SameSite=Lax` and the routes parse JSON-only
 * bodies, which is the primary CSRF defense (Lax withholds the cookie on
 * cross-site POST). This adds an explicit belt-and-suspenders check so a future
 * cookie-attribute regression or a same-site subdomain foothold can't open a
 * CSRF hole.
 *
 * Policy:
 *  - Trust the browser's own `Sec-Fetch-Site` when present: reject only
 *    `cross-site` (allow `same-origin`, `same-site`, `none`).
 *  - Otherwise fall back to comparing the `Origin` host to the request `Host`.
 *  - If neither header is present (non-browser client / older UA), allow — the
 *    `SameSite=Lax` cookie remains the guard and we don't want to break
 *    legitimate server-to-server callers.
 *
 * Returns a 403 `NextResponse` to short-circuit the handler, or `null` when the
 * request is same-origin (caller proceeds).
 */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  const forbidden = () => NextResponse.json({ error: 'cross_origin' }, { status: 403 });

  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite) {
    return secFetchSite === 'cross-site' ? forbidden() : null;
  }

  const origin = req.headers.get('origin');
  if (!origin) return null; // no browser origin signal → SameSite=Lax is the guard
  try {
    if (new URL(origin).host === req.headers.get('host')) return null;
  } catch {
    /* malformed Origin → treat as cross-origin */
  }
  return forbidden();
}
