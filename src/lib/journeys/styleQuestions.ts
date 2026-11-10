import type { JLocale, JourneyKey } from './registry';

/**
 * The journey-specific question in the itinerary form (spec §5). Shown only
 * when the form opens from a journey surface or with `journey={slug}`; sent
 * as `styleAnswer` next to `journey`. Option values are the EN labels so the
 * team email reads the same in every language.
 *
 *  - first-time: reuses the existing "How many days?" field (answer = band).
 *  - family:     reuses the children's-ages field, made required when
 *                children > 0 (answer = the ages).
 */
export type StyleQuestion =
  | { kind: 'days'; label: string }
  | { kind: 'childAges'; label: string }
  | { kind: 'text'; label: string }
  | { kind: 'multi' | 'radio'; label: string; options: Array<{ value: string; label: string }> };

const opts = (en: string[], loc: string[]) => en.map((value, i) => ({ value, label: loc[i] }));

const CULTURE_EN = ['Pharaonic sites', 'Islamic Cairo', 'Coptic heritage', 'Nubian culture', 'Museums', 'Other'];
const DESERT_EN = ['Camping', 'Hotel', 'Not sure'];
const STYLE_EN = ['Landmark hotels', 'A dahabiya', 'Both'];

export const STYLE_QUESTIONS: Record<JourneyKey, Record<JLocale, StyleQuestion>> = {
  'first-time': {
    en: { kind: 'days', label: 'How many days do you have?' },
    es: { kind: 'days', label: '¿Cuántos días tienes?' },
    ja: { kind: 'days', label: '何日間のご旅行ですか？' },
  },
  cultural: {
    en: { kind: 'multi', label: 'What interests you most?', options: opts(CULTURE_EN, CULTURE_EN) },
    es: {
      kind: 'multi',
      label: '¿Qué te interesa más?',
      options: opts(CULTURE_EN, ['Sitios faraónicos', 'El Cairo islámico', 'Patrimonio copto', 'Cultura nubia', 'Museos', 'Otro']),
    },
    ja: {
      kind: 'multi',
      label: '特に興味のあるテーマは？',
      options: opts(CULTURE_EN, ['古代エジプトの遺跡', 'イスラム地区のカイロ', 'コプトの遺産', 'ヌビア文化', '博物館', 'その他']),
    },
  },
  family: {
    en: { kind: 'childAges', label: "Children's ages" },
    es: { kind: 'childAges', label: 'Edades de los niños' },
    ja: { kind: 'childAges', label: 'お子さまの年齢' },
  },
  desert: {
    en: { kind: 'radio', label: 'Camping under the stars, or a hotel?', options: opts(DESERT_EN, DESERT_EN) },
    es: { kind: 'radio', label: '¿Acampar bajo las estrellas o dormir en hotel?', options: opts(DESERT_EN, ['Acampada', 'Hotel', 'No lo sé']) },
    ja: { kind: 'radio', label: '星空の下でキャンプ、それともホテル？', options: opts(DESERT_EN, ['キャンプ', 'ホテル', '未定']) },
  },
  style: {
    en: { kind: 'radio', label: 'Hotel or dahabiya?', options: opts(STYLE_EN, STYLE_EN) },
    es: { kind: 'radio', label: '¿Hotel o dahabiya?', options: opts(STYLE_EN, ['Hoteles emblemáticos', 'Una dahabiya', 'Ambos']) },
    ja: { kind: 'radio', label: 'ホテル派？ダハビーヤ派？', options: opts(STYLE_EN, ['名門ホテル', 'ダハビーヤ', '両方']) },
  },
  'coming-back': {
    en: { kind: 'text', label: 'Where have you already been?' },
    es: { kind: 'text', label: '¿Dónde has estado ya?' },
    ja: { kind: 'text', label: 'これまでに訪れた場所は？' },
  },
};
