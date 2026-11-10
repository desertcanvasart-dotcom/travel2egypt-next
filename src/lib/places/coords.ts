/**
 * Static coordinates for the places the journey route maps can show
 * (journey pages Phase B, 2026-11-10). Well-known public coordinates,
 * rounded to 2 decimals (town centre or the site itself). Only places a map
 * uses need an entry.
 *
 * Names: ES/JA reuse the site's own spellings (Sanity `city` docs, or the
 * journey copy for places that have no city doc). Client-safe.
 */
import type { JLocale } from '@/lib/journeys/registry';

export interface Place {
  lat: number;
  lon: number;
  name: Record<JLocale, string>;
}

export const PLACES = {
  cairo: { lat: 30.04, lon: 31.24, name: { en: 'Cairo', es: 'El Cairo', ja: 'カイロ' } },
  giza: { lat: 29.98, lon: 31.13, name: { en: 'Giza', es: 'Guiza', ja: 'ギザ' } },
  saqqara: { lat: 29.87, lon: 31.22, name: { en: 'Saqqara', es: 'Saqqara', ja: 'サッカラ' } },
  alexandria: { lat: 31.2, lon: 29.92, name: { en: 'Alexandria', es: 'Alejandría', ja: 'アレクサンドリア' } },
  minya: { lat: 28.11, lon: 30.75, name: { en: 'Minya', es: 'Al Minya', ja: 'アルミンヤ' } },
  amarna: { lat: 27.65, lon: 30.9, name: { en: 'Amarna', es: 'Amarna', ja: 'アマルナ' } },
  abydos: { lat: 26.18, lon: 31.92, name: { en: 'Abydos', es: 'Abidos', ja: 'アビドス' } },
  luxor: { lat: 25.69, lon: 32.64, name: { en: 'Luxor', es: 'Luxor', ja: 'ルクソール' } },
  edfu: { lat: 24.98, lon: 32.87, name: { en: 'Edfu', es: 'Edfu', ja: 'エドフ' } },
  'kom-ombo': { lat: 24.45, lon: 32.93, name: { en: 'Kom Ombo', es: 'Kom Ombo', ja: 'コム・オンボ' } },
  aswan: { lat: 24.09, lon: 32.9, name: { en: 'Aswan', es: 'Asuán', ja: 'アスワン' } },
  'abu-simbel': { lat: 22.34, lon: 31.63, name: { en: 'Abu Simbel', es: 'Abu Simbel', ja: 'アブ・シンベル' } },
  bahariya: { lat: 28.35, lon: 28.86, name: { en: 'Bahariya', es: 'Bahariya', ja: 'バハリヤ・オアシス' } },
  'white-desert': { lat: 27.33, lon: 28.17, name: { en: 'White Desert', es: 'Desierto Blanco', ja: '白砂漠' } },
  farafra: { lat: 27.06, lon: 27.97, name: { en: 'Farafra', es: 'Farafra', ja: 'ファラフラ・オアシス' } },
  fayoum: { lat: 29.31, lon: 30.84, name: { en: 'Fayoum', es: 'Al Fayoum', ja: 'アル・ファイユーム' } },
  siwa: { lat: 29.2, lon: 25.52, name: { en: 'Siwa', es: 'Siwa', ja: 'シワ・オアシス' } },
  dakhla: { lat: 25.49, lon: 28.98, name: { en: 'Dakhla', es: 'Dakhla', ja: 'ダフラ・オアシス' } },
  kharga: { lat: 25.44, lon: 30.55, name: { en: 'Kharga', es: 'Kharga', ja: 'ハルガ' } },
} as const satisfies Record<string, Place>;

export type PlaceKey = keyof typeof PLACES;
export const isPlaceKey = (v: string): v is PlaceKey => v in PLACES;
