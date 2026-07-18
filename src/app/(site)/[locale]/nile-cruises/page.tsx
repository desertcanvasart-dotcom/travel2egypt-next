import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  allCruisesQuery,
  nileCruisesArchiveQuery,
  articlesByLanguageQuery,
} from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/structured-data';
import { ArchiveTemplate } from '@/components/archive/ArchiveTemplate';
import type {
  ArchiveItem,
  ArchiveCollection,
  FacetFilterGroup,
  ItemFacet,
  CollectionVariant,
} from '@/components/archive/types';
import type { WeaveItem } from '@/components/ArticleConnective';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nileCruises' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/nile-cruises',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

interface RawCruise {
  _id: string;
  name: string;
  slug: string;
  summary?: string;
  type?: string;
  cruiseRoute?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

interface ArchiveDoc {
  kicker?: string;
  title?: string;
  tagline?: string;
  essayHeading?: string;
  essay?: unknown;
  featured?: { dek?: string; body?: unknown; cruise?: RawCruise | null } | null;
  collections?: Array<{
    kicker?: string;
    title?: string;
    intro?: string;
    variant?: string;
    cruises?: RawCruise[];
  }>;
}

/**
 * Vessel + route are derived (the schema has clean `type` but no direction
 * fields). Lake Nasser is treated as a ROUTE, not a vessel, so cards read
 * "Ship · Lake Nasser" rather than duplicating. Nights are intentionally not a
 * facet here — durationNights is unpopulated and these docs are vessel
 * profiles, not fixed-length sailings (see archive README).
 */
function isLakeNasser(c: RawCruise): boolean {
  return c.cruiseRoute === 'lake-nasser' || /nasser/i.test(c.name ?? '');
}
function deriveVessel(c: RawCruise): string {
  if (/steam|sudan/i.test(c.name ?? '')) return 'steamer';
  if (c.type === 'dahabiya') return 'dahabiya';
  return 'ship';
}

const VESSEL_ORDER = ['dahabiya', 'ship', 'steamer'] as const;
const ROUTE_ORDER = ['nile', 'lake-nasser'] as const;

export default async function NileCruisesArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('nileCruises');
  const tArchive = await getTranslations('archive');
  const tNav = await getTranslations('nav');

  const [archive, cruises, recentArticles] = await Promise.all([
    client.fetch<ArchiveDoc | null>(nileCruisesArchiveQuery(locale as Locale)),
    client.fetch<RawCruise[]>(allCruisesQuery(locale as Locale)),
    client.fetch<
      Array<{ _id: string; title: string; slug: string; category?: { name?: string } | null }>
    >(articlesByLanguageQuery, { locale }),
  ]);

  const vesselLabel = (key: string): string => {
    switch (key) {
      case 'dahabiya':
        return t('vesselDahabiya');
      case 'steamer':
        return t('vesselSteamer');
      default:
        return t('vesselShip');
    }
  };
  const routeLabel = (key: string): string =>
    key === 'lake-nasser' ? t('routeLakeNasser') : t('routeNile');

  const toItem = (c: RawCruise): ArchiveItem => {
    const vessel = deriveVessel(c);
    const route = isLakeNasser(c) ? 'lake-nasser' : 'nile';
    const facets: ItemFacet[] = [
      { key: 'vessel', value: vessel, label: vesselLabel(vessel), render: 'badge' },
      { key: 'route', value: route, label: routeLabel(route), render: 'text' },
    ];
    return {
      _id: c._id,
      title: c.name,
      href: `/nile-cruises/${c.slug}`,
      summary: c.summary,
      image: c.heroImage ?? null,
      facets,
    };
  };

  const indexItems = cruises.map(toItem);

  // ── Facets: vessel + route, both exact (present values only) ──
  const presentVessels = VESSEL_ORDER.filter((v) => cruises.some((c) => deriveVessel(c) === v));
  const presentRoutes = ROUTE_ORDER.filter((r) =>
    cruises.some((c) => (isLakeNasser(c) ? 'lake-nasser' : 'nile') === r)
  );
  const filters: FacetFilterGroup[] = [
    {
      key: 'vessel',
      paramKey: 'vessel',
      label: t('filterVessel'),
      options: presentVessels.map((v) => ({ value: v, label: vesselLabel(v) })),
    },
    {
      key: 'route',
      paramKey: 'route',
      label: t('filterRoute'),
      options: presentRoutes.map((r) => ({ value: r, label: routeLabel(r) })),
    },
  ];

  // ── Featured ──
  const featured = archive?.featured?.cruise
    ? {
        kicker: t('featuredKicker'),
        item: toItem(archive.featured.cruise),
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
      items: (c.cruises ?? []).map(toItem),
    }))
    .filter((c) => c.title && c.items.length > 0);

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
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: t('breadcrumb'), path: '/nile-cruises' },
    ],
    locale as Locale,
  );

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <ArchiveTemplate
        locale={locale as Locale}
        breadcrumbItems={breadcrumbItems}
        header={{
          kicker: archive?.kicker,
          title: archive?.title ?? t('landingTitle'),
          tagline: archive?.tagline ?? t('landingDeck'),
          stats: [
            { label: t('statCruises'), value: cruises.length },
            { label: t('statVessels'), value: presentVessels.length },
            { label: t('statRoutes'), value: presentRoutes.length },
          ],
        }}
        essay={archive?.essay ? { heading: archive.essayHeading, body: archive.essay } : undefined}
        featured={featured}
        collections={collections}
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
        conciergeContextLabel={t('conciergeAboutCruise')}
        footBand={{
          inSeasonLabel: t('footInSeasonLabel'),
          inSeasonBody: t('footInSeasonBody'),
          journalLabel: t('footJournalLabel'),
          journalItems,
          practicalLabel: t('footPracticalLabel'),
          practicalBody: t('footPracticalBody'),
        }}
      />
    </>
  );
}
