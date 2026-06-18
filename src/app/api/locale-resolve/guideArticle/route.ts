import { NextRequest, NextResponse } from 'next/server';

import { client } from '@/sanity/lib/client';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Locale resolver for guide articles (2-segment URL: /guide/[city]/[article]).
 *
 * Both path segments vary by locale — article slug AND parent city slug.
 * Single GROQ resolves both in one round-trip via the parentCity reference
 * walk. Lookup keyed on the article slug only (sufficient to identify the
 * doc; the parent slug is derived).
 *
 * Returns:
 *   { articleSlug, citySlug } — both populated when full target-locale
 *     translation exists
 *   { articleSlug: null, citySlug: null } — when the article doesn't
 *     exist in target locale OR when EITHER the article OR the parent
 *     city is missing a target-locale slug (treat partial translation
 *     as no-go; fallback to /guide list is better UX than a
 *     half-translated URL)
 *
 * Consumed by LocaleSwitcher's resolveLocalizedPathname() on language
 * pick from a /guide/[city]/[article] page.
 */

const lookupQuery = `*[_type == "guideArticle" && (
  slug[_key == $fromLocale][0].value.current == $fromArticleSlug ||
  (slug[_key == $fromLocale][0].value.current == null &&
   slug[_key == "en"][0].value.current == $fromArticleSlug)
)][0]{
  "articleSlug": slug[_key == $toLocale][0].value.current,
  "citySlug": parentCity->slug[_key == $toLocale][0].value.current
}`;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const fromLocale = sp.get('fromLocale') as Locale | null;
  const fromArticleSlug = sp.get('fromArticleSlug');
  const toLocale = sp.get('toLocale') as Locale | null;

  if (!fromLocale || !fromArticleSlug || !toLocale) {
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
  let result: { articleSlug: string | null; citySlug: string | null } | null;
  try {
    result = await client.fetch<{
      articleSlug: string | null;
      citySlug: string | null;
    } | null>(
      lookupQuery,
      { fromLocale, fromArticleSlug, toLocale },
      { signal: AbortSignal.timeout(5000) }
    );
  } catch (err) {
    console.error('[locale-resolve] guideArticle fetch failed:', err);
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      { error: timedOut ? 'resolve_timeout' : 'resolve_failed' },
      { status: timedOut ? 504 : 502 }
    );
  }

  // No matching article OR partial translation (either segment missing) →
  // return null pair so the switcher falls back to the /guide list.
  if (!result || !result.articleSlug || !result.citySlug) {
    return NextResponse.json(
      { articleSlug: null, citySlug: null },
      { status: 404 }
    );
  }

  return NextResponse.json({
    articleSlug: result.articleSlug,
    citySlug: result.citySlug,
  });
}
