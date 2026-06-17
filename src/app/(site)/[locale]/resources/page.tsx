import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { buildStaticMetadata } from '@/lib/seo';
import { FieldGuideShell, FieldMasthead } from '@/components/resources';

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
 * Field Guide table of contents — magazine-style vertical list, NOT a
 * card grid. Each entry is a substantial editorial block (region eyebrow,
 * title, deck, status) separated by hairline rules. Live guides link;
 * drafting entries show an italic "In drafting" label and are inert.
 *
 * Add new entries here as they ship. The Egyptian Gods page is
 * deliberately omitted — it's paused at Phase 1 and not surfaced yet.
 */
type IndexEntry = {
  number: string;
  status: 'open' | 'drafting';
  regionKey: string | null;
  titleKey: string | null;
  titleAccentKey: string | null;
  deckKey: string;
  slug: string | null;
};

const ENTRIES: IndexEntry[] = [
  {
    number: '01',
    status: 'open',
    regionKey: 'pyramidsRegion',
    titleKey: 'pyramidsTitle',
    titleAccentKey: 'pyramidsTitleAccent',
    deckKey: 'pyramidsDeck',
    slug: 'pyramids-decoded',
  },
  // Five placeholder slots — surfacing the planned arc without
  // committing to titles or topics yet. Phase 2 replaces these in order
  // as guides ship.
  {
    number: '02',
    status: 'drafting',
    regionKey: null,
    titleKey: null,
    titleAccentKey: null,
    deckKey: 'inDrafting',
    slug: null,
  },
  {
    number: '03',
    status: 'drafting',
    regionKey: null,
    titleKey: null,
    titleAccentKey: null,
    deckKey: 'inDrafting',
    slug: null,
  },
  {
    number: '04',
    status: 'drafting',
    regionKey: null,
    titleKey: null,
    titleAccentKey: null,
    deckKey: 'inDrafting',
    slug: null,
  },
  {
    number: '05',
    status: 'drafting',
    regionKey: null,
    titleKey: null,
    titleAccentKey: null,
    deckKey: 'inDrafting',
    slug: null,
  },
  {
    number: '06',
    status: 'drafting',
    regionKey: null,
    titleKey: null,
    titleAccentKey: null,
    deckKey: 'inDrafting',
    slug: null,
  },
];

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
        wordmarkSuffix={t('wordmarkPlural')}
        title={t('indexTitle')}
        standfirst={t('indexStandfirst')}
      />

      <p className="fg-toc__subhead">{t('indexSubhead')}</p>

      <ol className="fg-toc">
        {ENTRIES.map((entry) => {
          const isOpen = entry.status === 'open';
          return (
            <li
              key={entry.number}
              className={
                isOpen ? 'fg-toc__entry' : 'fg-toc__entry fg-toc__entry--drafting'
              }
            >
              <div className="fg-toc__num">{entry.number}</div>
              <div className="fg-toc__content">
                {entry.regionKey ? (
                  <p className="fg-toc__region">{t(entry.regionKey)}</p>
                ) : null}
                {entry.titleKey ? (
                  <h2 className="fg-toc__title">
                    {entry.titleAccentKey ? (
                      <>
                        {t(entry.titleKey)}{' '}
                        <em>{t(entry.titleAccentKey)}</em>
                      </>
                    ) : (
                      t(entry.titleKey)
                    )}
                  </h2>
                ) : null}
                <p
                  className={
                    isOpen
                      ? 'fg-toc__deck'
                      : 'fg-toc__deck fg-toc__deck--drafting'
                  }
                >
                  {t(entry.deckKey)}
                </p>
              </div>
              <div className="fg-toc__status">
                {isOpen && entry.slug ? (
                  <Link
                    href={`/resources/${entry.slug}`}
                    className="fg-toc__open"
                  >
                    {t('open')} →
                  </Link>
                ) : (
                  <span className="fg-toc__drafting">{t('drafting')}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="fg-toc-colophon">
        <span className="fg-wordmark">
          Travel<span>2</span>Egypt
        </span>
        <p>{t('indexColophon')}</p>
      </footer>
    </FieldGuideShell>
  );
}
