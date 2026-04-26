import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { dynastyBySlugQuery, allWikiSlugsQuery } from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { WikiCard, type WikiCardData } from '@/components/WikiCard';
import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/structured-data';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const dynasty = await client.fetch(dynastyBySlugQuery(locale as Locale), { slug });
  if (!dynasty) return {};
  return buildMetadata(
    { ...dynasty, title: dynasty.name },
    {
      locale: locale as Locale,
      path: `/wiki/dynasties/${slug}`,
      pathByLocale: pathByLocaleFromSlugs(
        dynasty.allSlugs,
        (s: string) => `/wiki/dynasties/${s}`
      ),
    }
  );
}

export async function generateStaticParams() {
  const all: Array<{
    _type: string;
    slugs: Array<{ _key: string; current: string }>;
  }> = await client.fetch(allWikiSlugsQuery);
  const params: Array<{ locale: string; slug: string }> = [];
  for (const d of all.filter((d) => d._type === 'wikiDynasty')) {
    const enSlug = d.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug) continue;
    for (const locale of routing.locales) {
      params.push({
        locale,
        slug: d.slugs.find((s) => s._key === locale)?.current ?? enSlug,
      });
    }
  }
  return params;
}

export default async function DynastyPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('wiki');
  const dynasty = await client.fetch(dynastyBySlugQuery(locale as Locale), { slug });
  if (!dynasty) notFound();

  const heroUrl = dynasty.heroImage?.asset
    ? urlFor(dynasty.heroImage).width(2400).height(1200).quality(85).url()
    : null;

  // Combine forward `notableRulers` + reverse rulers, deduped by _id.
  const allRulers: WikiCardData[] = dedupe([
    ...(dynasty.notableRulers ?? []),
    ...(dynasty.reverseRulers ?? []),
  ]);
  const allMonuments: WikiCardData[] = dedupe([
    ...(dynasty.notableMonuments ?? []),
    ...(dynasty.reverseMonuments ?? []),
  ]);

  return (
    <article>
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden bg-cream-deep">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={dynasty.heroImage?.alt || dynasty.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1408]/25 via-[#1f1408]/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1f1408]/42 via-[#1f1408]/15 to-transparent pt-32">
          <div className="mx-auto max-w-7xl px-6 pb-12">
            <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-soft">
              {dynasty.kingdom && t(`kingdoms.${dynasty.kingdom}` as any)}
              {dynasty.period && (
                <>
                  <span className="mx-2 opacity-60">·</span>
                  <span>{dynasty.period}</span>
                </>
              )}
            </p>
            <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.05] text-paper drop-shadow-[0_2px_8px_rgba(31,20,8,0.45)] md:text-6xl">
              {dynasty.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
          <div>
            {dynasty.summary && (
              <p className="mb-12 font-serif text-2xl italic leading-relaxed text-ink-soft">
                {dynasty.summary}
              </p>
            )}
            {dynasty.body && (
              <div className="prose-editorial max-w-none">
                <Body value={dynasty.body} locale={locale as Locale} />
              </div>
            )}

            {allRulers.length > 0 && (
              <CardSection title={t('rulersOfThisDynasty')} items={allRulers} />
            )}
            {allMonuments.length > 0 && (
              <CardSection title={t('monumentsOfThisDynasty')} items={allMonuments} />
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-line bg-cream-warm p-6">
              <dl className="space-y-4 text-sm">
                {dynasty.kingdom && (
                  <Fact label={t('kingdomLabel')} value={t(`kingdoms.${dynasty.kingdom}` as any)} />
                )}
                {dynasty.period && (
                  <Fact label={t('periodLabel')} value={dynasty.period} />
                )}
                {dynasty.predecessorDynasty && (
                  <FactLink
                    label={t('predecessorLabel')}
                    href={`/wiki/dynasties/${dynasty.predecessorDynasty.slug}`}
                    value={dynasty.predecessorDynasty.name}
                  />
                )}
                {dynasty.successorDynasty && (
                  <FactLink
                    label={t('successorLabel')}
                    href={`/wiki/dynasties/${dynasty.successorDynasty.slug}`}
                    value={dynasty.successorDynasty.name}
                  />
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}

function dedupe<T extends { _id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((x) => {
    if (!x?._id || seen.has(x._id)) return false;
    seen.add(x._id);
    return true;
  });
}

function CardSection({ title, items }: { title: string; items: WikiCardData[] }) {
  return (
    <section className="mt-20 border-t border-line pt-16">
      <h2 className="mb-8 font-serif text-3xl font-medium text-ink">{title}</h2>
      <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <WikiCard key={item._id} item={item} />
        ))}
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </dt>
      <dd className="text-ink-soft">{value}</dd>
    </div>
  );
}

function FactLink({
  label,
  href,
  value,
}: {
  label: string;
  href: string;
  value: string;
}) {
  return (
    <div>
      <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </dt>
      <dd>
        <Link
          href={href}
          className="text-ink underline decoration-orange-pale underline-offset-2 hover:text-orange-deep"
        >
          {value}
        </Link>
      </dd>
    </div>
  );
}
