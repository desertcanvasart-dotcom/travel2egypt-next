/**
 * The six traveller-type journeys (Journey pages Phase A, 2026-11-10): one
 * set of labels, paths, paired theme hubs and related styles, used by the
 * journey pages, the /journeys overview, the homepage "Travel styles" cards,
 * the navigation "Who it's for" group, the footer and the hub banners.
 *
 * Client-safe: no Sanity or server imports.
 */

export const JOURNEY_KEYS = ['first-time', 'cultural', 'family', 'desert', 'style', 'coming-back'] as const;
export type JourneyKey = (typeof JOURNEY_KEYS)[number];
export type JLocale = 'en' | 'es' | 'ja';

export interface JourneyDef {
  key: JourneyKey;
  /** EN pathname (next-intl localizes it via routing.ts pathnames). */
  path: string;
  /** Paired theme hub: the tourLanding id and its EN slug. */
  hubId: string;
  hubSlug: string;
  /** One label set everywhere (spec §6). */
  label: Record<JLocale, string>;
  /** "{style}" in "See all {n} {style} tours →" (EN) — the hub's catalogue. */
  styleNoun: string;
  /** "{style}" in the hub banner "how we plan {style} trips →" (spec §7.4). */
  planNoun: Record<JLocale, string>;
  /** EN <title> (spec §6); ES/JA titles ship only once approved (curation.ts). */
  titleEn: string;
  /** "Also suits you if…" (spec §4.7). */
  related: [JourneyKey, JourneyKey, JourneyKey];
}

export const JOURNEYS: Record<JourneyKey, JourneyDef> = {
  'first-time': {
    key: 'first-time',
    planNoun: { en: 'first-time', es: 'primera vez', ja: 'はじめてのエジプト' },
    path: '/journeys/first-time-in-egypt',
    hubId: 'tourLanding.hassle-free-egypt',
    hubSlug: 'hassle-free-egypt',
    label: { en: 'First time in Egypt', es: 'Primera vez en Egipto', ja: 'はじめてのエジプト' },
    styleNoun: 'hassle-free',
    titleEn: "First Trip to Egypt: How to Plan It, with Tours We'd Choose",
    related: ['family', 'style', 'cultural'],
  },
  cultural: {
    key: 'cultural',
    planNoun: { en: 'culture & history', es: 'cultura e historia', ja: '文化と歴史' },
    path: '/journeys/the-cultural-traveller',
    hubId: 'tourLanding.egypt-in-depth',
    hubSlug: 'egypt-in-depth',
    label: { en: 'Culture & history', es: 'Cultura e historia', ja: '文化と歴史' },
    styleNoun: 'in-depth',
    titleEn: 'Cultural Tours of Egypt: How to Plan a Deeper Trip',
    related: ['coming-back', 'first-time', 'desert'],
  },
  family: {
    key: 'family',
    planNoun: { en: 'family', es: 'familia', ja: '家族' },
    path: '/journeys/travelling-as-a-family',
    hubId: 'tourLanding.egypt-family-holidays',
    hubSlug: 'egypt-family-holidays',
    label: { en: 'Families', es: 'En familia', ja: '家族旅行' },
    styleNoun: 'family',
    titleEn: 'Egypt with Kids: How to Plan a Family Trip',
    related: ['first-time', 'style', 'desert'],
  },
  desert: {
    key: 'desert',
    planNoun: { en: 'desert', es: 'desierto', ja: '砂漠' },
    path: '/journeys/desert-and-quiet',
    hubId: 'tourLanding.multiday-adventure-and-safari-tours',
    hubSlug: 'multiday-adventure-and-safari-tours',
    label: { en: 'Desert & quiet', es: 'Desierto y calma', ja: '砂漠と静けさ' },
    styleNoun: 'desert & adventure',
    titleEn: "Egypt's Western Desert: Planning a Desert Trip",
    related: ['coming-back', 'cultural', 'family'],
  },
  style: {
    key: 'style',
    planNoun: { en: 'luxury', es: 'lujo', ja: 'ラグジュアリー' },
    path: '/journeys/travelling-in-style',
    hubId: 'tourLanding.egypt-luxury-holidays',
    hubSlug: 'egypt-luxury-holidays',
    label: { en: 'Luxury', es: 'Lujo', ja: 'ラグジュアリー' },
    styleNoun: 'luxury',
    titleEn: 'Luxury Egypt Travel: How to Plan It',
    related: ['first-time', 'family', 'cultural'],
  },
  'coming-back': {
    key: 'coming-back',
    planNoun: { en: 'return', es: 'regreso', ja: 'ふたたびのエジプト' },
    path: '/journeys/coming-back',
    hubId: 'tourLanding.special-interest-tours',
    hubSlug: 'special-interest-tours',
    label: { en: 'Coming back', es: 'Volver a Egipto', ja: 'ふたたびのエジプト' },
    styleNoun: 'special-interest',
    titleEn: 'Returning to Egypt: Planning a Second Trip',
    related: ['cultural', 'desert', 'style'],
  },
};

export const journeyLocale = (l: string): JLocale => (l === 'es' || l === 'ja' ? l : 'en');
export const journeyLabel = (k: JourneyKey, l: string) => JOURNEYS[k].label[journeyLocale(l)];
export const isJourneyKey = (v: unknown): v is JourneyKey => typeof v === 'string' && (JOURNEY_KEYS as readonly string[]).includes(v);
export const journeyByHubSlug = (slug: string) => JOURNEY_KEYS.map((k) => JOURNEYS[k]).find((j) => j.hubSlug === slug) ?? null;

/** Shared strings for the journey surfaces (spec §3, §4, §7). */
export const JOURNEY_UI = {
  en: {
    from: (p: string) => `From ${p}`,
    planMyTrip: 'Plan my trip',
    whatsapp: 'WhatsApp',
    toursH2: "Two or three ways we'd do it",
    seeAll: (n: number, noun: string, _label?: string) => `See all ${n} ${noun} tours →`,
    beforeYouGo: 'Before you go',
    closeBody: "Tell us your dates and who's travelling. We'll send back a day-by-day plan and a firm price.",
    aiConcierge: 'Still exploring? Ask our AI concierge →',
    related: 'Also suits you if…',
    explore: 'Explore this style →',
    allStyles: 'All travel styles →',
    indexH1: 'Travel styles',
    indexIntro: 'Start with how you travel. Each style shows how we’d plan it, with tours to choose from.',
    indexTitle: 'Travel Styles: How We Plan Each Kind of Egypt Trip',
    indexDescription: 'Six ways to travel Egypt — first time, culture and history, families, desert and quiet, luxury, and coming back — each with how we plan it and tours to choose from.',
    planning: (noun: string) => `Planning advice: how we plan ${noun} trips →`,
    partOf: 'Part of:',
    interestedIn: 'Interested in:',
    planningLinks: { bestTime: 'Best time to visit', howManyDays: 'How many days you need', costs: 'What Egypt costs', visa: 'Passport & visa' },
  },
  es: {
    from: (p: string) => `Desde ${p}`,
    planMyTrip: 'Planificar mi viaje',
    whatsapp: 'WhatsApp',
    toursH2: 'Dos o tres maneras de hacerlo',
    seeAll: (n: number, _noun?: string, _label?: string) => `Ver los ${n} viajes →`,
    beforeYouGo: 'Antes de ir',
    closeBody: 'Cuéntanos tus fechas y quién viaja. Te enviamos un plan día a día y un precio cerrado.',
    aiConcierge: '¿Aún no lo tienes claro? Pregunta a nuestro concierge con IA →',
    related: 'También te puede interesar…',
    explore: 'Descubre este estilo →',
    allStyles: 'Todos los estilos de viaje →',
    indexH1: 'Estilos de viaje',
    indexIntro: 'Empieza por cómo viajas. Cada estilo muestra cómo lo planificaríamos, con viajes para elegir.',
    indexTitle: 'Estilos de viaje: cómo planificamos cada tipo de viaje a Egipto',
    indexDescription: 'Seis maneras de viajar por Egipto — primera vez, cultura e historia, en familia, desierto y calma, lujo y volver — con cómo lo planificamos y viajes para elegir.',
    planning: (noun: string) => `Consejos: cómo planificamos los viajes de ${noun} →`,
    partOf: 'Forma parte de:',
    interestedIn: 'Te interesa:',
    planningLinks: { bestTime: 'Cuándo viajar', howManyDays: 'Cuántos días necesitas', costs: 'Lo que cuesta Egipto', visa: 'Pasaporte y visado' },
  },
  ja: {
    from: (p: string) => `${p}〜`,
    planMyTrip: '旅程を相談する',
    whatsapp: 'WhatsApp',
    toursH2: '私たちならこう組みます',
    seeAll: (_n: number, _noun?: string, label?: string) => `${label ?? ''}のツアーをすべて見る →`,
    beforeYouGo: '出発の前に',
    closeBody: '日程とご同行者を教えてください。日ごとのプランと確定料金をお送りします。',
    aiConcierge: '',
    related: 'こちらもおすすめ',
    explore: 'このスタイルを見る →',
    allStyles: '旅のスタイル一覧 →',
    indexH1: '旅のスタイル',
    indexIntro: '旅のスタイルから選んでください。それぞれに、私たちならどう計画するかと、選べるツアーをご紹介しています。',
    indexTitle: '旅のスタイル：エジプト旅行の計画のしかた',
    indexDescription: 'はじめてのエジプト、文化と歴史、家族旅行、砂漠と静けさ、ラグジュアリー、ふたたびのエジプト——6つの旅のスタイルと、選べるツアー。',
    planning: (noun: string) => `${noun}の旅の計画のコツ →`,
    partOf: 'おすすめの旅のスタイル：',
    interestedIn: 'ご関心：',
    planningLinks: { bestTime: 'ベストシーズン', howManyDays: '必要な日数', costs: 'エジプト旅行の費用', visa: 'パスポートとビザ' },
  },
} as const;
