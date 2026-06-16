import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { buildStaticMetadata } from '@/lib/seo';
import { client } from '@/sanity/lib/client';
import { allTreeDeitiesQuery } from '@/sanity/lib/queries';
import {
  FieldGuideShell,
  FieldMasthead,
} from '@/components/resources';
import {
  EgyptianGodsTree,
  EgyptianGodsTreeMobile,
  type DeityNode,
  type TreeRole,
} from '@/components/resources/EgyptianGodsTree';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'resources.egyptianGods',
  });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/resources/egyptian-gods',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

const ROLE_KEYS: TreeRole[] = [
  'primordial',
  'firstGeneration',
  'secondGeneration',
  'thirdGeneration',
  'fourthGeneration',
  'solarChild',
  'alternateCreator',
  'independent',
  'folkDeity',
  'experimental',
];

export default async function EgyptianGodsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('resources.egyptianGods');

  const deities = await client.fetch<DeityNode[]>(
    allTreeDeitiesQuery(locale as Locale)
  );

  const roleLabels = Object.fromEntries(
    ROLE_KEYS.map((k) => [k, t(`roles.${k}`)])
  ) as Record<TreeRole, string>;

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

      <section className="egt-intro">
        <p>{t('intro')}</p>
      </section>

      {/* Desktop SVG — hidden below the small-screen breakpoint */}
      <div className="egt-desktop">
        <EgyptianGodsTree
          deities={deities}
          beyondEnneadLabel={t('beyondEnnead')}
        />
      </div>

      {/* Mobile vertical stack — hidden above the small-screen breakpoint */}
      <div className="egt-mobile">
        <EgyptianGodsTreeMobile deities={deities} roleLabels={roleLabels} />
      </div>

      <section className="egt-outro">
        <p>{t('closing')}</p>
      </section>

      <footer className="egt-colophon">
        <span className="fg-wordmark">
          Travel<span>2</span>Egypt
        </span>
        <p>{t('colophonNote')}</p>
      </footer>
    </FieldGuideShell>
  );
}
