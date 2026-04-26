import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { deityBySlugQuery, allWikiSlugsQuery } from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { WikiCard, type WikiCardData } from '@/components/WikiCard';
import { buildMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const d = await client.fetch(deityBySlugQuery(locale as Locale), { slug });
  if (!d) return {};
  return buildMetadata(
    { ...d, title: d.name },
    { locale: locale as Locale, path: `/wiki/deities/${slug}` }
  );
}

export async function generateStaticParams() {
  const all: Array<{
    _type: string;
    slugs: Array<{ _key: string; current: string }>;
  }> = await client.fetch(allWikiSlugsQuery);
  const params: Array<{ locale: string; slug: string }> = [];
  for (const d of all.filter((d) => d._type === 'wikiDeity')) {
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

export default async function DeityPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('wiki');
  const d = await client.fetch(deityBySlugQuery(locale as Locale), { slug });
  if (!d) notFound();

  const heroUrl = d.heroImage?.asset
    ? urlFor(d.heroImage).width(2400).height(1200).quality(85).url()
    : null;

  const allMonuments: WikiCardData[] = dedupe([
    ...(d.associatedMonuments ?? []),
    ...(d.reverseDedicatedMonuments ?? []),
  ]);
  const allDeities: WikiCardData[] = dedupe([
    ...(d.associatedDeities ?? []),
    ...(d.reverseAssociatedDeities ?? []),
  ]);

  return (
    <article>
      <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden bg-cream-deep">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={d.heroImage?.alt || d.name}
            fill
            priority
            className="object-contain"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1408]/25 via-[#1f1408]/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1f1408]/42 via-[#1f1408]/15 to-transparent pt-32">
          <div className="mx-auto max-w-7xl px-6 pb-12">
            {d.domain && (
              <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-soft">
                {d.domain}
              </p>
            )}
            <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.05] text-paper drop-shadow-[0_2px_8px_rgba(31,20,8,0.45)] md:text-6xl">
              {d.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
          <div>
            {d.summary && (
              <p className="mb-12 font-serif text-2xl italic leading-relaxed text-ink-soft">
                {d.summary}
              </p>
            )}
            {d.body && (
              <div className="prose-editorial max-w-none">
                <Body value={d.body} locale={locale as Locale} />
              </div>
            )}

            {d.iconography && (
              <section className="mt-16 border-t border-line pt-12">
                <h2 className="mb-6 font-serif text-3xl font-medium text-ink">
                  {t('iconographyLabel')}
                </h2>
                <div className="prose-editorial max-w-none">
                  <Body value={d.iconography} locale={locale as Locale} />
                </div>
              </section>
            )}

            {allMonuments.length > 0 && (
              <CardSection title={t('monumentsDedicatedTo')} items={allMonuments} />
            )}
            {allDeities.length > 0 && (
              <CardSection title={t('associatedDeitiesLabel')} items={allDeities} />
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-line bg-cream-warm p-6">
              <dl className="space-y-4 text-sm">
                {d.domain && <Fact label={t('domainLabel')} value={d.domain} />}
                {d.alternateNames && d.alternateNames.length > 0 && (
                  <Fact
                    label={t('alternateNamesLabel')}
                    value={d.alternateNames.join(', ')}
                  />
                )}
                {d.primaryCultCenters && d.primaryCultCenters.length > 0 && (
                  <FactLinkList
                    label={t('primaryCultCentersLabel')}
                    items={d.primaryCultCenters.map(
                      (c: { name: string; slug: string }) => ({
                        href: `/guide/${c.slug}`,
                        value: c.name,
                      })
                    )}
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

function FactLinkList({
  label,
  items,
}: {
  label: string;
  items: Array<{ href: string; value: string }>;
}) {
  return (
    <div>
      <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </dt>
      <dd className="space-x-2">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="inline-block text-ink underline decoration-orange-pale underline-offset-2 hover:text-orange-deep"
          >
            {item.value}
          </Link>
        ))}
      </dd>
    </div>
  );
}
