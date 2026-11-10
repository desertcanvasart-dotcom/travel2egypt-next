/**
 * Header/footer navigation data (owner spec "Header and footer navigation
 * rebuild", 2026-11-10). One server-side build per locale:
 *  - labels, groups and order per the spec (ES uses tú; JA shows nothing
 *    concierge-related);
 *  - targets: every item already in the old menus keeps its URL (copied from
 *    the previous SALES_NAV / footer); new items use the resolved paths below;
 *  - "from" prices: the minimum published priceFrom (EUR) among the products
 *    behind each link, using the same rule the target page uses. Rendered in
 *    the visitor's currency by <Price>. No priced product → no price.
 *
 * Unresolved targets (reported to the owner, left out of the menu):
 *  - "Private & tailor-made": the old footer "Private Travel Packages" link is
 *    /egypt-travel-packages, the same as "All tour packages" → omitted.
 *  - "What Egypt costs": no Real Prices page exists → the entrance-fees
 *    travel tip, labelled "Entrance fees".
 *  - "Steamer": no steamer boats are listed on /nile-cruises → omitted until
 *    one is (the item appears automatically when the count is > 0).
 */
import { cache } from 'react';
import { groq } from 'next-sanity';

import { client } from '@/sanity/lib/client';
import { EN_SLUG, PRODUCTS_BY_SLUGS_FILTER } from '@/lib/products/bySlug';
import { ONE_DAY_CHECK_FIELDS, multiDayOnly } from '@/lib/products/multiDay';
import type { Locale } from '@/i18n/routing';
import { STYLE_CARDS } from '@/components/home-sales/config';
import { TRIPADVISOR_URL } from '@/lib/company';
import { WHATSAPP_DISPLAY, WHATSAPP_LINK, whatsappUrl } from '@/lib/concierge/constants';
import type { NavChrome, NavMenu } from '@/components/nav/types';
import { getJourneysLive } from '@/lib/journeys/data';
import { JOURNEY_KEYS, JOURNEYS, JOURNEY_UI, journeyLocale } from '@/lib/journeys/registry';

const JOURNEY_PRICE_SLUG = Object.fromEntries(STYLE_CARDS.filter((c) => c.priceSlug).map((c) => [c.href, c.priceSlug!]));

const CITY_LANDINGS = {
  cairo: 'tourLanding.cairo-private-day-tours',
  luxor: 'tourLanding.luxor-private-day-tours',
  aswan: 'tourLanding.aswan-private-day-tours',
  alexandria: 'tourLanding.alexandria-private-day-tours',
} as const;

const navPricesQuery = groq`{
  "packages": *[_type == "tour" && type == "package" && tourMode == "private" && !(_id in path("drafts.**")) && priceFrom > 0]{ durationDays, priceFrom, ${ONE_DAY_CHECK_FIELDS} },
  "journeys": *[${PRODUCTS_BY_SLUGS_FILTER.replace('$slugs', '$journeySlugs')}]{ "slug": ${EN_SLUG}, priceFrom },
  "cities": *[_type == "tourLanding" && _id in $landingIds]{
    _id,
    "min": math::min(*[_type == "tour" && !(_id in path("drafts.**")) && type == "dayTour" && tourMode == "private"
      && priceFrom > 0 && ^.destinationCity._ref in cities[]._ref].priceFrom)
  },
  "ship": math::min(*[_type == "tour" && !(_id in path("drafts.**")) && priceFrom > 0
    && theme->slug[_key=="en"][0].value.current == "nile-cruise"
    && !(slug[_key=="en"][0].value.current match "*nasser*")].priceFrom),
  "dahabiya": math::min(*[_type == "tour" && !(_id in path("drafts.**")) && priceFrom > 0
    && theme->slug[_key=="en"][0].value.current == "dahabiya-nile-cruise"
    && !(slug[_key=="en"][0].value.current match "*nasser*")].priceFrom),
  "steamers": count(*[_type == "hotelAndCruise" && !(_id in path("drafts.**")) && "steam" in poweredBy && cruiseRoute != "lake-nasser"])
}`;

interface NavPrices {
  packages: Array<{ durationDays?: number | null; priceFrom: number; enTitle?: string | null; enSummary?: string | null }>;
  journeys: Array<{ slug: string; priceFrom?: number | null }>;
  cities: Array<{ _id: string; min?: number | null }>;
  ship?: number | null;
  dahabiya?: number | null;
  steamers: number;
}

const LENGTHS = [
  { key: '3-5', test: (d: number) => d <= 5 },
  { key: '6-9', test: (d: number) => d >= 6 && d <= 9 },
  { key: '10-14', test: (d: number) => d >= 10 && d <= 14 },
  { key: '15+', test: (d: number) => d >= 15 },
] as const;

const min = (xs: Array<number | null | undefined>): number | null => {
  const v = xs.filter((x): x is number => typeof x === 'number' && x > 0);
  return v.length ? Math.min(...v) : null;
};

/** Per-locale labels and paths. Paths for Sanity-slug pages are this language's slug. */
const L = {
  en: {
    packages: 'Tour Packages', daytours: 'Day Tours', cruises: 'Nile Cruises', guide: 'Travel Guide', about: 'About',
    allPackages: 'All tour packages', howYouTravel: 'How you travel', smallGroup: 'Small-group departures',
    whoFor: "Who it's for", firstTime: 'First time in Egypt', family: 'Family tours', luxury: 'Luxury Egypt tours', nileDesert: 'Nile & desert',
    byLength: 'By length', lengths: ['Up to 5 days', '6–9 days', '10–14 days', '15+ days'],
    notSure: 'Not sure? Get a free itinerary →',
    allDay: 'All day tours', cairo: 'Cairo & Giza', luxor: 'Luxor', aswan: 'Aswan & Abu Simbel', alexandria: 'Alexandria', smallGroupDay: 'Small-group day tours',
    compareBoats: 'Compare all boats', ships: 'Cruise ships', dahabiyas: 'Dahabiyas', steamer: 'Steamer',
    plan: 'Plan your trip', bestTime: 'Best time to visit', howManyDays: 'How many days you need', costs: 'Entrance fees', visa: 'Passport & visa', faq: 'FAQ',
    explore: 'Explore', egyptGuide: 'Egypt travel guide', fieldGuides: 'Field guides', stories: 'Travel stories',
    aboutUs: 'About us', reviews: 'Traveller reviews', licence: 'Licence & memberships', terms: 'Booking & payment terms', responsible: 'Responsible travel', contact: 'Contact',
    lead: 'Get a free itinerary', whatsappButton: `WhatsApp ${WHATSAPP_DISPLAY}`, from: 'from {price}',
    openMenu: 'Open menu', closeMenu: 'Close menu', primaryNav: 'Primary',
    paths: {
      hub: '/egypt-travel-packages',
      firstTime: '/journeys/first-time-in-egypt', family: '/journeys/travelling-as-a-family', nileDesert: '/journeys/desert-and-quiet', luxury: '/journeys/travelling-in-style',
      cairo: '/cairo-private-day-tours', luxor: '/luxor-private-day-tours', aswan: '/aswan-private-day-tours', alexandria: '/alexandria-private-day-tours',
      bestTime: '/travel-tips/egypt-weather-guide', howManyDays: '/blog/the-best-egypt-travel-itineraries', costs: '/travel-tips/attractions-entrance-fees', visa: '/travel-tips/passport-and-visa',
    },
    waText: null as string | null,
  },
  es: {
    packages: 'Viajes por Egipto', daytours: 'Excursiones', cruises: 'Cruceros por el Nilo', guide: 'Guía de viaje', about: 'Nosotros',
    allPackages: 'Todos los viajes', howYouTravel: 'Cómo viajas', smallGroup: 'Salidas en grupo reducido',
    whoFor: 'Para quién', firstTime: 'Primera vez en Egipto', family: 'Viajes en familia', luxury: 'Viajes de lujo por Egipto', nileDesert: 'Nilo y desierto',
    byLength: 'Por duración', lengths: ['Hasta 5 días', '6–9 días', '10–14 días', '15 días o más'],
    notSure: '¿No lo tienes claro? Pide tu itinerario gratis →',
    allDay: 'Todas las excursiones', cairo: 'El Cairo y Guiza', luxor: 'Luxor', aswan: 'Asuán y Abu Simbel', alexandria: 'Alejandría', smallGroupDay: 'Excursiones en grupo reducido',
    compareBoats: 'Comparar todos los barcos', ships: 'Cruceros', dahabiyas: 'Dahabiyas', steamer: 'Barco de vapor',
    plan: 'Planifica tu viaje', bestTime: 'Mejor época para viajar', howManyDays: 'Cuántos días necesitas', costs: 'Precios de las entradas', visa: 'Pasaporte y visado', faq: 'Preguntas frecuentes',
    explore: 'Explora', egyptGuide: 'Guía de viaje de Egipto', fieldGuides: 'Guías temáticas', stories: 'Historias de viaje',
    aboutUs: 'Sobre nosotros', reviews: 'Opiniones de viajeros', licence: 'Licencia y asociaciones', terms: 'Condiciones de reserva y pago', responsible: 'Viajes responsables', contact: 'Contacto',
    lead: 'Itinerario gratis', whatsappButton: `WhatsApp ${WHATSAPP_DISPLAY}`, from: 'desde {price}',
    openMenu: 'Abrir menú', closeMenu: 'Cerrar menú', primaryNav: 'Principal',
    paths: {
      hub: '/egypt-travel-packages',
      firstTime: '/journeys/primera-vez-en-egipto', family: '/journeys/viajar-en-familia', nileDesert: '/journeys/desierto-y-calma', luxury: '/journeys/viajar-con-estilo',
      cairo: '/el-cairo-visitas-privadas-de-un-dia', luxor: '/luxor-excursiones-privadas-de-un-dia', aswan: '/excursiones-privadas-de-un-dia-por-asuan', alexandria: '/excursiones-privadas-de-un-dia-por-alejandria',
      bestTime: '/travel-tips/el-clima-de-egipto-zonas-climaticas-estaciones-y-cuando-visitar', howManyDays: '/blog/los-mejores-itinerarios-de-viaje-por-egipto',
      costs: '/travel-tips/entradas-a-los-monumentos-de-egipto-que-presupuestar-y-que-priorizar', visa: '/travel-tips/pasaportes-y-visados-para-egipto-las-normas-de-entrada-explicadas',
    },
    waText: 'Hola, me gustaría ayuda para planificar un viaje a Egipto.',
  },
  ja: {
    packages: 'エジプトツアー', daytours: '日帰りツアー', cruises: 'ナイル川クルーズ', guide: '旅行ガイド', about: '私たちについて',
    allPackages: 'すべてのツアー', howYouTravel: '旅のスタイル', smallGroup: '少人数グループの出発日',
    whoFor: 'こんな方に', firstTime: 'はじめてのエジプト', family: '家族旅行', luxury: 'ラグジュアリーなエジプト旅行', nileDesert: 'ナイルと砂漠',
    byLength: '日数で選ぶ', lengths: ['5日以内', '6〜9日', '10〜14日', '15日以上'],
    notSure: '迷ったら、無料で旅程を受け取る →',
    allDay: 'すべての日帰りツアー', cairo: 'カイロ・ギザ', luxor: 'ルクソール', aswan: 'アスワン・アブ・シンベル', alexandria: 'アレクサンドリア', smallGroupDay: '少人数グループの日帰りツアー',
    compareBoats: 'すべての船を比較', ships: 'クルーズ船', dahabiyas: 'ダハビーヤ', steamer: '蒸気船',
    plan: '旅の準備', bestTime: 'ベストシーズン', howManyDays: '何日あればいいか', costs: '観光地の入場料', visa: 'パスポートとビザ', faq: 'よくある質問',
    explore: '探す', egyptGuide: 'エジプト旅行ガイド', fieldGuides: 'フィールドガイド', stories: '旅の読みもの',
    aboutUs: '私たちについて', reviews: '旅行者のレビュー', licence: 'ライセンスと加盟団体', terms: '予約・お支払い条件', responsible: '責任ある旅行', contact: 'お問い合わせ',
    lead: '無料で旅程作成', whatsappButton: `WhatsApp ${WHATSAPP_DISPLAY}`, from: '{price}〜',
    openMenu: 'メニューを開く', closeMenu: 'メニューを閉じる', primaryNav: 'メインメニュー',
    paths: {
      hub: '/egypt-travel-packages',
      firstTime: '/journeys/hajimete-no-ejiputo', family: '/journeys/kazoku-de-tabisuru', nileDesert: '/journeys/sabaku-to-shizukesa', luxury: '/journeys/joshitsu-ni-tabisuru',
      cairo: '/kairo-puraibeto-dei-tsua', luxor: '/rukusoru-puraibeto-dei-tsua', aswan: '/asuwan-puraibeto-dei-tsua', alexandria: '/arekisandoria-puraibeto-dei-tsua',
      bestTime: '/travel-tips/ejiputo-no-tenko-gaido', howManyDays: '/blog/ejiputo-ryoko-no-nissu-betsu-moderu-kosu',
      costs: '/travel-tips/ejiputo-tabi-no-keikaku-nyujo-ryo-2026', visa: '/travel-tips/ejiputo-nyukoku-gaido',
    },
    waText: 'こんにちは。エジプト旅行の計画について相談したいです。',
  },
} as const;

/** The packages hub's own path per language (the ?length= filter is read there). */
const HUB_PATH: Record<Locale, string> = {
  en: '/egypt-travel-packages',
  es: '/paquetes-de-viaje-a-egipto',
  ja: '/ejiputo-ryoko-pakkeeji',
};

export const getNavData = cache(async (locale: Locale): Promise<NavChrome> => {
  const t = L[locale] ?? L.en;
  const p = t.paths;
  const [prices, live] = await Promise.all([
    client.fetch<NavPrices>(navPricesQuery, {
      journeySlugs: Object.values(JOURNEY_PRICE_SLUG),
      landingIds: Object.values(CITY_LANDINGS),
    }),
    getJourneysLive(locale),
  ]);
  // Journey "from": the approved tours' lowest price (same figure as the
  // journey page and homepage card); until a journey's tours are approved,
  // the homepage card's existing source (a product price or owner figure).
  const journeyFrom = (enHref: string) => {
    const key = JOURNEY_KEYS.find((k) => JOURNEYS[k].path === enHref);
    if (key && live[key].fromEur) return live[key].fromEur;
    const slug = JOURNEY_PRICE_SLUG[enHref];
    if (slug) return min(prices.journeys.filter((j) => j.slug === slug).map((j) => j.priceFrom));
    return STYLE_CARDS.find((c) => c.href === enHref)?.ownerFromEur ?? null;
  };
  const cityFrom = (id: string) => min(prices.cities.filter((c) => c._id === id).map((c) => c.min));
  const lengthFrom = (i: number) =>
    // One-day products (e.g. "Alexandria in a Day", stored as 2 days) never set a length price.
    min(multiDayOnly(prices.packages).filter((x) => typeof x.durationDays === 'number' && LENGTHS[i].test(x.durationDays)).map((x) => x.priceFrom));

  const menus: NavMenu[] = [
    {
      id: 'packages',
      label: t.packages,
      href: p.hub,
      all: { id: 'all_packages', label: t.allPackages, href: p.hub },
      groups: [
        { id: 'how', label: t.howYouTravel, items: [{ id: 'small_group', label: t.smallGroup, href: '/small-group-travel-packages' }] },
        {
          id: 'who',
          label: t.whoFor,
          // The six journeys (journey pages Phase A, §7.1) + the overview.
          items: [
            ...JOURNEY_KEYS.map((k) => ({
              id: `journey_${k}`,
              label: JOURNEYS[k].label[journeyLocale(locale)],
              href: JOURNEYS[k].path,
              fromEur: journeyFrom(JOURNEYS[k].path),
            })),
            { id: 'all_styles', label: JOURNEY_UI[journeyLocale(locale)].allStyles, href: '/journeys' },
          ],
        },
        {
          id: 'length',
          label: t.byLength,
          items: LENGTHS.map((l, i) => ({ id: `length_${l.key}`, label: t.lengths[i], href: `${HUB_PATH[locale] ?? HUB_PATH.en}?length=${encodeURIComponent(l.key)}`, fromEur: lengthFrom(i) })),
        },
      ],
      leadCta: t.notSure,
    },
    {
      id: 'daytours',
      label: t.daytours,
      href: '/private-day-tours',
      all: { id: 'all_day_tours', label: t.allDay, href: '/private-day-tours' },
      groups: [
        {
          id: 'cities',
          items: [
            { id: 'cairo', label: t.cairo, href: p.cairo, fromEur: cityFrom(CITY_LANDINGS.cairo) },
            { id: 'luxor', label: t.luxor, href: p.luxor, fromEur: cityFrom(CITY_LANDINGS.luxor) },
            { id: 'aswan', label: t.aswan, href: p.aswan, fromEur: cityFrom(CITY_LANDINGS.aswan) },
            { id: 'alexandria', label: t.alexandria, href: p.alexandria, fromEur: cityFrom(CITY_LANDINGS.alexandria) },
          ],
        },
        { id: 'group', items: [{ id: 'small_group_day', label: t.smallGroupDay, href: '/group-day-tours' }] },
      ],
    },
    {
      id: 'cruises',
      label: t.cruises,
      href: '/nile-cruises',
      all: { id: 'compare_boats', label: t.compareBoats, href: '/nile-cruises' },
      groups: [
        {
          id: 'boats',
          items: [
            { id: 'ships', label: t.ships, href: '/nile-cruises?vessel=ship#cruise-ships', fromEur: prices.ship ?? null },
            { id: 'dahabiyas', label: t.dahabiyas, href: '/nile-cruises?vessel=dahabiya#dahabiyas', fromEur: prices.dahabiya ?? null },
            ...(prices.steamers > 0 ? [{ id: 'steamer', label: t.steamer, href: '/nile-cruises?vessel=steamer#steamers' }] : []),
          ],
        },
      ],
    },
    {
      id: 'guide',
      label: t.guide,
      href: '/guide',
      groups: [
        {
          id: 'plan',
          label: t.plan,
          items: [
            { id: 'best_time', label: t.bestTime, href: p.bestTime },
            { id: 'how_many_days', label: t.howManyDays, href: p.howManyDays },
            { id: 'costs', label: t.costs, href: p.costs },
            { id: 'visa', label: t.visa, href: p.visa },
            { id: 'faq', label: t.faq, href: '/faq' },
          ],
        },
        {
          id: 'explore',
          label: t.explore,
          items: [
            { id: 'egypt_guide', label: t.egyptGuide, href: '/guide' },
            { id: 'field_guides', label: t.fieldGuides, href: '/resources' },
            { id: 'stories', label: t.stories, href: '/blog' },
          ],
        },
      ],
    },
    {
      id: 'about',
      label: t.about,
      href: '/about',
      groups: [
        {
          id: 'about',
          items: [
            { id: 'about_us', label: t.aboutUs, href: '/about' },
            { id: 'reviews', label: t.reviews, href: TRIPADVISOR_URL, external: true },
            { id: 'licence', label: t.licence, href: '/contact#accreditations' },
            { id: 'terms', label: t.terms, href: '/terms' },
            { id: 'responsible', label: t.responsible, href: '/responsible-travel' },
            { id: 'contact', label: t.contact, href: '/contact' },
          ],
        },
      ],
    },
  ];

  return {
    menus,
    lead: t.lead,
    whatsappHref: t.waText ? whatsappUrl(t.waText) : WHATSAPP_LINK,
    whatsappLabel: 'WhatsApp',
    whatsappAria: `WhatsApp ${WHATSAPP_DISPLAY}`,
    whatsappButton: t.whatsappButton,
    fromTemplate: t.from,
    openMenu: t.openMenu,
    closeMenu: t.closeMenu,
    primaryNavLabel: t.primaryNav,
  };
});
