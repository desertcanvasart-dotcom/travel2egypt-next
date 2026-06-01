import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  allDayToursQuery,
  dayToursArchiveQuery,
  articlesByLanguageQuery,
} from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import { ArchiveTemplate } from '@/components/archive/ArchiveTemplate';
import {
  bucketKeyForValue,
  type ArchiveItem,
  type ArchiveCollection,
  type FacetFilterGroup,
  type ItemFacet,
  type CollectionVariant,
  type NavigatorConfig,
  type RangeBucket,
} from '@/components/archive/types';
import type { WeaveItem } from '@/components/ArticleConnective';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dayTours' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/private-day-tours',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

interface RawTour {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  durationDays?: number;
  durationHours?: number;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  cities?: Array<{ _id: string; name: string; slug: string }>;
}

interface ArchiveDoc {
  kicker?: string;
  title?: string;
  tagline?: string;
  essayHeading?: string;
  essay?: unknown;
  featured?: { dek?: string; body?: unknown; tour?: RawTour | null } | null;
  collections?: Array<{
    kicker?: string;
    title?: string;
    intro?: string;
    variant?: string;
    tours?: RawTour[];
  }>;
  navigator?: {
    heading?: string;
    intro?: string;
    items?: Array<{
      note?: string;
      landing?: { slug?: string; cityId?: string; cityName?: string } | null;
    }>;
  } | null;
}

/** Hour boundaries for the three duration buckets. */
const DURATION_BUCKETS: Array<Omit<RangeBucket, 'label'>> = [
  { key: 'half', min: 0, max: 5 },
  { key: 'full', min: 6, max: 10 },
  { key: 'extended', min: 11 },
];

/**
 * Derive a tour's duration bucket. Structured duration is sparse in the data
 * (few durationHours, almost no multi-day), so: prefer durationHours → bucket;
 * else multi-day → extended; else explicit half/extended signals in the
 * title/slug; else default to "full" (the dominant day-tour shape). The bucket
 * is a filtering/UI affordance, not an asserted fact — see README.
 */
function deriveDurationBucket(tour: RawTour): { key: string; numeric?: number } {
  if (typeof tour.durationHours === 'number') {
    const key = bucketKeyForValue(
      DURATION_BUCKETS.map((b) => ({ ...b, label: b.key })),
      tour.durationHours
    );
    return { key: key ?? 'full', numeric: tour.durationHours };
  }
  if (typeof tour.durationDays === 'number' && tour.durationDays >= 2) return { key: 'extended' };
  const text = `${tour.title ?? ''} ${tour.slug ?? ''}`.toLowerCase();
  if (/\b(two|three|2|3)[ -]?days?\b|overnight|by road/.test(text)) return { key: 'extended' };
  if (/half[ -]?day|sunrise|sunset|balloon|by night|morning only/.test(text)) return { key: 'half' };
  return { key: 'full' };
}

export default async function DayToursArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('dayTours');
  const tArchive = await getTranslations('archive');
  const tNav = await getTranslations('nav');

  const [archive, tours, recentArticles] = await Promise.all([
    client.fetch<ArchiveDoc | null>(dayToursArchiveQuery(locale as Locale)),
    client.fetch<RawTour[]>(allDayToursQuery(locale as Locale)),
    client.fetch<
      Array<{ _id: string; title: string; slug: string; category?: { name?: string } | null }>
    >(articlesByLanguageQuery, { locale }),
  ]);

  const bucketLabel = (key: string): string => {
    switch (key) {
      case 'half':
        return t('lengthHalf');
      case 'extended':
        return t('lengthExtended');
      default:
        return t('lengthFull');
    }
  };

  const buckets: RangeBucket[] = DURATION_BUCKETS.map((b) => ({ ...b, label: bucketLabel(b.key) }));

  const toItem = (tour: RawTour): ArchiveItem => {
    const facets: ItemFacet[] = [];
    const dur = deriveDurationBucket(tour);
    facets.push({
      key: 'duration',
      value: dur.key,
      label: bucketLabel(dur.key),
      render: 'badge',
      ...(dur.numeric != null ? { numericValue: dur.numeric } : {}),
    });
    if (tour.cities?.[0]?.slug) {
      facets.push({
        key: 'city',
        value: tour.cities[0].slug,
        label: tour.cities[0].name,
        render: 'text',
      });
    }
    return {
      _id: tour._id,
      title: tour.title,
      href: `/${tour.slug}`,
      summary: tour.summary,
      image: tour.heroImage ?? null,
      facets,
    };
  };

  const indexItems = tours.map(toItem);

  // ── Facet filters: duration (range) + city (exact, from the live set) ──
  const cityMap = new Map<string, string>();
  for (const tour of tours) {
    const c = tour.cities?.[0];
    if (c?.slug) cityMap.set(c.slug, c.name);
  }
  const filters: FacetFilterGroup[] = [
    {
      key: 'duration',
      paramKey: 'length',
      label: t('filterLength'),
      allLabel: t('anyLength'),
      kind: 'range',
      buckets,
      options: buckets.map((b) => ({ value: b.key, label: b.label })),
      hint: t('lengthHint'),
    },
    {
      key: 'city',
      paramKey: 'city',
      label: t('filterCity'),
      options: Array.from(cityMap, ([value, label]) => ({ value, label })).sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
    },
  ];

  // ── Featured ──
  const featured = archive?.featured?.tour
    ? {
        kicker: t('featuredKicker'),
        item: toItem(archive.featured.tour),
        dek: archive.featured.dek,
        body: archive.featured.body,
        linkLabel: t('featuredLink'),
      }
    : undefined;

  // ── Collections ──
  const VARIANTS: CollectionVariant[] = ['lead', 'pair', 'trio'];
  const collections: ArchiveCollection[] = (archive?.collections ?? [])
    .map((c) => ({
      kicker: c.kicker,
      title: c.title ?? '',
      intro: c.intro,
      variant: (VARIANTS.includes(c.variant as CollectionVariant)
        ? c.variant
        : 'trio') as CollectionVariant,
      items: (c.tours ?? []).map(toItem),
    }))
    .filter((c) => c.title && c.items.length > 0);

  // ── Navigator: resolve count per city from the live tour set ──
  const navigator: NavigatorConfig | undefined = archive?.navigator?.items?.length
    ? {
        heading: archive.navigator.heading ?? '',
        intro: archive.navigator.intro,
        items: archive.navigator.items
          .filter((it) => it.landing?.slug && it.landing?.cityId)
          .map((it) => {
            const count = tours.filter((tour) =>
              tour.cities?.some((c) => c._id === it.landing!.cityId)
            ).length;
            return {
              id: it.landing!.cityId!,
              cityName: it.landing!.cityName ?? '',
              note: it.note,
              countLabel: t('cityTourCount', { count }),
              href: `/${it.landing!.slug}`,
            };
          }),
      }
    : undefined;

  // ── Foot band ──
  const journalItems: WeaveItem[] = recentArticles.slice(0, 3).map((a) => ({
    id: a._id,
    title: a.title,
    kicker: a.category?.name,
    href: `/blog/${a.slug}`,
  }));

  const breadcrumbItems = [
    { label: tNav('home'), href: '/' },
    { label: t('breadcrumb') },
  ];

  return (
    <ArchiveTemplate
      locale={locale as Locale}
      breadcrumbItems={breadcrumbItems}
      header={{
        kicker: archive?.kicker,
        title: archive?.title ?? t('landingTitle'),
        tagline: archive?.tagline ?? t('landingDeck'),
      }}
      essay={archive?.essay ? { heading: archive.essayHeading, body: archive.essay } : undefined}
      featured={featured}
      collections={collections}
      navigator={navigator}
      index={{
        items: indexItems,
        filters,
        labels: {
          kicker: tArchive('theIndex'),
          title: t('indexTitle'),
          intro: t('indexIntro'),
          all: tArchive('all'),
          empty: tArchive('emptyState'),
        },
      }}
      itemNoun={t('itemNoun')}
      collectionKicker={(n) => tArchive('collectionLabel', { number: n })}
      conciergeContextLabel={t('conciergeAboutDay')}
      footBand={{
        inSeasonLabel: t('footInSeasonLabel'),
        inSeasonBody: t('footInSeasonBody'),
        journalLabel: t('footJournalLabel'),
        journalItems,
        practicalLabel: t('footPracticalLabel'),
        practicalBody: t('footPracticalBody'),
      }}
    />
  );
}
