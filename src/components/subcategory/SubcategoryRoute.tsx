import { getTranslations } from 'next-intl/server';

import { client } from '@/sanity/lib/client';
import { otherTrackLandingSlugQuery, articlesByLanguageQuery } from '@/sanity/lib/queries';
import { buildCityCrossLinks } from '@/lib/cross-links';
import type { Locale } from '@/i18n/routing';
import type { ArchiveItem, ItemFacet } from '@/components/archive/types';
import type { WeaveItem } from '@/components/ArticleConnective';

import { SubcategoryTemplate } from './SubcategoryTemplate';

interface RawTour {
  _id: string;
  type?: string;
  tourMode?: string;
  durationDays?: number;
  title: string;
  slug: string;
  summary?: string;
  durationLabel?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

export interface SubcategoryLandingDoc {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  intro?: unknown;
  ctaContext?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  category?: { key?: string; title?: string; slug?: string } | null;
  destinationCity?: {
    _id: string;
    name: string;
    slug: string;
    heroImage?: { asset?: unknown; alt?: string } | null;
  } | null;
  tours?: RawTour[];
}

const TRACKS = {
  'private-day-tour': { other: 'group-day-tour' },
  'group-day-tour': { other: 'private-day-tour' },
} as const;

/**
 * Async wrapper: resolves a day-tour `tourLanding` doc into SubcategoryTemplate
 * props — maps the scoped tours to ArchiveItems, builds the contextual CTA,
 * cross-links (city guide / hotels / other track), and the foot band. Rendered
 * by the [...rest] catch-all for day-tour landings.
 */
export async function SubcategoryRoute({
  doc,
  locale,
}: {
  doc: SubcategoryLandingDoc;
  locale: Locale;
}) {
  const t = await getTranslations('subcategory');
  const tNav = await getTranslations('nav');

  const trackKey = (doc.category?.key ?? 'private-day-tour') as keyof typeof TRACKS;
  const isGroup = trackKey === 'group-day-tour';
  const trackLabel = isGroup ? t('trackGroup') : t('trackPrivate');
  const trackWord = isGroup ? t('trackWordGroup') : t('trackWordPrivate');
  const cityName = doc.destinationCity?.name ?? '';
  const citySlug = doc.destinationCity?.slug ?? '';

  const tours = doc.tours ?? [];
  const items: ArchiveItem[] = tours
    .filter((tr) => tr.slug)
    .map((tr) => {
      const facets: ItemFacet[] = [];
      const duration =
        tr.durationLabel ||
        (tr.durationDays ? t('dayCount', { count: tr.durationDays }) : '');
      if (duration) facets.push({ key: 'duration', value: duration, label: duration, render: 'badge' });
      facets.push({ key: 'track', value: trackKey, label: trackLabel, render: 'text' });
      return {
        _id: tr._id,
        title: tr.title,
        href: `/${tr.slug}`,
        summary: tr.summary,
        image: tr.heroImage ?? null,
        facets,
      };
    });

  // Other-track landing (private ↔ group) for the cross-links.
  const otherKey = TRACKS[trackKey]?.other;
  const other =
    otherKey && doc.destinationCity?._id
      ? await client.fetch<{ slug?: string } | null>(otherTrackLandingSlugQuery(locale), {
          otherKey,
          cityId: doc.destinationCity._id,
        })
      : null;

  const crossLinks = buildCityCrossLinks({
    citySlug,
    cityGuideTitle: t('crosslinkCityGuide', { city: cityName }),
    cityGuideKicker: t('crosslinkGuideKicker'),
    hotelsTitle: t('crosslinkHotels', { city: cityName }),
    hotelsKicker: t('crosslinkHotelsKicker'),
    otherTrack: other?.slug
      ? {
          slug: other.slug,
          title: isGroup
            ? t('crosslinkOtherPrivate', { city: cityName })
            : t('crosslinkOtherGroup', { city: cityName }),
          kicker: t('crosslinkOtherKicker'),
        }
      : undefined,
  });

  // Recent journal for the foot band's middle column.
  const recent = await client.fetch<
    Array<{ _id: string; title: string; slug: string; category?: { name?: string } | null }>
  >(articlesByLanguageQuery, { locale });
  const journalItems: WeaveItem[] = recent.slice(0, 3).map((a) => ({
    id: a._id,
    title: a.title,
    kicker: a.category?.name,
    href: `/blog/${a.slug}`,
  }));

  // Breadcrumb: Home / Day Tours / {track} / {city}.
  const breadcrumbItems = [
    { label: tNav('home'), href: '/' },
    { label: t('breadcrumbDayTours'), href: '/private-day-tours' },
    { label: trackLabel },
    { label: cityName },
  ];

  // "All {city} tours" → the private archive filtered by city (group archive
  // doesn't exist yet; this page already lists every group tour for the city).
  const allLink = !isGroup && citySlug
    ? { label: t('allCityTours', { city: cityName }), href: `/private-day-tours?city=${citySlug}` }
    : undefined;

  return (
    <SubcategoryTemplate
      locale={locale}
      hero={{
        // Landing's own hero, else fall back to the destination city's hero
        // (every city has one) so the page is never image-less.
        image: doc.heroImage ?? doc.destinationCity?.heroImage ?? null,
        kicker: isGroup ? t('heroKickerGroup') : t('heroKickerPrivate'),
        kickerHref: '/private-day-tours',
        title: doc.title,
      }}
      breadcrumbItems={breadcrumbItems}
      dek={doc.summary}
      essayBody={doc.intro}
      scopedHeading={t('scopedHeading', { count: items.length, track: trackWord, city: cityName })}
      allLink={allLink}
      items={items}
      conciergeContextLabel={doc.ctaContext || t('conciergeAbout', { city: cityName })}
      footBand={{
        inSeasonLabel: t('footInSeasonLabel'),
        inSeasonBody: t('footInSeasonBody'),
        journalLabel: t('footJournalLabel'),
        journalItems,
        practicalLabel: t('aroundCity', { city: cityName }),
        practicalItems: crossLinks,
      }}
    />
  );
}
