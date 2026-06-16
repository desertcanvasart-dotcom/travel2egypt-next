import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { buildStaticMetadata } from '@/lib/seo';
import {
  FieldGuideShell,
  FieldMasthead,
  FieldAxis,
  NumberedGrid,
  SiloCard,
  ScaleStrip,
  FieldFooter,
  FieldReveal,
} from '@/components/resources';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resources.pyramids' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/resources/pyramids-decoded',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

const SVG_PROPS = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 160 120',
} as const;

const NAVY = 'var(--navy)';
const GOLD = 'var(--gold)';
const RULE_STRONG = 'var(--fg-rule-strong)';

const SILO_DJOSER = (
  <svg {...SVG_PROPS} aria-hidden="true">
    <polygon
      fill={NAVY}
      points="22,104 22,90 30,90 30,76 38,76 38,62 46,62 46,50 54,50 54,40 62,40 62,32 98,32 98,40 106,40 106,50 114,50 114,62 122,62 122,76 130,76 130,90 138,90 138,104"
    />
    <line x1="6" y1="104" x2="154" y2="104" stroke={RULE_STRONG} strokeWidth="1" />
  </svg>
);

const SILO_MEIDUM = (
  <svg {...SVG_PROPS} aria-hidden="true">
    <polygon fill={NAVY} points="10,104 30,94 48,89 112,89 130,94 150,104" />
    <polygon fill={NAVY} points="56,89 66,30 94,30 104,89" />
    <line x1="6" y1="104" x2="154" y2="104" stroke={RULE_STRONG} strokeWidth="1" />
  </svg>
);

const SILO_BENT = (
  <svg {...SVG_PROPS} aria-hidden="true">
    <polygon fill={NAVY} points="18,104 52,58 80,30 108,58 142,104" />
    <line x1="6" y1="104" x2="154" y2="104" stroke={RULE_STRONG} strokeWidth="1" />
  </svg>
);

const SILO_RED = (
  <svg {...SVG_PROPS} aria-hidden="true">
    <polygon fill={NAVY} points="14,104 80,44 146,104" />
    <line x1="6" y1="104" x2="154" y2="104" stroke={RULE_STRONG} strokeWidth="1" />
  </svg>
);

const SILO_KHUFU = (
  <svg {...SVG_PROPS} aria-hidden="true">
    <polygon fill={NAVY} points="24,104 80,16 136,104" />
    <line x1="6" y1="104" x2="154" y2="104" stroke={RULE_STRONG} strokeWidth="1" />
  </svg>
);

const SILO_KHAFRE = (
  <svg {...SVG_PROPS} aria-hidden="true">
    <polygon fill={NAVY} points="26,104 80,18 134,104" />
    <polygon fill={GOLD} points="80,18 71,33 89,33" />
    <line x1="6" y1="104" x2="154" y2="104" stroke={RULE_STRONG} strokeWidth="1" />
  </svg>
);

const SILO_MENKAURE = (
  <svg {...SVG_PROPS} aria-hidden="true">
    <polygon fill={NAVY} points="38,104 80,46 122,104" />
    <polygon fill={GOLD} points="38,104 122,104 110,88 50,88" />
    <line x1="6" y1="104" x2="154" y2="104" stroke={RULE_STRONG} strokeWidth="1" />
  </svg>
);

const SILO_HAWARA = (
  <svg {...SVG_PROPS} aria-hidden="true">
    <path
      fill={NAVY}
      d="M22,104 C40,88 48,70 70,62 C84,57 92,60 100,66 C116,76 122,90 138,104 Z"
    />
    <line x1="6" y1="104" x2="154" y2="104" stroke={RULE_STRONG} strokeWidth="1" />
  </svg>
);

const PYRAMIDS = [
  { key: 'djoser', number: 1, silo: SILO_DJOSER, tagAccent: false },
  { key: 'meidum', number: 2, silo: SILO_MEIDUM, tagAccent: false },
  { key: 'bent', number: 3, silo: SILO_BENT, tagAccent: false },
  { key: 'red', number: 4, silo: SILO_RED, tagAccent: true },
  { key: 'khufu', number: 5, silo: SILO_KHUFU, tagAccent: true },
  { key: 'khafre', number: 6, silo: SILO_KHAFRE, tagAccent: true },
  { key: 'menkaure', number: 7, silo: SILO_MENKAURE, tagAccent: true },
  { key: 'hawara', number: 8, silo: SILO_HAWARA, tagAccent: false },
] as const;

export default async function PyramidsDecodedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('resources.pyramids');

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

      <FieldAxis
        earliest={t('axisEarliest')}
        evolves={t('axisEvolves')}
        latest={t('axisLatest')}
      />

      <FieldReveal>
        <NumberedGrid>
          {PYRAMIDS.map((p) => (
            <SiloCard
              key={p.key}
              number={p.number}
              tag={t(`${p.key}.tag`)}
              tagAccent={p.tagAccent}
              silo={p.silo}
              name={t(`${p.key}.name`)}
              epithet={t(`${p.key}.epithet`)}
              meta={
                <>
                  <b>{t(`${p.key}.location`)}</b> · {t(`${p.key}.meta`)}
                </>
              }
              description={t.rich(`${p.key}.desc`, {
                gold: (chunks) => <span className="gold">{chunks}</span>,
              })}
            />
          ))}
        </NumberedGrid>

        <ScaleStrip
          heading={t('scaleHeading')}
          sub={t.rich('scaleSub', {
            which: (chunks) => <em>{chunks}</em>,
            how: (chunks) => <em>{chunks}</em>,
          })}
          unitLabel={t('scaleUnit')}
        >
          <ScaleSvg t={t} />
        </ScaleStrip>
      </FieldReveal>

      <FieldFooter
        planHeading={t('planHeading')}
        planParagraphs={[t('plan1'), t('plan2')]}
        colophon={
          <>
            {t('colophon1')}
            <br />
            {t('colophon2')}
            <br />
            {t('colophon3')}
          </>
        }
      />
    </FieldGuideShell>
  );
}

/**
 * The wide drawn-to-scale comparison. Pulls labels through `t` so locale
 * captions live in messages. Geometry is pure reference — px values copied
 * from pyramids-decoded.html section "SCALE STRIP".
 */
function ScaleSvg({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<'resources.pyramids'>>>;
}) {
  const INK_SOFT = 'var(--fg-ink-soft)';
  return (
    <svg
      viewBox="0 0 1120 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={t('scaleAriaLabel')}
    >
      <line x1="0" y1="160" x2="1120" y2="160" stroke={NAVY} strokeWidth="1.5" />

      <g>
        <polygon
          fill={NAVY}
          points="22,160 22,151 30,151 30,142 38,142 38,133 46,133 46,124 62,124 62,116 84,116 84,124 100,124 100,133 108,133 108,142 116,142 116,151 124,151 124,160"
        />
        <text x="73" y="178" textAnchor="middle" fontSize="13" fontWeight="600" fill={NAVY} style={{ fontFamily: 'var(--ui)' }}>{t('djoser.name')}</text>
        <text x="73" y="193" textAnchor="middle" fontSize="11" fill={INK_SOFT} style={{ fontFamily: 'var(--ui)' }}>{t('djoser.heightLabel')}</text>
      </g>
      <g transform="translate(150,0)">
        <polygon fill={NAVY} points="6,160 22,151 34,148 96,148 108,151 124,160" />
        <polygon fill={NAVY} points="48,148 56,85 74,85 82,148" />
        <text x="65" y="178" textAnchor="middle" fontSize="13" fontWeight="600" fill={NAVY} style={{ fontFamily: 'var(--ui)' }}>{t('meidum.name')}</text>
        <text x="65" y="193" textAnchor="middle" fontSize="11" fill={INK_SOFT} style={{ fontFamily: 'var(--ui)' }}>{t('meidum.heightLabel')}</text>
      </g>
      <g transform="translate(290,0)">
        <polygon fill={NAVY} points="14,160 46,108 70,74 94,108 126,160" />
        <text x="70" y="178" textAnchor="middle" fontSize="13" fontWeight="600" fill={NAVY} style={{ fontFamily: 'var(--ui)' }}>{t('bent.name')}</text>
        <text x="70" y="193" textAnchor="middle" fontSize="11" fill={INK_SOFT} style={{ fontFamily: 'var(--ui)' }}>{t('bent.heightLabel')}</text>
      </g>
      <g transform="translate(430,0)">
        <polygon fill={NAVY} points="8,160 70,74 132,160" />
        <text x="70" y="178" textAnchor="middle" fontSize="13" fontWeight="600" fill={NAVY} style={{ fontFamily: 'var(--ui)' }}>{t('red.name')}</text>
        <text x="70" y="193" textAnchor="middle" fontSize="11" fill={INK_SOFT} style={{ fontFamily: 'var(--ui)' }}>{t('red.heightLabel')}</text>
      </g>
      <g transform="translate(570,0)">
        <polygon fill={GOLD} points="6,160 70,40 134,160" />
        <text x="70" y="178" textAnchor="middle" fontSize="13" fontWeight="700" fill={GOLD} style={{ fontFamily: 'var(--ui)' }}>{t('khufu.name')}</text>
        <text x="70" y="193" textAnchor="middle" fontSize="11" fill={INK_SOFT} style={{ fontFamily: 'var(--ui)' }}>{t('khufu.heightLabel')}</text>
      </g>
      <g transform="translate(710,0)">
        <polygon fill={NAVY} points="8,160 70,43 132,160" />
        <text x="70" y="178" textAnchor="middle" fontSize="13" fontWeight="600" fill={NAVY} style={{ fontFamily: 'var(--ui)' }}>{t('khafre.name')}</text>
        <text x="70" y="193" textAnchor="middle" fontSize="11" fill={INK_SOFT} style={{ fontFamily: 'var(--ui)' }}>{t('khafre.heightLabel')}</text>
      </g>
      <g transform="translate(850,0)">
        <polygon fill={NAVY} points="26,160 70,107 114,160" />
        <text x="70" y="178" textAnchor="middle" fontSize="13" fontWeight="600" fill={NAVY} style={{ fontFamily: 'var(--ui)' }}>{t('menkaure.name')}</text>
        <text x="70" y="193" textAnchor="middle" fontSize="11" fill={INK_SOFT} style={{ fontFamily: 'var(--ui)' }}>{t('menkaure.heightLabel')}</text>
      </g>
      <g transform="translate(990,0)">
        <path fill={NAVY} d="M24,160 C40,146 46,124 64,116 C74,112 80,114 88,120 C102,130 106,148 120,160 Z" />
        <text x="72" y="178" textAnchor="middle" fontSize="13" fontWeight="600" fill={NAVY} style={{ fontFamily: 'var(--ui)' }}>{t('hawara.name')}</text>
        <text x="72" y="193" textAnchor="middle" fontSize="11" fill={INK_SOFT} style={{ fontFamily: 'var(--ui)' }}>{t('hawara.heightLabel')}</text>
      </g>
    </svg>
  );
}
