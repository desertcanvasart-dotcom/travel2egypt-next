import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import {
  allHotelsQuery,
  hotelsArchiveQuery,
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
  const t = await getTranslations({ locale, namespace: 'hotels' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/hotels',
    title: t('landingTitle'),
    description: t('landingDeck'),
  });
}

interface RawHotel {
  _id: string;
  name: string;
  slug: string;
  category?: 'standard' | 'deluxe' | 'luxury' | 'boutique';
  starRating?: number;
  summary?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  city?: { _id: string; name: string; slug: string } | null;
}

interface ArchiveDoc {
  kicker?: string;
  title?: string;
  tagline?: string;
  essayHeading?: string;
  essay?: unknown;
  featured?: { dek?: string; body?: unknown; hotel?: RawHotel | null } | null;
  collections?: Array<{
    kicker?: string;
    title?: string;
    intro?: string;
    variant?: string;
    hotels?: RawHotel[];
  }>;
}

const GRADE_ORDER = ['luxury', 'deluxe', 'boutique', 'standard'] as const;

export default async function HotelsArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('hotels');
  const tArchive = await getTranslations('archive');
  const tNav = await getTranslations('nav');

  const [archive, hotels, recentArticles] = await Promise.all([
    client.fetch<ArchiveDoc | null>(hotelsArchiveQuery(locale as Locale)),
    client.fetch<RawHotel[]>(allHotelsQuery(locale as Locale)),
    client.fetch<
      Array<{ _id: string; title: string; slug: string; category?: { name?: string } | null }>
    >(articlesByLanguageQuery, { locale }),
  ]);

  const gradeLabel = (cat?: string): string => {
    switch (cat) {
      case 'luxury':
        return t('categoryLuxury');
      case 'deluxe':
        return t('categoryDeluxe');
      case 'boutique':
        return t('categoryBoutique');
      case 'standard':
        return t('categoryStandard');
      default:
        return cat ?? '';
    }
  };

  const toItem = (h: RawHotel): ArchiveItem => {
    const facets: ItemFacet[] = [];
    if (h.category) {
      facets.push({ key: 'grade', value: h.category, label: gradeLabel(h.category), render: 'badge' });
    }
    if (h.starRating && h.starRating >= 1 && h.starRating <= 5) {
      facets.push({
        key: 'stars',
        value: String(Math.round(h.starRating)),
        label: '★'.repeat(Math.round(h.starRating)),
        render: 'stars',
      });
    }
    if (h.city?.slug) {
      facets.push({ key: 'city', value: h.city.slug, label: h.city.name, render: 'text' });
    }
    return {
      _id: h._id,
      title: h.name,
      href: `/hotels/${h.slug}`,
      summary: h.summary,
      image: h.heroImage ?? null,
      facets,
    };
  };

  // ── Index items + facet filter config (derived from the live set) ──
  const indexItems = hotels.map(toItem);

  const presentGrades = GRADE_ORDER.filter((g) => hotels.some((h) => h.category === g));
  const cityMap = new Map<string, string>();
  for (const h of hotels) {
    if (h.city?.slug) cityMap.set(h.city.slug, h.city.name);
  }
  const filters: FacetFilterGroup[] = [
    {
      key: 'grade',
      paramKey: 'grade',
      label: t('filterGrade'),
      options: presentGrades.map((g) => ({ value: g, label: gradeLabel(g) })),
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
  const featured =
    archive?.featured?.hotel
      ? {
          kicker: t('featuredKicker'),
          item: toItem(archive.featured.hotel),
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
      items: (c.hotels ?? []).map(toItem),
    }))
    .filter((c) => c.title && c.items.length > 0);

  // ── Foot band: recent journal + static seasonal/practical copy ──
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
      { name: t('breadcrumb'), path: '/hotels' },
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
            { label: t('statHotels'), value: hotels.length },
            { label: t('statCities'), value: cityMap.size },
            { label: t('statGrades'), value: presentGrades.length },
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
        conciergeContextLabel={t('conciergeAboutHotels')}
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
