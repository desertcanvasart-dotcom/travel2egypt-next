import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { buildStaticMetadata } from '@/lib/seo';
import { client } from '@/sanity/lib/client';
import { legalPageByKindQuery } from '@/sanity/lib/queries';
import { Body } from '@/components/Body';

type LegalKind = 'terms' | 'privacy' | 'cookies' | 'disclaimer';

interface LegalDoc {
  _id: string;
  kind: LegalKind;
  title: string;
  slug: string;
  allSlugs?: Array<{ _key: string; current: string }>;
  lastUpdated?: string;
  body?: unknown;
}

interface Props {
  locale: Locale;
  kind: LegalKind;
}

export async function LegalPageView({ locale, kind }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('legal');
  const doc: LegalDoc | null = await client.fetch(legalPageByKindQuery(locale), { kind });
  if (!doc) notFound();

  const formattedDate = doc.lastUpdated
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(
        new Date(doc.lastUpdated)
      )
    : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12 border-b border-line pb-8">
        <h1 className="mb-4 font-serif text-4xl font-medium leading-tight text-ink md:text-5xl">
          {doc.title}
        </h1>
        {formattedDate && (
          <p className="font-sans text-sm uppercase tracking-[0.12em] text-ink-muted">
            {t('lastUpdatedPrefix')} {formattedDate}
          </p>
        )}
      </header>
      {Boolean(doc.body) && (
        <div className="prose-editorial max-w-none">
          <Body value={doc.body} locale={locale} />
        </div>
      )}
    </article>
  );
}

const META_DESCRIPTION_KEY: Record<LegalKind, string> = {
  terms: 'metaTerms',
  privacy: 'metaPrivacy',
  cookies: 'metaCookies',
  disclaimer: 'metaDisclaimer',
};

/**
 * s47 launch-polish fix (2026-08-18): previously returned a bare
 * { title, alternates: { canonical: path } } with a locale-PREFIXED path and
 * no metadataBase anywhere in the chain — Next resolved the relative
 * canonical against http://localhost:<port> in production, and the pages
 * shipped no description, OG, or hreflang. buildStaticMetadata supplies all
 * of that; callers must pass the UNPREFIXED path (e.g. '/terms').
 */
export async function legalMetadata(locale: Locale, kind: LegalKind, path: string) {
  const doc: LegalDoc | null = await client.fetch(legalPageByKindQuery(locale), { kind });
  if (!doc) return {};
  const t = await getTranslations({ locale, namespace: 'legal' });
  return buildStaticMetadata({
    locale,
    path,
    title: doc.title,
    description: t(META_DESCRIPTION_KEY[kind]),
  });
}
