import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';

import { Body } from '@/components/Body';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { allCitiesQuery, guideIntroQuery } from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import { buildBreadcrumbList } from '@/lib/structured-data';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guide' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/guide',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

// Region display order on the /guide landing page. Geographic-ish narrative:
// Cairo arrival → southern temple route → Sinai → Red Sea → Mediterranean →
// desert oases. Untagged cities (region missing) fall to the end.
const REGION_ORDER: Array<string | null> = [
  'lower-egypt',
  'upper-egypt',
  'sinai',
  'red-sea',
  'mediterranean',
  'western-desert',
  null, // "Other" — cities with no region set
];

export default async function GuideLandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('guide');
  const tRegions = await getTranslations('regions');
  const tNav = await getTranslations('nav');

  const cities = await client.fetch(allCitiesQuery(locale as Locale));
  const settings = await client.fetch(guideIntroQuery(locale as Locale));
  const guideIntro = settings?.guideIntro as any[] | undefined;

  const breadcrumbItems = [
    { label: tNav('home'), href: '/' },
    { label: tNav('guide') },
  ];
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: tNav('guide'), path: '/guide' },
    ],
    locale as Locale,
  );

  // Group cities by region, preserving the city order (orderRank) within each group.
  const byRegion = new Map<string | null, any[]>();
  for (const city of cities ?? []) {
    const r = (city.region as string | null) ?? null;
    if (!byRegion.has(r)) byRegion.set(r, []);
    byRegion.get(r)!.push(city);
  }
  // Sort each region's cities alphabetically by name.
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  for (const list of byRegion.values()) {
    list.sort((a, b) => collator.compare(a.name ?? '', b.name ?? ''));
  }

  // Build the rendered region sections in REGION_ORDER, skipping empties.
  const orderedRegions = REGION_ORDER
    .map((slug) => ({ slug, cities: byRegion.get(slug) ?? [] }))
    .filter((r) => r.cities.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumb items={breadcrumbItems} className="mb-8" />
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-6 font-serif text-5xl font-medium leading-tight text-ink">
          {t('landingTitle')}
        </h1>
        <p className="font-serif text-xl italic text-ink-soft">
          {t('landingDeck')}
        </p>
      </header>

      {guideIntro && guideIntro.length > 0 && (
        <div className="prose-editorial mb-16 max-w-3xl">
          <Body value={guideIntro} locale={locale as Locale} />
        </div>
      )}

      {cities && cities.length > 0 ? (
        <div className="space-y-16">
          {orderedRegions.map(({ slug, cities: regionCities }) => {
            const label =
              slug === null
                ? t('regionOther')
                : tRegions.has(slug as any)
                  ? tRegions(slug as any)
                  : slug.replace(/-/g, ' ');
            return (
              <section
                key={slug ?? '__other__'}
                id={slug ?? 'other'}
                className="scroll-mt-24"
              >
                <h2 className="mb-8 font-serif text-3xl font-medium text-ink">
                  {label}
                </h2>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {regionCities.map((city: any) => (
                    <Link
                      key={city._id}
                      href={`/guide/${city.slug}`}
                      className="group block"
                    >
                      {city.heroImage?.asset && (
                        <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-cream-deep">
                          <Image
                            src={urlFor(city.heroImage).width(800).height(600).quality(80).url()}
                            alt={city.heroImage.alt || city.name}
                            width={800}
                            height={600}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <h3 className="mb-2 font-serif text-2xl font-medium text-ink group-hover:text-orange-deep">
                        {city.name}
                      </h3>
                      <p className="text-sm leading-relaxed text-ink-soft">{city.summary}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-paper p-12 text-center">
          <p className="text-ink-muted">
            No cities found. Run the seed script to populate fixture data:
          </p>
          <code className="mt-4 inline-block rounded bg-cream-warm px-3 py-1.5 font-mono text-sm">
            npm run seed
          </code>
        </div>
      )}
    </div>
  );
}
