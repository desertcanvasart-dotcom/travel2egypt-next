/**
 * Route leg modes and their labels (product page right column, owner spec
 * 2026-11-11). A leg's mode is HOW the traveller moves between two stops —
 * never a stop itself. Labels are generated from mode + nights, so the
 * stored data stays language-neutral and the wording stays consistent.
 *
 * ES uses tú-neutral nouns; JA uses plain noun phrases. Client-safe.
 */

export const ROUTE_MODES = ['sleeper_train', 'train', 'flight', 'nile_cruise', 'dahabiya', 'felucca', 'road', 'boat'] as const;
export type RouteMode = (typeof ROUTE_MODES)[number];
type L = 'en' | 'es' | 'ja';

const LABELS: Record<RouteMode, Record<L, (n: number | null) => string>> = {
  sleeper_train: {
    en: () => 'Overnight sleeper train',
    es: () => 'Tren nocturno con camas',
    ja: () => '夜行寝台列車',
  },
  train: {
    en: () => 'Train',
    es: () => 'Tren',
    ja: () => '列車',
  },
  flight: {
    en: () => 'Flight',
    es: () => 'Vuelo',
    ja: () => '国内線フライト',
  },
  nile_cruise: {
    en: (n) => (n ? `${n}-night Nile cruise` : 'Nile cruise'),
    es: (n) => (n ? `Crucero por el Nilo de ${n} ${n === 1 ? 'noche' : 'noches'}` : 'Crucero por el Nilo'),
    ja: (n) => (n ? `ナイル川クルーズ（${n}泊）` : 'ナイル川クルーズ'),
  },
  dahabiya: {
    en: (n) => (n ? `${n}-night dahabiya` : 'Dahabiya'),
    es: (n) => (n ? `Dahabiya de ${n} ${n === 1 ? 'noche' : 'noches'}` : 'Dahabiya'),
    ja: (n) => (n ? `ダハビーヤ（${n}泊）` : 'ダハビーヤ'),
  },
  felucca: {
    en: () => 'Felucca',
    es: () => 'Faluca',
    ja: () => 'ファルーカ',
  },
  road: {
    en: () => 'By road',
    es: () => 'Por carretera',
    ja: () => '陸路',
  },
  boat: {
    en: () => 'Boat',
    es: () => 'Barco',
    ja: () => '船',
  },
};

const loc = (locale: string): L => (locale === 'es' || locale === 'ja' ? locale : 'en');

export function routeModeLabel(mode: string, nights: number | null | undefined, locale: string): string {
  const row = LABELS[mode as RouteMode];
  return row ? row[loc(locale)](typeof nights === 'number' && nights > 0 ? nights : null) : '';
}


export interface RouteLegRow {
  from: string;
  to: string;
  via?: string[] | null;
  mode: string;
  nights?: number | null;
}

/**
 * Stops only, in order, repeats kept (e.g. Cairo · Aswan · Kom Ombo · Edfu ·
 * Luxor · Cairo). Never de-duplicated: a return to Cairo is a real stop.
 */
export function routeStops(legs: RouteLegRow[]): string[] {
  if (!legs.length) return [];
  return [legs[0].from, ...legs.flatMap((g) => [...(g.via ?? []), g.to])].filter(Boolean);
}
