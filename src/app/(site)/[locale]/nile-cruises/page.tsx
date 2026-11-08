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
import { NileCruisePlanBlock } from '@/components/nile-cruises/NileCruisePlanBlock';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { whatsappUrl } from '@/lib/concierge/constants';

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
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

interface RawCruise {
  _id: string;
  name: string;
  slug: string;
  summary?: string;
  type?: string;
  cruiseRoute?: string;
  poweredBy?: string[] | null;
  durationNights?: number | null;
  departureCityName?: string | null;
  returnCityName?: string | null;
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
 * Nile Cruises rebuild (2026-11-08): this page covers only the three kinds of
 * Nile boat. Everything is data-driven:
 *  - Lake Nasser = cruiseRoute "lake-nasser" → excluded everywhere (counters,
 *    collections, featured, index, filters). The product pages stay live.
 *  - Steamer = poweredBy includes "steam"; dahabiya = type "dahabiya"; every
 *    other engine boat (cruise ship, yacht) counts as a cruise ship.
 * There is no route filter: with Lake Nasser gone every boat is "Nile", and
 * no product carries a sailing stretch yet (departure/return city are empty).
 */
function isLakeNasser(c: RawCruise): boolean {
  return c.cruiseRoute === 'lake-nasser';
}
function deriveVessel(c: RawCruise): Vessel {
  if (c.poweredBy?.includes('steam')) return 'steamer';
  if (c.type === 'dahabiya') return 'dahabiya';
  return 'ship';
}

const VESSEL_ORDER = ['dahabiya', 'ship', 'steamer'] as const;
type Vessel = (typeof VESSEL_ORDER)[number];
/** Section ids: #dahabiyas and #cruise-ships are linked from the homepage. */
const VESSEL_ANCHOR: Record<Vessel, string> = {
  dahabiya: 'dahabiyas',
  ship: 'cruise-ships',
  steamer: 'steamers',
};

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
  const tConcierge = await getTranslations('concierge');

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
  // "3 nights · Aswan → Luxor" — product data only; missing parts are
  // dropped with their separator. Nile cruise products have no price field,
  // so no "from $…" part can be shown until one exists.
  const detailFor = (c: RawCruise): string | undefined => {
    const parts: string[] = [];
    if (typeof c.durationNights === 'number' && c.durationNights > 0) {
      parts.push(t('nights', { count: c.durationNights }));
    }
    if (c.departureCityName && c.returnCityName && c.departureCityName !== c.returnCityName) {
      parts.push(`${c.departureCityName} → ${c.returnCityName}`);
    }
    return parts.length ? parts.join(' · ') : undefined;
  };

  const toItem = (c: RawCruise): ArchiveItem => {
    const vessel = deriveVessel(c);
    const facets: ItemFacet[] = [
      { key: 'vessel', value: vessel, label: vesselLabel(vessel), render: 'badge' },
      { key: 'route', value: 'nile', label: t('routeNile'), render: 'text' },
    ];
    return {
      _id: c._id,
      title: c.name,
      href: `/nile-cruises/${c.slug}`,
      summary: c.summary,
      image: c.heroImage ?? null,
      facets,
      detail: detailFor(c),
    };
  };

  const nileCruises = cruises.filter((c) => !isLakeNasser(c));
  const indexItems = nileCruises.map(toItem);
  const countOf = (v: Vessel) => nileCruises.filter((c) => deriveVessel(c) === v).length;

  // ── Facet: kind of boat (?vessel=dahabiya|ship|steamer) ──
  const presentVessels = VESSEL_ORDER.filter((v) => countOf(v) > 0);
  const filters: FacetFilterGroup[] = [
    {
      key: 'vessel',
      paramKey: 'vessel',
      label: t('filterVessel'),
      options: presentVessels.map((v) => ({ value: v, label: vesselLabel(v) })),
    },
  ];

  // ── Featured ──
  const featured = archive?.featured?.cruise && !isLakeNasser(archive.featured.cruise)
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
      items: (c.cruises ?? []).filter((x) => x && !isLakeNasser(x)).map(toItem),
      // A single-kind collection carries that kind's anchor (#dahabiyas …).
      anchorId: (() => {
        const kinds = new Set((c.cruises ?? []).filter((x) => x && !isLakeNasser(x)).map(deriveVessel));
        return kinds.size === 1 ? VESSEL_ANCHOR[[...kinds][0]] : undefined;
      })(),
    }))
    .filter((c) => c.title && c.items.length > 0);
  // An id may appear once: only the first collection of a kind keeps it.
  const seenAnchors = new Set<string>();
  for (const c of collections) {
    if (c.anchorId && seenAnchors.has(c.anchorId)) c.anchorId = undefined;
    else if (c.anchorId) seenAnchors.add(c.anchorId);
  }
  // Any kind without a collection still gets its id, just above the index.
  const indexAnchors = presentVessels.map((v) => VESSEL_ANCHOR[v]).filter((id) => !seenAnchors.has(id));

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
        // #dahabiyas / #cruise-ships / #steamers sit on their collections;
        // homepage links add ?vessel=… so the index below is pre-filtered.
        indexAnchors={indexAnchors}
        breadcrumbItems={breadcrumbItems}
        header={{
          kicker: archive?.kicker,
          title: archive?.title ?? t('landingTitle'),
          tagline: archive?.tagline ?? t('landingDeck'),
          stats: [
            { label: t('statShips'), value: countOf('ship') },
            { label: t('statDahabiyas'), value: countOf('dahabiya') },
            { label: t('statSteamers'), value: countOf('steamer') },
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
        itemCountLabel={(n) => t('itemCount', { count: n })}
        collectionKicker={(n) => tArchive('collectionLabel', { number: n })}
        conciergeContextLabel={t('conciergeAboutCruise')}
        closing={
          <NileCruisePlanBlock
            eyebrow={tConcierge('eyebrow')}
            heading={t('planHeading')}
            bodyLead={t('planBodyLead')}
            primaryLabel={t('planPrimary')}
            secondaryLabel={t('planSecondary')}
            whatsappHref={whatsappUrl(t('planWhatsapp'))}
            conciergeLabel={t('planConcierge')}
            conciergeHref={isChatEnabled() ? '/plan-your-tour' : '/contact'}
            note={t('planNote')}
            vesselLabels={{ dahabiya: vesselLabel('dahabiya'), ship: vesselLabel('ship'), steamer: vesselLabel('steamer') }}
          />
        }
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
