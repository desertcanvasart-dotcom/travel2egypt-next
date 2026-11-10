import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

import { WHATSAPP_DISPLAY } from '@/lib/concierge/constants';
import { iataItem, licenceFull, licenceLegal, type Accreditations } from '@/lib/accreditations';
import { LEGAL_ADDRESS, LEGAL_NAME, TRIPADVISOR_RATING, TRIPADVISOR_REVIEW_COUNT, TRIPADVISOR_URL } from '@/lib/company';
import { HOME_COPY } from '@/components/home-sales/copy';

import { CookiePreferencesButton } from './CookiePreferencesButton';
import { CurrencySwitcher } from './CurrencySwitcher';
import { LocaleSwitcher } from './LocaleSwitcher';
import { LeadButton } from './leads/LeadProvider';
import { NavLinkItem } from './nav/NavLinkItem';
import { TrackedWhatsApp } from './nav/TrackedWhatsApp';
import type { NavChrome, NavLeaf } from './nav/types';
import { JOURNEY_KEYS } from '@/lib/journeys/registry';

interface FooterProps {
  locale: Locale;
  nav: NavChrome;
  accreditations?: Accreditations | null;
  /** siteSettings.responseTimeFull, already in this language. */
  responseTimeFull?: string | null;
}

const PHONE_DISPLAY = '+20 108 091 6066';
const PHONE_TEL = '+201080916066';
const EMAIL = 'info@travel2egypt.org';

const LEGAL_LINKS = [
  { href: '/privacy-policy', key: 'privacy' },
  { href: '/terms', key: 'terms' },
  { href: '/cookie-policy', key: 'cookies' },
  { href: '/disclaimer', key: 'disclaimer' },
] as const;

const FIELD_GUIDES = [
  { id: 'fg_pyramids', href: '/resources/pyramids-decoded', en: 'Pyramids guide', es: 'Guía de las pirámides', ja: 'ピラミッドガイド' },
  { id: 'fg_arabic', href: '/resources/arabic-lightly', en: 'Egyptian Arabic phrases', es: 'Frases en árabe egipcio', ja: 'エジプト・アラビア語フレーズ' },
  { id: 'fg_food', href: '/resources/egyptian-cuisine', en: 'Egyptian food', es: 'Comida egipcia', ja: 'エジプト料理' },
  { id: 'fg_timeline', href: '/resources/pharaoh-timeline', en: 'Egyptian history timeline', es: 'Cronología de la historia egipcia', ja: 'エジプト史年表' },
  { id: 'fg_hieroglyphs', href: '/your-name-in-hieroglyphs', en: 'Your name in hieroglyphs', es: 'Tu nombre en jeroglíficos', ja: 'あなたの名前をヒエログリフで' },
  { id: 'fg_all', href: '/resources', en: 'All field guides →', es: 'Todas las guías →', ja: 'ガイド一覧 →' },
] as const;

const BRANDS = { sillage: 'https://sillage-egypte.com/', affordegypt: 'https://affordegypt.com/', sawa: 'https://sawa.tours/' };

const COPY = {
  en: {
    bandH2: "Let's plan your Egypt trip.",
    bandLine: 'Tell us your dates and interests, and our Egypt travel specialists will shape your itinerary.',
    bandLead: 'Get a free itinerary',
    cols: ['Tour packages', 'Day tours & cruises', 'Plan your trip', 'Why Travel2Egypt', 'Contact & help'],
    nileCruises: 'Nile cruises', hotelGrades: 'Hotel categories explained', costs: 'What Egypt costs',
    lead: 'Get a free itinerary', fieldGuides: 'Field guides:',
    brands: { intro: 'Looking for something different?', sillage: 'Bespoke luxury', affordegypt: 'Budget travel', sawa: 'Group journeys' },
  },
  es: {
    bandH2: 'Planifiquemos tu viaje a Egipto.',
    bandLine: 'Cuéntanos tus fechas e intereses y nuestros especialistas en Egipto darán forma a tu itinerario.',
    bandLead: 'Quiero mi itinerario gratis',
    cols: ['Viajes por Egipto', 'Excursiones y cruceros', 'Planifica tu viaje', 'Por qué Travel2Egypt', 'Contacto y ayuda'],
    nileCruises: 'Cruceros por el Nilo', hotelGrades: 'Categorías de hotel, explicadas', costs: 'Lo que cuesta Egipto',
    lead: 'Itinerario gratis', fieldGuides: 'Guías temáticas:',
    brands: { intro: '¿Buscas algo distinto?', sillage: 'Lujo a medida', affordegypt: 'Viajar con presupuesto ajustado', sawa: 'Viajes en grupo' },
  },
  ja: {
    bandH2: 'エジプト旅行を一緒に計画しましょう。',
    bandLine: '日程とご興味をお知らせください。エジプト旅行の専門スタッフが旅程をお作りします。',
    bandLead: '無料で旅程を受け取る',
    cols: ['エジプトツアー', '日帰りツアーとクルーズ', '旅の準備', 'Travel2Egyptが選ばれる理由', 'お問い合わせとサポート'],
    nileCruises: 'ナイル川クルーズ', hotelGrades: 'ホテルのカテゴリーについて', costs: 'エジプト旅行の費用',
    lead: '無料で旅程作成', fieldGuides: 'フィールドガイド：',
    brands: { intro: '別の旅をお探しですか？', sillage: 'オーダーメイドのラグジュアリー', affordegypt: '予算重視の旅', sawa: 'グループの旅' },
  },
} as const;

/**
 * Site footer (nav rebuild, 2026-11-10), top to bottom:
 *  1. Action band — hidden by CSS on pages that already end with the inline
 *     itinerary form: those forms carry `data-end-form` (the page-level flag),
 *     and `body:has([data-end-form]) .t2e-foot-band { display: none }`.
 *  2. Trust row (Tripadvisor + licence/ETAA from siteSettings + since 1993 + IATA).
 *  3. Five link columns (targets shared with the header via `nav`).
 *  4. Field guides line. 5. Other brands line. 6. Legal row + switchers.
 */
export function Footer({ locale, nav, accreditations, responseTimeFull }: FooterProps) {
  const t = useTranslations('footer');
  const tPlan = useTranslations('planYourTour');
  const c = COPY[locale] ?? COPY.en;
  const stop = locale === 'ja' ? '。' : '.';
  const year = new Date().getFullYear();

  // Look up header items by id so both surfaces share one target.
  const byId = new Map<string, NavLeaf>();
  for (const m of nav.menus) {
    if (m.all) byId.set(m.all.id, m.all);
    for (const g of m.groups) for (const i of g.items) byId.set(i.id, i);
  }
  const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((x): x is NavLeaf => Boolean(x));
  const strip = (i: NavLeaf): NavLeaf => ({ ...i, fromEur: null }); // no prices in the footer

  const columns: NavLeaf[][] = [
    pick(['all_packages', 'small_group', ...JOURNEY_KEYS.map((k) => `journey_${k}`)]).map(strip),
    [
      ...pick(['cairo', 'luxor', 'aswan', 'alexandria', 'all_day_tours']).map(strip),
      { id: 'nile_cruises', label: c.nileCruises, href: '/nile-cruises' },
    ],
    [
      ...pick(['best_time', 'how_many_days']),
      ...pick(['costs']).map((i) => ({ ...i, label: byId.get('costs')?.label ?? c.costs })),
      ...pick(['visa', 'faq']),
      { id: 'hotel_grades', label: c.hotelGrades, href: '/hotel-grade-concept' },
    ],
    pick(['about_us', 'reviews', 'licence', 'responsible', 'stories']),
  ];

  const tripadvisor = HOME_COPY[locale]?.hero.tripadvisor(TRIPADVISOR_RATING, TRIPADVISOR_REVIEW_COUNT);
  const trust = [licenceFull(accreditations, locale), tPlan('trustGuiding'), iataItem(accreditations)].filter(Boolean) as string[];
  const terms = byId.get('terms');

  return (
    <footer className="t2e-footer">
      {/* 1. Action band */}
      <section className="t2e-foot-band" aria-labelledby="t2e-foot-band-h">
        <div className="t2e-wrap t2e-foot-band-inner">
          <h2 id="t2e-foot-band-h">{c.bandH2}</h2>
          <p className="t2e-foot-band-line">{c.bandLine}</p>
          <div className="t2e-foot-band-actions">
            <LeadButton source="footer_band" className="t2e-foot-band-lead" openEvent={{ name: 'form_open', params: { location: 'footer_band' } }}>
              {c.bandLead}
            </LeadButton>
            <TrackedWhatsApp className="t2e-foot-band-wa" href={nav.whatsappHref} aria={nav.whatsappAria} location="footer_band">
              WhatsApp
            </TrackedWhatsApp>
          </div>
          {responseTimeFull ? <p className="t2e-foot-band-small">{responseTimeFull}</p> : null}
        </div>
      </section>

      <div className="t2e-wrap">
        {/* 2. Trust row */}
        <p className="t2e-foot-trust">
          <a href={TRIPADVISOR_URL} target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true" className="star">★</span> {tripadvisor}
          </a>
          {trust.map((x) => (
            <span key={x}>
              <span aria-hidden="true" className="sep"> · </span>
              {x}
            </span>
          ))}
        </p>

        {/* 3. Columns */}
        <div className="t2e-foot-cols">
          {columns.map((items, ci) => (
            <div key={ci} className="t2e-foot-col">
              <h2>{c.cols[ci]}</h2>
              <ul>
                {items.map((item, i) => (
                  <li key={item.id}>
                    <NavLinkItem item={item} menu="footer" group={`col${ci + 1}`} position={i} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="t2e-foot-col">
            <h2>{c.cols[4]}</h2>
            <ul>
              <li>
                <TrackedWhatsApp href={nav.whatsappHref} aria={nav.whatsappAria} location="footer">
                  WhatsApp {WHATSAPP_DISPLAY}
                </TrackedWhatsApp>
              </li>
              <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
              <li><a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a></li>
              <li className="t2e-foot-address">{LEGAL_NAME}, {LEGAL_ADDRESS}, Egypt</li>
              {terms && (
                <li><NavLinkItem item={terms} menu="footer" group="col5" position={4} /></li>
              )}
              <li>
                <LeadButton source="footer" className="t2e-foot-lead" openEvent={{ name: 'form_open', params: { location: 'footer' } }}>
                  {c.lead}
                </LeadButton>
              </li>
            </ul>
          </div>
        </div>

        {/* 4. Field guides */}
        <p className="t2e-foot-guides">
          <span className="label">{c.fieldGuides}</span>
          {FIELD_GUIDES.map((g, i) => (
            <span key={g.id}>
              {i > 0 && <span aria-hidden="true" className="sep"> · </span>}
              <NavLinkItem item={{ id: g.id, label: g[locale] ?? g.en, href: g.href }} menu="footer" group="field_guides" position={i} />
            </span>
          ))}
        </p>

        {/* 5. Other brands */}
        <p className="t2e-foot-brandsline">
          {c.brands.intro}{' '}
          {(['sillage', 'affordegypt', 'sawa'] as const).map((b, i) => (
            <span key={b}>
              {i > 0 && <span aria-hidden="true" className="sep"> · </span>}
              {c.brands[b]} →{' '}
              <NavLinkItem
                item={{ id: `brand_${b}`, label: b === 'affordegypt' ? 'AffordEgypt' : b === 'sillage' ? 'Sillage' : 'Sawa', href: BRANDS[b], external: true }}
                menu="brand_route"
                group="brands"
                position={i}
              >
                <strong>{b === 'affordegypt' ? 'AffordEgypt' : b === 'sillage' ? 'Sillage' : 'Sawa'}</strong>
              </NavLinkItem>
            </span>
          ))}
        </p>

        {/* 6. Legal row */}
        <div className="t2e-foot-legal">
          <span className="legal-owner">
            {licenceLegal(accreditations, locale, year)}
            {stop} {t('rights')}
          </span>
          <span className="legal-links">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {t(link.key)}
              </Link>
            ))}
            <CookiePreferencesButton />
            <span className="legal-prefs">
              <CurrencySwitcher />
              <LocaleSwitcher currentLocale={locale} />
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
