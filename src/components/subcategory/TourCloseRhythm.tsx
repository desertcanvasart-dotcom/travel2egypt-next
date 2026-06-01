import { getTranslations } from 'next-intl/server';

import { client } from '@/sanity/lib/client';
import {
  siblingDayToursQuery,
  otherTrackLandingSlugQuery,
  articlesByLanguageQuery,
} from '@/sanity/lib/queries';
import { buildCityCrossLinks } from '@/lib/cross-links';
import type { Locale } from '@/i18n/routing';
import {
  ArticleRelatedWeave,
  ArticleFootBand,
  type WeaveColumn,
  type WeaveItem,
} from '@/components/ArticleConnective';
import { FloatingConcierge } from '@/components/FloatingConcierge';

interface TourLike {
  _id: string;
  type?: string;
  tourMode?: string;
  cities?: Array<{ _id: string; name: string; slug: string }>;
}

const OTHER_TRACK: Record<string, string> = {
  private: 'group-day-tour',
  group: 'private-day-tour',
};

/**
 * The article archetype's closing rhythm for a single DAY tour, rendered after
 * TourPageView's concierge CTA: a related weave (more days in this city/track)
 * + the foot band (in-season / journal / city cross-links) + floating
 * concierge. Reuses the cross-link helper from the subcategory build. Renders
 * nothing for non-day-tours or tours with no city (packages get this later).
 */
export async function TourCloseRhythm({ tour, locale }: { tour: TourLike; locale: Locale }) {
  const city = tour.cities?.[0];
  if (tour.type !== 'dayTour' || !city?.slug || !tour.tourMode) return null;

  const t = await getTranslations('subcategory');

  const isGroup = tour.tourMode === 'group';
  const trackWord = isGroup ? t('trackWordGroup') : t('trackWordPrivate');

  const [siblings, other, recent] = await Promise.all([
    client.fetch<Array<{ _id: string; title: string; slug: string; summary?: string }>>(
      siblingDayToursQuery(locale),
      { mode: tour.tourMode, cityId: city._id, excludeId: tour._id }
    ),
    OTHER_TRACK[tour.tourMode]
      ? client.fetch<{ slug?: string } | null>(otherTrackLandingSlugQuery(locale), {
          otherKey: OTHER_TRACK[tour.tourMode],
          cityId: city._id,
        })
      : Promise.resolve(null),
    client.fetch<
      Array<{ _id: string; title: string; slug: string; category?: { name?: string } | null }>
    >(articlesByLanguageQuery, { locale }),
  ]);

  const weaveColumns: WeaveColumn[] = [
    {
      heading: t('moreTrackDaysIn', { track: trackWord, city: city.name }),
      items: siblings.map((s) => ({
        id: s._id,
        title: s.title,
        note: s.summary,
        href: `/${s.slug}`,
      })),
    },
  ];

  const crossLinks = buildCityCrossLinks({
    citySlug: city.slug,
    cityGuideTitle: t('crosslinkCityGuide', { city: city.name }),
    cityGuideKicker: t('crosslinkGuideKicker'),
    hotelsTitle: t('crosslinkHotels', { city: city.name }),
    hotelsKicker: t('crosslinkHotelsKicker'),
    otherTrack: other?.slug
      ? {
          slug: other.slug,
          title: isGroup
            ? t('crosslinkOtherPrivate', { city: city.name })
            : t('crosslinkOtherGroup', { city: city.name }),
          kicker: t('crosslinkOtherKicker'),
        }
      : undefined,
  });

  const journalItems: WeaveItem[] = recent.slice(0, 3).map((a) => ({
    id: a._id,
    title: a.title,
    kicker: a.category?.name,
    href: `/blog/${a.slug}`,
  }));

  return (
    <>
      <ArticleRelatedWeave columns={weaveColumns} />
      <ArticleFootBand
        inSeasonLabel={t('footInSeasonLabel')}
        inSeasonBody={t('footInSeasonBody')}
        journalLabel={t('footJournalLabel')}
        journalItems={journalItems}
        practicalLabel={t('aroundCity', { city: city.name })}
        practicalItems={crossLinks}
      />
      <FloatingConcierge />
    </>
  );
}
