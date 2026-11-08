/**
 * Product-first navigation (owner spec, 2026-11-08; ES/JA from the owner's
 * homepage translations): Egypt Tours ▾ · Day Tours ▾ · Nile Cruises ·
 * Travel Guide ▾ · About. Shared by the desktop header and the mobile sheet.
 * Category landings in the next-intl `pathnames` map (packages, day-tour
 * hubs) localize themselves; Sanity-slug pages use their localized paths.
 */
export interface NavItem {
  label: string;
  href: string;
  strong?: boolean;
}
export interface NavGroup {
  label: string;
  href?: string;
  items?: NavItem[];
}

export const SALES_NAV: NavGroup[] = [
  {
    label: 'Egypt Tours',
    href: '/egypt-travel-packages',
    items: [
      { label: 'First-time Egypt', href: '/journeys/first-time-in-egypt' },
      { label: 'Family', href: '/journeys/travelling-as-a-family' },
      { label: 'Nile & desert', href: '/journeys/desert-and-quiet' },
      { label: 'Short breaks', href: '/egypt-travel-packages?length=3-5' },
      { label: 'Luxury hotels & boats', href: '/journeys/travelling-in-style' },
      { label: 'Small-group departures', href: '/small-group-travel-packages' },
      { label: 'All tours →', href: '/egypt-travel-packages', strong: true },
    ],
  },
  {
    label: 'Day Tours',
    href: '/private-day-tours',
    items: [
      { label: 'Cairo & Giza', href: '/cairo-private-day-tours' },
      { label: 'Luxor', href: '/luxor-private-day-tours' },
      { label: 'Aswan & Abu Simbel', href: '/aswan-private-day-tours' },
      { label: 'Alexandria', href: '/alexandria-private-day-tours' },
      { label: 'Small-group day tours', href: '/group-day-tours' },
      { label: 'All day tours →', href: '/private-day-tours', strong: true },
    ],
  },
  { label: 'Nile Cruises', href: '/nile-cruises' },
  {
    label: 'Travel Guide',
    href: '/guide',
    items: [
      { label: 'Egypt guide', href: '/guide' },
      { label: 'Journal', href: '/blog' },
      { label: 'Travel tips', href: '/travel-tips' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  { label: 'About', href: '/about' },
];

const SALES_NAV_ES: NavGroup[] = [
  {
    label: 'Viajes por Egipto',
    href: '/egypt-travel-packages',
    items: [
      { label: 'Primera vez en Egipto', href: '/journeys/primera-vez-en-egipto' },
      { label: 'En familia', href: '/journeys/viajar-en-familia' },
      { label: 'Nilo y desierto', href: '/journeys/desierto-y-calma' },
      { label: 'Escapadas cortas', href: '/paquetes-de-viaje-a-egipto?length=3-5' },
      { label: 'Hoteles y barcos de lujo', href: '/journeys/viajar-con-estilo' },
      { label: 'Salidas en grupo reducido', href: '/small-group-travel-packages' },
      { label: 'Todos los viajes →', href: '/egypt-travel-packages', strong: true },
    ],
  },
  {
    label: 'Excursiones',
    href: '/private-day-tours',
    items: [
      { label: 'El Cairo y Guiza', href: '/el-cairo-visitas-privadas-de-un-dia' },
      { label: 'Luxor', href: '/luxor-excursiones-privadas-de-un-dia' },
      { label: 'Asuán y Abu Simbel', href: '/excursiones-privadas-de-un-dia-por-asuan' },
      { label: 'Alejandría', href: '/excursiones-privadas-de-un-dia-por-alejandria' },
      { label: 'Todas las excursiones →', href: '/private-day-tours', strong: true },
    ],
  },
  { label: 'Cruceros por el Nilo', href: '/nile-cruises' },
  {
    label: 'Guía de viaje',
    href: '/guide',
    items: [
      { label: 'Guía de Egipto', href: '/guide' },
      { label: 'Diario', href: '/blog' },
      { label: 'Consejos de viaje', href: '/travel-tips' },
      { label: 'Preguntas frecuentes', href: '/faq' },
    ],
  },
  { label: 'Nosotros', href: '/about' },
];

const SALES_NAV_JA: NavGroup[] = [
  {
    label: 'エジプトツアー',
    href: '/egypt-travel-packages',
    items: [
      { label: 'はじめてのエジプト', href: '/journeys/hajimete-no-ejiputo' },
      { label: '家族旅行', href: '/journeys/kazoku-de-tabisuru' },
      { label: 'ナイルと砂漠', href: '/journeys/sabaku-to-shizukesa' },
      { label: '短い日程の旅', href: '/ejiputo-ryoko-pakkeeji?length=3-5' },
      { label: 'ラグジュアリーなホテルと船', href: '/journeys/joshitsu-ni-tabisuru' },
      { label: '少人数グループの出発日', href: '/small-group-travel-packages' },
      { label: 'すべてのツアー →', href: '/egypt-travel-packages', strong: true },
    ],
  },
  {
    label: '日帰りツアー',
    href: '/private-day-tours',
    items: [
      { label: 'カイロ・ギザ', href: '/kairo-puraibeto-dei-tsua' },
      { label: 'ルクソール', href: '/rukusoru-puraibeto-dei-tsua' },
      { label: 'アスワン・アブ・シンベル', href: '/asuwan-puraibeto-dei-tsua' },
      { label: 'アレクサンドリア', href: '/arekisandoria-puraibeto-dei-tsua' },
      { label: 'すべての日帰りツアー →', href: '/private-day-tours', strong: true },
    ],
  },
  { label: 'ナイル川クルーズ', href: '/nile-cruises' },
  {
    label: '旅行ガイド',
    href: '/guide',
    items: [
      { label: 'エジプト旅行ガイド', href: '/guide' },
      { label: 'ジャーナル', href: '/blog' },
      { label: '旅のヒント', href: '/travel-tips' },
      { label: 'よくある質問', href: '/faq' },
    ],
  },
  { label: '私たちについて', href: '/about' },
];

/** Header chrome per language: nav, the lead button, WhatsApp pre-fill. */
export const HEADER_COPY: Record<'en' | 'es' | 'ja', { nav: NavGroup[]; lead: string; whatsappText: string | null; whatsappLabel: string }> = {
  en: { nav: SALES_NAV, lead: 'Get a free itinerary', whatsappText: null, whatsappLabel: 'WhatsApp us (opens in a new tab)' },
  es: {
    nav: SALES_NAV_ES,
    lead: 'Itinerario gratis',
    whatsappText: 'Hola, me gustaría ayuda para planificar un viaje a Egipto.',
    whatsappLabel: 'Escríbenos por WhatsApp (se abre en una pestaña nueva)',
  },
  ja: {
    nav: SALES_NAV_JA,
    lead: '無料で旅程作成',
    whatsappText: 'こんにちは。エジプト旅行の計画について相談したいです。',
    whatsappLabel: 'WhatsAppで問い合わせる（新しいタブで開きます）',
  },
};
