/**
 * Journey pages Phase A — owner-approved curation (2026-11-10).
 *
 * 2026-11-10: owner approved all tour picks and all six heroes (photographer
 * permission confirmed) per review/journeys/journeys-phase-a-en.audited.md
 * (PR #214). Subheadings, facts and ES/JA titles are still in review.
 *
 * Every item is a PROPOSAL until the owner approves it in
 * review/journeys/journeys-phase-a-{en,es,ja}.md. Items with
 * `needsReview: true` never render; approving an item = setting
 * `needsReview: false` (with any corrected wording). Rejected items are
 * deleted from this file.
 *
 *  - tours: 2–3 published, priced multi-day products (EN slugs); `why` per locale.
 *  - hero: an existing Sanity image asset (+ the tour's own alt text).
 *  - subheadings: H2s inserted above essay paragraph index `beforeParagraph`
 *    (0-based). Essay text never changes.
 *  - facts: shortened facts-row values per locale; until approved the row
 *    shows the current "Shape of the trip" text.
 *  - titles: ES/JA <title>s (EN ships from registry.ts).
 */
import type { JLocale, JourneyKey } from './registry';

type PerLocale = Partial<Record<JLocale, string>>;
export interface FactValues {
  length: string;
  route: string;
  pace: string;
  season: string;
  suits: string;
}
export interface JourneyCuration {
  tours: Array<{ slug: string; why: PerLocale; needsReview: boolean }>;
  hero: { asset: string; alt: PerLocale; needsReview: boolean } | null;
  subheadings: Array<{ beforeParagraph: number; text: PerLocale; needsReview: boolean }>;
  facts: { values: Partial<Record<JLocale, FactValues>>; needsReview: boolean };
  titles: { es?: string; ja?: string; needsReview: boolean };
}

export const CURATION: Record<JourneyKey, JourneyCuration> = {
  "first-time": {
    tours: [
      // Owner decision 2026-11-10: the homepage's "First visit" tour leads (the
      // essay allows 7 days "at a push"); outside the paired hub by design.
      // Nile Dreamer replaces essential-egypt (owner, 2026-11-10: Alexandria is
      // something the essay leaves out of a first trip).
      { slug: "epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs", why: { en: "Egypt's essential spine in one week — Cairo, the night train south, a three-night Nile cruise and Luxor." }, needsReview: false },
      { slug: "10-days-nile-dreamer-tour-experience", why: { en: "Cairo, the sleeper train south, three nights cruising from Aswan to Luxor, and the Theban temples." }, needsReview: false },
      { slug: "egypt-and-the-nile-tour", why: { en: "Ten days for a first trip that wants depth alongside breadth, with Coptic and Islamic Cairo." }, needsReview: false },
    ],
    hero: { asset: "image-138b5c47b76cd8adafa1cb16b9cee3d2baf4da04-3000x2000-jpg", alt: {"en": "A motorboat on the Nile passes the Old Cataract hotel on the Aswan riverbank.", "es": "Una lancha en el Nilo pasa frente al hotel Old Cataract en la orilla de Asuán.", "ja": "ナイル川を進むボートと、アスワンの川辺に立つオールド・カタラクト・ホテル。"}, needsReview: false },
    subheadings: [
      { beforeParagraph: 0, text: { en: "The itinerary we are asked for" }, needsReview: true },
      { beforeParagraph: 2, text: { en: "Cairo and the river" }, needsReview: true },
      { beforeParagraph: 3, text: { en: "Two decisions" }, needsReview: true },
      { beforeParagraph: 6, text: { en: "Between the two, the boat" }, needsReview: true },
      { beforeParagraph: 7, text: { en: "What to leave out" }, needsReview: true },
    ],
    facts: { values: { en: {"length": "8–10 days (7 at a push)", "route": "Cairo · Aswan · the river · Luxor", "pace": "Two anchors a day, afternoons free", "season": "October–April; summer works on the water", "suits": "The essential story told well, not a checklist"} }, needsReview: true },
    titles: { es: "Primer viaje a Egipto: cómo planificarlo, con los viajes que elegiríamos | Travel2Egypt", ja: "はじめてのエジプト旅行：計画のしかたと私たちが選ぶツアー | Travel2Egypt", needsReview: true },
  },
  "cultural": {
    tours: [
      { slug: "a-9-day-egypt-tour-of-culture-and-history", why: { en: "Luxor, Edfu, Kom Ombo and Aswan by river, then Saqqara and Old Cairo to close." }, needsReview: false },
      { slug: "10-day-egypt-travel-journey-through-history", why: { en: "Cairo's older layers, Alexandria, the Nubian south and Luxor on both banks, with the pyramids reserved for the closing day." }, needsReview: false },
    ],
    hero: { asset: "image-f453f47b2d0a1c863c20271e32313e322886a539-3000x2000-jpg", alt: {"en": "Crowds walk the ram-headed sphinx avenue between the towering pylons of Karnak Temple, Luxor.", "es": "Multitudes recorren la avenida de esfinges con cabeza de carnero entre los pilonos del templo de Karnak, Luxor.", "ja": "ルクソールのカルナック神殿、雄羊頭スフィンクスの参道を高い塔門の間を人々が歩く。"}, needsReview: false },
    subheadings: [
      { beforeParagraph: 1, text: { en: "Cairo in layers" }, needsReview: true },
      { beforeParagraph: 2, text: { en: "The desert monasteries" }, needsReview: true },
      { beforeParagraph: 3, text: { en: "The ancient sites, read" }, needsReview: true },
      { beforeParagraph: 4, text: { en: "Nubian Aswan" }, needsReview: true },
      { beforeParagraph: 5, text: { en: "The guide" }, needsReview: true },
    ],
    facts: { values: { en: {"length": "9–12 days", "route": "Cairo · desert monasteries · Luxor & Abydos · Aswan", "pace": "Fewer sites, longer at each", "season": "October–April (Ramadan reshapes, not closes)", "suits": "Readers who want a guide who goes off-script"} }, needsReview: true },
    titles: { es: "Viajes culturales por Egipto: cómo planificar un viaje más profundo | Travel2Egypt", ja: "エジプトの文化・歴史の旅：深く巡る旅の計画 | Travel2Egypt", needsReview: true },
  },
  "family": {
    tours: [
      { slug: "cairo-and-alexandria-4-days-family-package", why: { en: "A short Cairo-and-Alexandria trip paced for children roughly 5 to 14." }, needsReview: false },
      { slug: "9-day-classic-egypt-family-adventure", why: { en: "The classic Cairo-and-cruise shape, paced for school-age children on a first visit." }, needsReview: false },
      { slug: "11-day-the-splendor-of-egypt-tour", why: { en: "Eleven family-paced days from the Giza plateau to Abu Simbel, Luxor's two banks, and the Red Sea." }, needsReview: false },
    ],
    hero: { asset: "image-92932570f3ee70b7b294ec8ba6d62bfd33d0f92c-3000x2000-jpg", alt: {"en": "Traditional felucca sailing boats on the calm Nile at Aswan with desert hills beyond", "es": "Falucas tradicionales en el Nilo en calma, en Asuán, con las colinas del desierto al fondo", "ja": "砂漠の丘を背景に、アスワンの穏やかなナイル川に浮かぶ伝統的なフェルッカ"}, needsReview: false },
    subheadings: [
      { beforeParagraph: 0, text: { en: "Two worries" }, needsReview: true },
      { beforeParagraph: 2, text: { en: "Cairo, in short strikes" }, needsReview: true },
      { beforeParagraph: 3, text: { en: "The Nile does the work" }, needsReview: true },
      { beforeParagraph: 4, text: { en: "The Red Sea, last" }, needsReview: true },
      { beforeParagraph: 5, text: { en: "Two practical truths" }, needsReview: true },
    ],
    facts: { values: { en: {"length": "10–12 days (8 without the Red Sea)", "route": "Cairo · the Nile by boat · the Red Sea", "pace": "One anchor a morning; afternoons at the pool", "season": "October–April; Christmas and Easter book first", "suits": "Families with school-age children"} }, needsReview: true },
    titles: { es: "Egipto con niños: cómo planificar un viaje en familia | Travel2Egypt", ja: "子ども連れのエジプト：家族旅行の計画のしかた | Travel2Egypt", needsReview: true },
  },
  "desert": {
    tours: [
      { slug: "3-day-bahariya-white-desert-tour", why: { en: "Bahariya, the Black and White Deserts, and one night camped under the stars in the White Desert." }, needsReview: false },
      { slug: "4-days-white-desert-wadi-al-hittan-exploration", why: { en: "From the fossil whales of Fayoum to the chalk formations of the White Desert, in a short window." }, needsReview: false },
      { slug: "bahariya-and-siwa-oasis-vacation", why: { en: "A week where the desert is the destination rather than a detour." }, needsReview: false },
    ],
    hero: { asset: "image-9ab09b35633ce1d0aafb1837f6c56786d370ddf7-3000x2000-jpg", alt: {"en": "Wind-carved chalk rock formations rising from golden dunes in Egypt's White Desert.", "es": "Formaciones de roca caliza talladas por el viento sobre dunas doradas en el Desierto Blanco de Egipto.", "ja": "エジプトの白砂漠で、黄金の砂丘から立ち上がる風に削られた白亜の岩。"}, needsReview: false },
    subheadings: [
      { beforeParagraph: 1, text: { en: "A night in the White Desert" }, needsReview: true },
      { beforeParagraph: 3, text: { en: "The gentler desert" }, needsReview: true },
      { beforeParagraph: 4, text: { en: "How much of the trip?" }, needsReview: true },
    ],
    facts: { values: { en: {"length": "2 days, 1 night (4–5 if the desert is the trip)", "route": "Cairo · Bahariya · White Desert (or Fayoum)", "pace": "One long drive, then almost nothing scheduled", "season": "October–April; winter nights near zero", "suits": "A counterweight to the temples"} }, needsReview: true },
    titles: { es: "El Desierto Occidental de Egipto: cómo planificar un viaje al desierto | Travel2Egypt", ja: "エジプト西方砂漠：砂漠の旅の計画 | Travel2Egypt", needsReview: true },
  },
  "style": {
    tours: [
      { slug: "marriott-mena-house-4-days-stay", why: { en: "A short stay where the Mena House is part of the trip, not a base camp." }, needsReview: false },
      { slug: "9-days-egypt-prestigious-vacation", why: { en: "The full arc without rushing, including a real stay at the Old Cataract (Mandarin Oriental) in Aswan." }, needsReview: false },
      { slug: "the-egypt-royal-vacation-tour", why: { en: "Aswan and Luxor in depth, with a yacht on the river and a flexible itinerary." }, needsReview: false },
    ],
    hero: { asset: "image-7c494d6b99d05164005da7df3e982ed9d897d1bb-4000x2667-jpg", alt: {"en": "Lamplit palm gardens of a Giza hotel at dusk with the floodlit pyramids rising behind", "es": "Jardines de palmeras iluminados de un hotel de Guiza al anochecer, con las pirámides iluminadas alzándose detrás", "ja": "夕暮れ、ライトに照らされたギザのホテルのヤシの庭園。背後にライトアップされたピラミッドがそびえる。"}, needsReview: false },
    subheadings: [
      { beforeParagraph: 1, text: { en: "The river under sail" }, needsReview: true },
      { beforeParagraph: 2, text: { en: "Hotels that are sites" }, needsReview: true },
      { beforeParagraph: 3, text: { en: "One Egyptologist, throughout" }, needsReview: true },
      { beforeParagraph: 4, text: { en: "The part you never see" }, needsReview: true },
      { beforeParagraph: 5, text: { en: "A register above" }, needsReview: true },
    ],
    facts: { values: { en: {"length": "10–14 days, unhurried", "route": "Cairo · the Nile under sail · Aswan", "pace": "Sites at their best hour, as empty as timing allows", "season": "October–April; dahabiyas book out first", "suits": "Those who want to think about nothing"} }, needsReview: true },
    titles: { es: "Viajes de lujo a Egipto: cómo planificarlos | Travel2Egypt", ja: "エジプトのラグジュアリー旅行：計画のしかた | Travel2Egypt", needsReview: true },
  },
  "coming-back": {
    tours: [
      { slug: "3-day-siwa-journey-from-alexandria", why: { en: "From the Mediterranean down to Siwa Oasis: El Alamein, the Great Sand Sea and the Oracle Alexander travelled to consult." }, needsReview: false },
      { slug: "desert-horizons-7-day-bahariya-siwa-oasis-tour", why: { en: "The White Desert, the Great Sand Sea and Siwa, for repeat visitors drawn to silence and scale." }, needsReview: false },
      { slug: "10-day-nile-and-western-desert-tour", why: { en: "The Western Desert oases and the White Desert between two historical bookends, for repeat visitors." }, needsReview: false },
    ],
    hero: { asset: "image-bb2e3ad0026632ec09a1659559ff66f97c87b04e-3000x2000-jpg", alt: {"en": "A small group rests on a desert dune at sunset beside a 4x4 in Egypt's Western Desert.", "es": "Un grupo descansa en una duna del desierto al atardecer junto a un todoterreno en el desierto occidental de Egipto.", "ja": "日没のエジプト西部砂漠で、四輪駆動車のそばの砂丘に小グループが休む。"}, needsReview: false },
    subheadings: [
      { beforeParagraph: 1, text: { en: "What the first trip bought you" }, needsReview: true },
      { beforeParagraph: 2, text: { en: "Middle Egypt" }, needsReview: true },
      { beforeParagraph: 3, text: { en: "Alexandria and the sea" }, needsReview: true },
      { beforeParagraph: 4, text: { en: "The Western Desert oases" }, needsReview: true },
    ],
    facts: { values: { en: {"length": "7–10 days for one region", "route": "Middle Egypt · Alexandria · Siwa (choose one)", "pace": "Slower than the first trip; one anchor a day", "season": "October–April; Alexandria best when Cairo is hottest", "suits": "Those who have done Cairo and the river"} }, needsReview: true },
    titles: { es: "Volver a Egipto: cómo planificar un segundo viaje | Travel2Egypt", ja: "ふたたびのエジプト：2度目の旅の計画 | Travel2Egypt", needsReview: true },
  },
};

/** Approved-only view of a journey's curation, for one locale. */
export function approved(key: JourneyKey, locale: JLocale) {
  const c = CURATION[key];
  return {
    tours: c.tours.filter((t) => !t.needsReview).map((t) => ({ slug: t.slug, why: t.why[locale] ?? null })),
    hero: c.hero && !c.hero.needsReview ? { asset: c.hero.asset, alt: c.hero.alt[locale] ?? c.hero.alt.en ?? '' } : null,
    subheadings: c.subheadings
      .filter((s) => !s.needsReview && s.text[locale])
      .map((s) => ({ beforeParagraph: s.beforeParagraph, text: s.text[locale] as string })),
    facts: c.facts.needsReview ? null : (c.facts.values[locale] ?? null),
    title: locale !== 'en' && !c.titles.needsReview ? (c.titles[locale] ?? null) : null,
  };
}
