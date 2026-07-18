import { NextRequest, NextResponse } from 'next/server';
import { groq } from 'next-sanity';

import { client } from '@/sanity/lib/client';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Locale resolver for journal category pages (/blog/category/[slug]).
 *
 * Unlike articles (document-per-language + translation.metadata), an
 * editorialCategory is a SINGLE doc whose slug is a locale-keyed array. Root
 * buckets carry localized slugs (planning → es "planificacion"); leaves share
 * the English slug. Matching on the from-locale slug with an EN fallback finds
 * the category regardless, and the return coalesces to the EN slug when the
 * target locale has none — so the switcher lands on a real page every time.
 */
const categorySlugQuery = groq`
  *[_type == "editorialCategory" &&
    coalesce(slug[_key == $fromLocale][0].value.current, slug[_key == "en"][0].value.current) == $fromSlug
  ][0]{
    "slug": coalesce(slug[_key == $toLocale][0].value.current, slug[_key == "en"][0].value.current)
  }.slug
`;

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

  let slug: string | null;
  try {
    slug = await client.fetch<string | null>(
      categorySlugQuery,
      { fromLocale, fromSlug, toLocale },
      { signal: AbortSignal.timeout(5000) }
    );
  } catch (err) {
    console.error('[locale-resolve] blogCategory fetch failed:', err);
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      { error: timedOut ? 'resolve_timeout' : 'resolve_failed' },
      { status: timedOut ? 504 : 502 }
    );
  }

  return NextResponse.json({ slug: slug ?? null });
}
