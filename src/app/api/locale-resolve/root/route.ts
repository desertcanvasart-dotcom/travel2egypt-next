import { NextRequest, NextResponse } from 'next/server';

import { client } from '@/sanity/lib/client';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Locale resolver for root-level single-segment slugs. Tours, tour
 * categories, and tour landings all live at the canonical root path
 * `/<slug>` with locale-keyed slug arrays, so switching language needs
 * the target-locale slug for whichever doc the current slug points at.
 *
 * Mirrors the per-type resolvers (e.g. /api/locale-resolve/tour) but spans
 * the doc types the root catch-all renders. Returns the target-locale slug,
 * falling back to the EN slug, or null when no match exists.
 *
 * Consumed by LocaleSwitcher's resolveLocalizedPathname() when a language
 * is picked from a bare root URL.
 */

const lookupQuery = `*[
  !(_id in path("drafts.**")) &&
  _type in ["tourCategory","tourLanding","tour"] &&
  (slug[_key == $fromLocale][0].value.current == $fromSlug ||
   (slug[_key == $fromLocale][0].value.current == null &&
    slug[_key == "en"][0].value.current == $fromSlug))
] | order(select(
    _type == "tourCategory" => 1,
    _type == "tourLanding"  => 2,
    _type == "tour"         => 3,
    99
  ) asc)[0]{
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

  const result = await client.fetch<{
    slugs: Array<{ _key: string; current: string }>;
  } | null>(lookupQuery, { fromLocale, fromSlug });

  if (!result) {
    return NextResponse.json({ slug: null }, { status: 404 });
  }

  const target =
    result.slugs.find((s) => s._key === toLocale)?.current ??
    result.slugs.find((s) => s._key === 'en')?.current ??
    null;

  return NextResponse.json({ slug: target });
}
