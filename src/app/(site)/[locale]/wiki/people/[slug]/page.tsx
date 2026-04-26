import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { personBySlugQuery, allWikiSlugsQuery } from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { WikiCard, type WikiCardData } from '@/components/WikiCard';
import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import {
  buildPersonSchema,
  buildBreadcrumbList,
} from '@/lib/structured-data';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const person = await client.fetch(personBySlugQuery(locale as Locale), { slug });
  if (!person) return {};
  return buildMetadata(
    { ...person, title: person.name },
    {
      locale: locale as Locale,
      path: `/wiki/people/${slug}`,
      pathByLocale: pathByLocaleFromSlugs(
        person.allSlugs,
        (s: string) => `/wiki/people/${s}`
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
  for (const d of all.filter((d) => d._type === 'wikiPerson')) {
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

export default async function PersonPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('wiki');
  const person = await client.fetch(personBySlugQuery(locale as Locale), { slug });
  if (!person) notFound();

  const heroUrl = person.heroImage?.asset
    ? urlFor(person.heroImage).width(2400).height(1200).quality(85).url()
    : null;

  const builtMonuments: WikiCardData[] = dedupe([
    ...(person.notableMonuments ?? []),
    ...(person.reverseBuilt ?? []),
  ]);
  const burialMonuments: WikiCardData[] = dedupe([
    ...(person.burialSite ? [person.burialSite] : []),
    ...(person.reverseBuriedHere ?? []),
  ]);

  const personSchema = buildPersonSchema(
    {
      name: person.name,
      slug,
      type: 'wikiPerson',
      summary: person.summary,
      heroImage: person.heroImage,
      alternateNames: person.alternateNames,
      reignDisplay: person.reignDisplay,
      role: person.role,
    },
    locale as Locale
  );
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: 'Home', path: '/' },
      { name: 'Egypt Wiki', path: '/wiki' },
      { name: 'People', path: '/wiki/people' },
      { name: person.name, path: `/wiki/people/${slug}` },
    ],
    locale as Locale
  );

  return (
    <article>
      <JsonLd data={[personSchema, breadcrumbSchema]} />
      <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden bg-cream-deep">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={person.heroImage?.alt || person.name}
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
              {person.role && t(`roles.${person.role}` as any)}
              {person.reignDisplay && (
                <>
                  <span className="mx-2 opacity-60">·</span>
                  <span>{person.reignDisplay}</span>
                </>
              )}
            </p>
            <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.05] text-paper drop-shadow-[0_2px_8px_rgba(31,20,8,0.45)] md:text-6xl">
              {person.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
          <div>
            {person.summary && (
              <p className="mb-12 font-serif text-2xl italic leading-relaxed text-ink-soft">
                {person.summary}
              </p>
            )}
            {person.body && (
              <div className="prose-editorial max-w-none">
                <Body value={person.body} locale={locale as Locale} />
              </div>
            )}

            {builtMonuments.length > 0 && (
              <CardSection title={t('monumentsBuilt')} items={builtMonuments} />
            )}
            {burialMonuments.length > 0 && (
              <CardSection title={t('monumentsBurialOf')} items={burialMonuments} />
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <div className="rounded-lg border border-line bg-cream-warm p-6">
              <dl className="space-y-4 text-sm">
                {person.role && (
                  <Fact label={t('roleLabel')} value={t(`roles.${person.role}` as any)} />
                )}
                {person.dynasty && (
                  <FactLink
                    label={t('dynastyLabel')}
                    href={`/wiki/dynasties/${person.dynasty.slug}`}
                    value={person.dynasty.name}
                  />
                )}
                {person.reignDisplay && (
                  <Fact label={t('reignLabel')} value={person.reignDisplay} />
                )}
                {person.alternateNames && person.alternateNames.length > 0 && (
                  <Fact
                    label={t('alternateNamesLabel')}
                    value={person.alternateNames.join(', ')}
                  />
                )}
              </dl>
            </div>

            {(person.predecessor || person.successor || (person.spouse?.length ?? 0) > 0
              || (person.parents?.length ?? 0) > 0
              || (person.children?.length ?? 0) > 0) && (
              <div className="rounded-lg border border-line bg-paper p-6">
                <dl className="space-y-4 text-sm">
                  {person.predecessor && (
                    <FactLink
                      label={t('predecessorLabel')}
                      href={`/wiki/people/${person.predecessor.slug}`}
                      value={person.predecessor.name}
                    />
                  )}
                  {person.successor && (
                    <FactLink
                      label={t('successorLabel')}
                      href={`/wiki/people/${person.successor.slug}`}
                      value={person.successor.name}
                    />
                  )}
                  {person.spouse && person.spouse.length > 0 && (
                    <FactLinkList
                      label={t('spouseLabel')}
                      items={person.spouse.map((p: WikiCardData) => ({
                        href: `/wiki/people/${p.slug}`,
                        value: p.name,
                      }))}
                    />
                  )}
                  {person.parents && person.parents.length > 0 && (
                    <FactLinkList
                      label={t('parentsLabel')}
                      items={person.parents.map((p: WikiCardData) => ({
                        href: `/wiki/people/${p.slug}`,
                        value: p.name,
                      }))}
                    />
                  )}
                  {person.children && person.children.length > 0 && (
                    <FactLinkList
                      label={t('childrenLabel')}
                      items={person.children.map((p: WikiCardData) => ({
                        href: `/wiki/people/${p.slug}`,
                        value: p.name,
                      }))}
                    />
                  )}
                </dl>
              </div>
            )}
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
      <dd className="space-x-2 space-y-1">
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
