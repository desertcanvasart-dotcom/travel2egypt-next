import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { buildStaticMetadata } from '@/lib/seo';
import {
  FieldGuideShell,
  FieldMasthead,
  FieldReveal,
} from '@/components/resources';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resources' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/resources',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

/**
 * The published guides, in stable issue order. Each guide is its own
 * route under /resources. Add new ones here as they ship; the index
 * auto-renders them in this order. Placeholder slots after the live
 * entries communicate "more coming" with the same editorial register
 * rather than just truncating the grid.
 */
const PUBLISHED_GUIDES = [
  {
    slug: 'pyramids-decoded',
    number: '01',
    regionKey: 'pyramidsRegion',
    titleKey: 'pyramidsTitle',
    titleAccentKey: 'pyramidsTitleAccent',
    deckKey: 'pyramidsDeck',
  },
] as const;

const PLACEHOLDER_COUNT = 5;

export default async function ResourcesIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('resources');

  return (
    <FieldGuideShell>
      <FieldMasthead
        number={t('indexNumber')}
        region={t('indexRegion')}
        tagSummary={t('indexTagSummary')}
        title={
          <>
            {t('indexTitlePrefix')} <em>{t('indexTitleAccent')}</em>
          </>
        }
        standfirst={
          <>
            {t('indexStandfirst')} <em>{t('indexStandfirstAccent')}</em>
          </>
        }
      />

      <FieldReveal>
        <section className="fg-index">
          <div className="fg-index__list">
            {PUBLISHED_GUIDES.map((g) => {
              const title = t(g.titleKey);
              const accent = t(g.titleAccentKey);
              return (
                <Link
                  key={g.slug}
                  href={`/resources/${g.slug}`}
                  className="fg-index__item"
                >
                  <div className="fg-index__head">
                    <span className="fg-index__num">{g.number}</span>
                    <span className="fg-index__region">{t(g.regionKey)}</span>
                  </div>
                  <h2 className="fg-index__title">
                    {title} <em>{accent}</em>
                  </h2>
                  <p className="fg-index__deck">{t(g.deckKey)}</p>
                  <span className="fg-index__cta">{t('open')} →</span>
                </Link>
              );
            })}
            {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => {
              const issueNo = String(
                PUBLISHED_GUIDES.length + i + 1,
              ).padStart(2, '0');
              return (
                <div
                  key={`placeholder-${i}`}
                  className="fg-index__item fg-index__item--coming"
                  aria-hidden="true"
                >
                  <div className="fg-index__head">
                    <span className="fg-index__num">{issueNo}</span>
                    <span className="fg-index__region">{t('comingSoon')}</span>
                  </div>
                  <p className="fg-index__placeholder">{t('inDrafting')}</p>
                </div>
              );
            })}
          </div>
        </section>
      </FieldReveal>
    </FieldGuideShell>
  );
}
