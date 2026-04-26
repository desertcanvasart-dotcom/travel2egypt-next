import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { monumentBySlugQuery, allWikiSlugsQuery } from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { WikiCard, type WikiCardData } from '@/components/WikiCard';
import { buildMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const m = await client.fetch(monumentBySlugQuery(locale as Locale), { slug });
  if (!m) return {};
  return buildMetadata(
    { ...m, title: m.name },
    { locale: locale as Locale, path: `/wiki/monuments/${slug}` }
  );
}

export async function generateStaticParams() {
  const all: Array<{
    _type: string;
    slugs: Array<{ _key: string; current: string }>;
  }> = await client.fetch(allWikiSlugsQuery);
  const params: Array<{ locale: string; slug: string }> = [];
  for (const d of all.filter((d) => d._type === 'wikiMonument')) {
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

export default async function MonumentPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('wiki');
  const m = await client.fetch(monumentBySlugQuery(locale as Locale), { slug });
  if (!m) notFound();

  const heroUrl = m.heroImage?.asset
    ? urlFor(m.heroImage).width(2400).height(1200).quality(85).url()
    : null;

  const buriedHere: WikiCardData[] = dedupe([
    ...(m.buriedHere ?? []),
    ...(m.reversePersonBurialSite ?? []),
  ]);
  const relatedMonuments: WikiCardData[] = dedupe([
    ...(m.relatedMonuments ?? []),
    ...(m.reverseRelatedMonuments ?? []),
  ]);

  return (
    <article>
      <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden bg-cream-deep">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={m.heroImage?.alt || m.name}
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
              {m.monumentType && t(`monumentTypes.${m.monumentType}` as any)}
              {m.preciseLocation && (
                <>
                  <span className="mx-2 opacity-60">·</span>
                  <span className="text-paper/80">{m.preciseLocation}</span>
                </>
              )}
            </p>
            <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.05] text-paper drop-shadow-[0_2px_8px_rgba(31,20,8,0.45)] md:text-6xl">
              {m.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
          <div>
            {m.summary && (
              <p className="mb-12 font-serif text-2xl italic leading-relaxed text-ink-soft">
                {m.summary}
              </p>
            )}
            {m.body && (
              <div className="prose-editorial max-w-none">
                <Body value={m.body} locale={locale as Locale} />
              </div>
            )}

            {m.visitorInfo && (
              <section className="mt-16 border-t border-line pt-12">
                <h2 className="mb-6 font-serif text-3xl font-medium text-ink">
                  {t('visitorInfoLabel')}
                </h2>
                <div className="prose-editorial max-w-none">
                  <Body value={m.visitorInfo} locale={locale as Locale} />
                </div>
              </section>
            )}

            {buriedHere.length > 0 && (
              <CardSection title={t('personsBuriedAtMonument')} items={buriedHere} />
            )}
            {relatedMonuments.length > 0 && (
              <CardSection title={t('relatedMonumentsLabel')} items={relatedMonuments} />
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-line bg-cream-warm p-6">
              <dl className="space-y-4 text-sm">
                {m.monumentType && (
                  <Fact
                    label={t('monumentTypeLabel')}
                    value={t(`monumentTypes.${m.monumentType}` as any)}
                  />
                )}
                {m.city && (
                  <FactLink
                    label={t('cityLabel')}
                    href={`/guide/${m.city.slug}`}
                    value={m.city.name}
                  />
                )}
                {m.preciseLocation && (
                  <Fact label={t('cityLabel')} value={m.preciseLocation} />
                )}
                {m.builtDuring && (
                  <FactLink
                    label={t('builtDuringLabel')}
                    href={`/wiki/dynasties/${m.builtDuring.slug}`}
                    value={m.builtDuring.name}
                  />
                )}
                {m.builtBy && m.builtBy.length > 0 && (
                  <FactLinkList
                    label={t('builtByLabel')}
                    items={m.builtBy.map((p: WikiCardData) => ({
                      href: `/wiki/people/${p.slug}`,
                      value: p.name,
                    }))}
                  />
                )}
                {m.dedicatedTo && m.dedicatedTo.length > 0 && (
                  <FactLinkList
                    label={t('dedicatedToLabel')}
                    items={m.dedicatedTo.map((d: WikiCardData) => ({
                      href: `/wiki/deities/${d.slug}`,
                      value: d.name,
                    }))}
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

function FactLink({ label, href, value }: { label: string; href: string; value: string }) {
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
