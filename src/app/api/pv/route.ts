import { NextResponse, type NextRequest } from 'next/server';

import { conciergeDb } from '@/lib/supabase/server';
import { cleanPath, isBot, referrerDomain } from '@/lib/measure/shared';

/**
 * POST /api/pv — cookieless aggregate page count (2026-11-10).
 *
 * Body {path, locale, ref, device} → +1 on concierge.pageviews_daily for
 * (UTC day, path, locale, referrer domain, device). Nothing about the visitor
 * is stored: no IP, no user agent, no cookie, no ID. The user agent is read
 * only to drop bots and is never written. Always answers 204 (fail-soft: if
 * migration 0011 is not applied yet the count is dropped and logged).
 */
export const runtime = 'nodejs';

const LOCALES = new Set(['en', 'es', 'ja']);
const done = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return done();
  if (isBot(req.headers.get('user-agent'))) return done();
  // Prefetch / prerender requests are not views.
  if (req.headers.get('purpose') === 'prefetch' || req.headers.get('sec-purpose')?.includes('prefetch')) return done();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text()) as Record<string, unknown>;
  } catch {
    return done();
  }
  const path = cleanPath(body.path);
  if (!path || path.startsWith('/api') || path.startsWith('/admin') || path.startsWith('/studio')) return done();
  const locale = typeof body.locale === 'string' && LOCALES.has(body.locale) ? body.locale : 'en';
  // The client already reduced it to a domain; re-validate (never trust input).
  const ref = typeof body.ref === 'string' && body.ref ? referrerDomain(`https://${body.ref}`) : '';
  const device = body.device === 'mobile' ? 'mobile' : 'desktop';
  const day = new Date().toISOString().slice(0, 10);

  try {
    const { error } = await conciergeDb().rpc('pv_increment', {
      p_day: day,
      p_path: path,
      p_locale: locale,
      p_referrer: ref,
      p_device: device,
    });
    if (error) console.error('[pv] count dropped (migration 0011 applied?):', error.message);
  } catch (err) {
    console.error('[pv] count dropped:', err);
  }
  return done();
}
