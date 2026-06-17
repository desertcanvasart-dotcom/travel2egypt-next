import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { buildStaticMetadata } from '@/lib/seo';
import {
  FieldGuideShell,
  FieldMasthead,
  PharaohTimelineSvg,
} from '@/components/resources';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'resources.timeline',
  });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/resources/pharaoh-timeline',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

/**
 * Field Guide No. 05 — "Three Thousand Years, In Order".
 *
 * Bespoke static route. The opening SVG is a one-off visual register
 * (per the `fieldGuide` schema convention — bespoke visuals stay out
 * of the prose-driven template). Editorial body uses the .fg-prose
 * family for visual continuity with the Sanity-driven guides
 * (Tipping, Cuisine) and structures pharaohs as .fg-prose__dish
 * entries.
 */

type EraKey =
  | 'old' | 'inter1' | 'middle' | 'inter2' | 'new'
  | 'inter3' | 'late' | 'ptolemaic' | 'roman';

const ERAS: Array<{ key: EraKey; pharaohs: string[]; hasOpNote: boolean; }> = [
  { key: 'old',       pharaohs: ['djoser', 'sneferu', 'khufu', 'khafre', 'menkaure'], hasOpNote: true },
  { key: 'inter1',    pharaohs: [], hasOpNote: false },
  { key: 'middle',    pharaohs: ['mentuhotep', 'senusret3', 'amenemhat3'], hasOpNote: true },
  { key: 'inter2',    pharaohs: [], hasOpNote: false },
  { key: 'new',       pharaohs: ['hatshepsut', 'thutmose3', 'akhenaten', 'tut', 'ramses'], hasOpNote: true },
  { key: 'inter3',    pharaohs: [], hasOpNote: false },
  { key: 'late',      pharaohs: [], hasOpNote: false },
  { key: 'ptolemaic', pharaohs: ['ptolemy1', 'cleopatra'], hasOpNote: true },
  { key: 'roman',     pharaohs: [], hasOpNote: false },
];

export default async function PharaohTimelinePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('resources.timeline');

  return (
    <FieldGuideShell>
      <FieldMasthead
        number={t('kicker')}
        region={t('region')}
        tagSummary={t('tagSummary')}
        title={
          <>
            {t('titlePrefix')} <em>{t('titleAccent')}</em>
          </>
        }
        standfirst={
          <>
            {t('standfirstLead')} <em>{t('standfirstAccent')}</em>
          </>
        }
      />

      <figure className="fg-timeline-figure">
        <PharaohTimelineSvg />
        <figcaption className="fg-timeline-caption">
          {t('figureCaption')}
        </figcaption>
      </figure>

      <div className="fg-prose">
        <section className="fg-prose__intro">
          <p>{t('intro1')}</p>
          <p>{t('intro2')}</p>
        </section>

        {ERAS.map((era, idx) => (
          <section
            key={era.key}
            className="fg-prose__section"
            aria-labelledby={`era-${era.key}`}
          >
            <h2 id={`era-${era.key}`} className="fg-prose__label">
              {t(`eras.${era.key}.label`)}
            </h2>
            <p className="fg-prose__body">{t(`eras.${era.key}.frame`)}</p>

            {era.pharaohs.length > 0 ? (
              <ul className="fg-prose__dishes">
                {era.pharaohs.map((p) => (
                  <li key={p} className="fg-prose__dish">
                    <h3 className="fg-prose__dish-name">
                      {t(`pharaohs.${p}.name`)}
                    </h3>
                    <p className="fg-prose__dish-dates">
                      {t(`pharaohs.${p}.dates`)}
                    </p>
                    <p className="fg-prose__dish-desc">
                      {t(`pharaohs.${p}.body`)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            {era.hasOpNote ? (
              <aside className="fg-prose__op-note">
                {t(`eras.${era.key}.op`)}
              </aside>
            ) : null}
          </section>
        ))}

        <section className="fg-prose__closing">
          <p>{t('closing')}</p>
        </section>

        <footer className="fg-prose__colophon">
          <span className="fg-wordmark">
            Travel<span>2</span>Egypt
          </span>
          <p>{t('colophonNote')}</p>
        </footer>
      </div>
    </FieldGuideShell>
  );
}
