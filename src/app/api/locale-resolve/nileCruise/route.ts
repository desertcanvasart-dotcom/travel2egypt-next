import { NextRequest, NextResponse } from 'next/server';

import { client } from '@/sanity/lib/client';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Locale resolver for Nile cruises.
 *
 * Mirrors /api/locale-resolve/city — field-level i18n shape (single doc,
 * locale-keyed slug array). Returns the target-locale slug for the
 * matching nileCruise, or null if no translation exists in that locale.
 *
 * Consumed by LocaleSwitcher's resolveLocalizedPathname() on language
 * pick from a /nile-cruises/[slug] page.
 */

const lookupQuery = `*[_type == "nileCruise" && (
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
