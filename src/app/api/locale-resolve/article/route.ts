import { NextRequest, NextResponse } from 'next/server';
import { groq } from 'next-sanity';

import { client } from '@/sanity/lib/client';
import { fetchTranslationSlugs } from '@/sanity/lib/translations';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Locale resolver for journal articles.
 *
 * Mirrors /api/locale-resolve/city — client-side fetch from
 * LocaleSwitcher's resolveLocalizedPathname() on language pick. Returns
 * the target-locale slug for the same translation set, or null if no
 * translation exists in that locale.
 *
 * This is the pattern for translatable-doc routes consumed by global
 * chrome (Header, Footer). The page-level TranslationProvider approach
 * cannot work in App Router because Header is a parent of {children}
 * in the layout tree — context flows downward only.
 */

const articleIdQuery = groq`
  *[_type == "article" && slug.current == $fromSlug && language == $fromLocale][0]._id
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

  // Bound the Sanity round-trip so a hung origin can't stall the request,
  // and never leak an unhandled fetch rejection out of the route handler.
  // The timeout signal bounds the first hop; a throw from either hop is
  // caught here and surfaced as a coded error.
  let articleId: string | null;
  let slugs: Awaited<ReturnType<typeof fetchTranslationSlugs>>;
  try {
    articleId = await client.fetch<string | null>(
      articleIdQuery,
      { fromLocale, fromSlug },
      { signal: AbortSignal.timeout(5000) }
    );

    if (!articleId) {
      return NextResponse.json({ slug: null }, { status: 404 });
    }

    slugs = await fetchTranslationSlugs(articleId);
  } catch (err) {
    console.error('[locale-resolve] article fetch failed:', err);
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      { error: timedOut ? 'resolve_timeout' : 'resolve_failed' },
      { status: timedOut ? 504 : 502 }
    );
  }

  return NextResponse.json({ slug: slugs[toLocale] ?? null });
}
