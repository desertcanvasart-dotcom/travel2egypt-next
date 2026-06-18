import { NextRequest, NextResponse } from 'next/server';

import { client } from '@/sanity/lib/client';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Locale resolver for travel tips.
 *
 * Mirrors /api/locale-resolve/city — field-level i18n shape (single doc,
 * locale-keyed slug array). Returns the target-locale slug for the
 * matching travelTip, or null if no translation exists in that locale.
 *
 * Consumed by LocaleSwitcher's resolveLocalizedPathname() on language
 * pick from a /travel-tips/[slug] page.
 */

const lookupQuery = `*[_type == "travelTip" && (
  slug[_key == $fromLocale][0].value.current == $fromSlug ||
  (slug[_key == $fromLocale][0].value.current == null &&
   slug[_key == "en"][0].value.current == $fromSlug)
)][0]{
  "slugs": slug[]{ _key, "current": value.current }
}`;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const fromLocale = sp.get('fromLocale') as Locale | null;
  const fromSlug = sp.get('fromSlug');
  const toLocale = sp.get('toLocale') as Locale | null;

  if (!fromLocale || !fromSlug || !toLocale) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }
  if (
    !routing.locales.includes(fromLocale) ||
    !routing.locales.includes(toLocale)
  ) {
    return NextResponse.json({ error: 'unknown locale' }, { status: 400 });
  }

  // Bound the Sanity round-trip so a hung origin can't stall the request,
  // and never leak an unhandled fetch rejection out of the route handler.
  let result: { slugs: Array<{ _key: string; current: string }> } | null;
  try {
    result = await client.fetch<{
      slugs: Array<{ _key: string; current: string }>;
    } | null>(
      lookupQuery,
      { fromLocale, fromSlug },
      { signal: AbortSignal.timeout(5000) }
    );
  } catch (err) {
    console.error('[locale-resolve] travelTip fetch failed:', err);
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      { error: timedOut ? 'resolve_timeout' : 'resolve_failed' },
      { status: timedOut ? 504 : 502 }
    );
  }

  if (!result) {
    return NextResponse.json({ slug: null }, { status: 404 });
  }

  const target =
    result.slugs.find((s) => s._key === toLocale)?.current ??
    result.slugs.find((s) => s._key === 'en')?.current ??
    null;

  return NextResponse.json({ slug: target });
}
