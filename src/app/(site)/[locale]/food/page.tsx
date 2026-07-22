import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { foodHubQuery, foodArticlesForHubQuery, recentFoodQuery } from '@/sanity/lib/queries';
import { buildStaticMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/structured-data';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArchiveHeader } from '@/components/archive/ArchiveHeader';
import { ArchiveEssay } from '@/components/archive/ArchiveEssay';
import { FoodRegionBands, type FoodBand } from '@/components/food/FoodRegionBands';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import { ArticleFootBand, type WeaveItem } from '@/components/ArticleConnective';
import type { ArchiveItem } from '@/components/archive/types';

interface Props {
  params: Promise<{ locale: string }>;
}

// Geographic bands render in journey order; all-egypt is the quiet closing band.
const GEOGRAPHIC_REGIONS = ['cairo', 'alexandria-coast', 'nile-south', 'oases-sinai'] as const;
const QUIET_REGION = 'all-egypt';

interface FoodCard {
  _id: string;
  title: string;
  slug: string;
  deck?: string;
  format: string;
  region: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
}
interface HubDoc {
  kicker?: string;
  title?: string;
  tagline?: string;
  essayHeading?: string;
  essay?: unknown;
  publishedLocales?: string[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'food' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/food',
    title: t('hubTitle'),
    description: t('hubTagline'),
  });
}

export default async function FoodHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('food');
  const tNav = await getTranslations('nav');

  const hub = await client.fetch<HubDoc | null>(foodHubQuery, { locale });

  // Localized hub shells activate per publishedLocales; until a locale is live,
  // its hub falls back to the EN collection (never an empty localized shell).
  const publishedLocales = hub?.publishedLocales ?? ['en'];
  const hubLocale = locale === 'en' || publishedLocales.includes(locale) ? locale : 'en';

  const [articles, recent] = await Promise.all([
    client.fetch<FoodCard[]>(foodArticlesForHubQuery, { locale: hubLocale }),
    client.fetch<Array<{ _id: string; title: string; slug: string; format: string }>>(recentFoodQuery, {
      locale: hubLocale,
      excludeSlug: '',
    }),
  ]);

  const formatLabel = (f: string): string =>
    ({
      biography: t('formatBiography'),
      generations: t('formatGenerations'),
      route: t('formatRoute'),
      practical: t('formatPractical'),
    })[f] ?? f;

  const toItem = (a: FoodCard): ArchiveItem => ({
    _id: a._id,
    title: a.title,
    href: `/food/${a.slug}`,
    summary: a.deck,
    image: a.heroImage ?? null,
    facets: [{ key: 'format', value: a.format, label: formatLabel(a.format), render: 'text' }],
  });

  // ── Build bands (empty bands are dropped — no placeholders) ──
  const bands: FoodBand[] = [];
  for (const region of GEOGRAPHIC_REGIONS) {
    const items = articles.filter((a) => a.region === region).map(toItem);
    if (items.length) {
      bands.push({ key: region, label: t(`regions.${region}`), items });
    }
  }
  const quietItems = articles.filter((a) => a.region === QUIET_REGION).map(toItem);
  if (quietItems.length) {
    bands.push({
      key: QUIET_REGION,
      eyebrow: t('practicalEyebrow'),
      label: t(`regions.${QUIET_REGION}`),
      items: quietItems,
      quiet: true,
    });
  }

  const breadcrumbItems = [{ label: tNav('home'), href: '/' }, { label: t('breadcrumb') }];
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: tNav('home'), path: '/' },
      { name: t('breadcrumb'), path: '/food' },
    ],
    locale as Locale,
  );

  const journalItems: WeaveItem[] = recent.map((a) => ({
    id: a._id,
    title: a.title,
    kicker: formatLabel(a.format),
    href: `/food/${a.slug}`,
  }));

  const CONTAINER = 'mx-auto max-w-7xl px-6';

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className={CONTAINER}>
        <Breadcrumb items={breadcrumbItems} className="pt-8" />
        <ArchiveHeader
          kicker={hub?.kicker ?? t('hubKicker')}
          title={hub?.title ?? t('hubTitle')}
          tagline={hub?.tagline ?? t('hubTagline')}
        />
      </div>

      {hub?.essay ? (
        <div className={CONTAINER}>
          <ArchiveEssay heading={hub.essayHeading} body={hub.essay} locale={locale as Locale} />
        </div>
      ) : null}

      {bands.length > 0 && (
        <div className={CONTAINER}>
          <FoodRegionBands bands={bands} />
        </div>
      )}

      <ConciergeCTA chatEnabled={isChatEnabled()} variant="compact" contextLabel={t('conciergeAboutFood')} />
      <ArticleFootBand
        inSeasonLabel={t('footInSeasonLabel')}
        inSeasonBody={t('footInSeasonBody')}
        journalLabel={t('footJournalLabel')}
        journalItems={journalItems}
        practicalLabel={t('footPracticalLabel')}
        practicalBody={t('footPracticalBody')}
      />
      <FloatingConcierge />
    </>
  );
}
