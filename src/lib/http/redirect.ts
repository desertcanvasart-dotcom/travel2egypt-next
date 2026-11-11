import { NextResponse } from 'next/server';

/**
 * Redirect to a path on this site with a RELATIVE `Location` header.
 *
 * Behind Railway's proxy, `req.url` carries the container's internal origin
 * (http://localhost:8080), so `new URL(path, req.url)` sent admins to
 * localhost:8080 after signing in (2026-11-11). A relative Location
 * (RFC 9110 §10.2.2) is resolved by the browser against the address it
 * actually used, so it is correct on production, previews and local dev, and
 * cannot be steered by a spoofed Host header.
 */
export function redirectTo(path: string, status: 303 | 307 | 308 = 303): NextResponse {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error(`redirectTo: not a site path: ${path}`);
  return new NextResponse(null, { status, headers: { Location: path } });
}

/** Path + query string, e.g. pathWithQuery('/admin/login', { sent: '1' }). */
export function pathWithQuery(path: string, params: Record<string, string | null | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null) qs.set(k, v);
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}
