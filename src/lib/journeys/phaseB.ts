/**
 * Journey pages Phase B — proposals (B1: First time in Egypt only, 2026-11-10).
 *
 * Same rule as curation.ts: every item is a PROPOSAL until the owner approves
 * it in review/journeys/journeys-phase-b-{slug}-{en,es,ja}.md. Items with
 * `needsReview: true` never render; approving = `needsReview: false` (with
 * any corrected wording); rejected items are deleted.
 *
 * Text is per locale. A locale renders an item only when that locale's text
 * exists, so ES/JA show nothing new until their own review files are approved
 * and their text is added here — even after the EN item is approved.
 *
 * Every sentence below is taken from the journey essay or a site page; the
 * review file quotes the source for each one.
 */
import type { PlaceKey } from '@/lib/places/coords';

import type { JLocale, JourneyKey } from './registry';

type PerLocale = Partial<Record<JLocale, string>>;

export interface PhaseBRoute {
  /** Stops in order (a return to an earlier stop is allowed). */
  stops: PlaceKey[];
  /** Section heading, per locale (also gates the locale). */
  heading: PerLocale;
  needsReview: boolean;
}
export interface PhaseBDays {
  /** The essay's own length advice — the approved facts "Length" value. */
  line: PerLocale;
  needsReview: boolean;
}
export interface PhaseBImage {
  /** Sanity image asset _id (company library, ≥1600px wide). */
  asset: string;
  /** Intrinsic width / height, for the fixed aspect ratio. */
  width: number;
  height: number;
  alt: PerLocale;
}
export interface PhaseBExperience {
  id: string;
  title: PerLocale;
  body: PerLocale;
  /** EN pathname (next-intl localizes it) of the page describing it. */
  href: string;
  image: PhaseBImage;
  needsReview: boolean;
}
export interface PhaseBEssayImage {
  /** Rendered after essay paragraph index `afterParagraph` (0-based). */
  afterParagraph: number;
  image: PhaseBImage;
  caption: PerLocale;
  needsReview: boolean;
}
export interface PhaseBPullQuote {
  /** Rendered after essay paragraph index `afterParagraph` (0-based). */
  afterParagraph: number;
  /** A sentence copied exactly from that locale's essay. */
  text: PerLocale;
  needsReview: boolean;
}
export interface PhaseBQuestion {
  id: string;
  question: PerLocale;
  answer: PerLocale;
  /** EN pathname of the full guide page ("Read more →"). */
  href: string;
  needsReview: boolean;
}
export interface PhaseB {
  route: PhaseBRoute | null;
  days: PhaseBDays | null;
  experiencesHeading: { text: PerLocale; needsReview: boolean } | null;
  experiences: PhaseBExperience[];
  essayImages: PhaseBEssayImage[];
  pullQuote: PhaseBPullQuote | null;
  questionsHeading: { text: PerLocale; needsReview: boolean } | null;
  questions: PhaseBQuestion[];
}

const EMPTY: PhaseB = {
  route: null,
  days: null,
  experiencesHeading: null,
  experiences: [],
  essayImages: [],
  pullQuote: null,
  questionsHeading: null,
  questions: [],
};

export const PHASE_B: Record<JourneyKey, PhaseB> = {
  'first-time': {
    route: {
      stops: ['cairo', 'aswan', 'luxor', 'cairo'],
      heading: { en: 'The route' },
      needsReview: true,
    },
    days: {
      // = the approved facts "Length" value (curation.ts), not new copy.
      line: { en: '8–10 days (7 at a push)' },
      needsReview: true,
    },
    experiencesHeading: { text: { en: 'Three moments that make a first trip' }, needsReview: true },
    experiences: [
      {
        id: 'cairo-two-days',
        title: { en: 'Two full days in Cairo' },
        body: {
          en: 'The plateau deserves an unhurried half day on its own, the museum another, and the city an evening at minimum. We plan two full days in Cairo and have rarely met a traveller who regretted the second one.',
        },
        href: '/guide/cairo',
        image: {
          asset: 'image-deff6c1486c9f3708f13bc8f552f147b9c186dc7-3840x2552-jpg',
          width: 3840,
          height: 2552,
          alt: { en: 'The three Pyramids of Giza rising from golden desert sand beneath a clear pale-blue sky' },
        },
        needsReview: true,
      },
      {
        id: 'aswan-first',
        title: { en: 'Aswan, the river at its calmest' },
        body: {
          en: "Cairo's opening days, then a flight to Aswan — the gentlest city on the Egyptian Nile — before the boat carries you downstream to Luxor's density. Aswan gives you the river at its calmest while you are still finding your feet: granite islands, Nubian villages, feluccas moving without engines.",
        },
        href: '/guide/aswan',
        image: {
          asset: 'image-e99821270cbedea94709a56a413cb7d61fc732da-3000x1999-jpg',
          width: 3000,
          height: 1999,
          alt: { en: 'Two white-sailed feluccas gliding down the Nile past golden dunes and rocky green banks' },
        },
        needsReview: true,
      },
      {
        id: 'the-boat',
        title: { en: 'Temples approached from the water' },
        body: {
          en: "A three- or four-night sailing between Aswan and Luxor remains the best answer to a first trip's middle chapters. The temples along this stretch were built to be approached from the water, and arriving the way they were designed to be arrived at is a difference you feel rather than notice.",
        },
        href: '/nile-cruises',
        image: {
          asset: 'image-dfa2b0caf6abaa07f7aac3ea8fcb80c81a2f611c-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: "Nile cruise ships moored at Luxor with Luxor Temple's colonnade reflected in the water." },
        },
        needsReview: true,
      },
    ],
    essayImages: [
      {
        // After "The first is Cairo. Most itineraries give it a single day…"
        afterParagraph: 4,
        image: {
          asset: 'image-9e07424760c96832dbf9aca42b91a508a05b787a-3000x2250-jpg',
          width: 3000,
          height: 2250,
          alt: { en: 'Colossal statue of Ramses II standing in the vast sunlit atrium of the Grand Egyptian Museum' },
        },
        caption: { en: 'The colossal statue of Ramesses II in the atrium of the Grand Egyptian Museum.' },
        needsReview: true,
      },
      {
        // After "The second is the order. The conventional route lands in Cairo…"
        afterParagraph: 5,
        image: {
          asset: 'image-02a120aeff72e3f72895c601bc0aa6a995618549-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: 'The avenue of ram-headed sphinxes leading to the first pylon of Karnak Temple in Luxor.' },
        },
        caption: { en: 'The avenue of ram-headed sphinxes leading to the first pylon of Karnak, Luxor.' },
        needsReview: true,
      },
    ],
    pullQuote: {
      afterParagraph: 2,
      text: { en: 'The first trip has one job, and it is a good one: the essential story, told in order, at a speed that lets it land.' },
      needsReview: true,
    },
    questionsHeading: { text: { en: 'Questions first-time travellers ask' }, needsReview: true },
    questions: [
      {
        id: 'how-many-days',
        question: { en: 'How many days do I need?' },
        answer: {
          en: 'One week combines Cairo, Luxor, and Aswan. 7 days is the shortest length to combine Cairo and Upper Egypt meaningfully. 10 or more days makes room to add Abu Simbel, a Nile cruise, the Red Sea, or Sinai to match purpose.',
        },
        href: '/blog/the-best-egypt-travel-itineraries',
        needsReview: true,
      },
      {
        id: 'best-time',
        question: { en: 'When is the best time to go?' },
        answer: {
          en: 'For inland sightseeing — Cairo, Luxor, Aswan, the West Bank temples — the optimal window is late October through early March. The November-through-February core is the most comfortable. December and January carry the highest prices and tightest bookings, particularly the Christmas-New Year fortnight. Late March through April is workable but Khamsin-prone. May is too hot for most travellers.',
        },
        href: '/travel-tips/egypt-weather-guide',
        needsReview: true,
      },
      {
        id: 'visa',
        question: { en: 'Do I need a visa?' },
        answer: {
          en: 'Egypt requires a passport valid for at least six months beyond the date of departure. For most nationalities — including citizens of the UK, the US, the EU countries, Canada, Australia, Japan, and South Korea — Egypt offers two practical routes: an e-Visa obtained online before departure, or a visa on arrival bought at the airport. Both produce the same thing: a single-entry tourist visa that generally allows a stay of up to 30 days.',
        },
        href: '/travel-tips/passport-and-visa',
        needsReview: true,
      },
      {
        // Reworded from "What does a first trip cost?": the site has no
        // whole-trip cost page, only the entrance-fees guide.
        id: 'entrance-fees',
        question: { en: 'How much are entrance fees?' },
        answer: {
          en: "Egypt's entrance fees are not particularly expensive by international standards. Ticket prices at Egyptian sites have increased periodically and sometimes significantly in recent years. Transport, guides, food, and incidentals are additional. Entrance fees in Egypt are ultimately the smallest variable in what makes a trip work.",
        },
        href: '/travel-tips/attractions-entrance-fees',
        needsReview: true,
      },
    ],
  },
  cultural: EMPTY,
  family: EMPTY,
  desert: EMPTY,
  style: EMPTY,
  'coming-back': EMPTY,
};

const has = (t: PerLocale | undefined, l: JLocale): t is PerLocale & Record<typeof l, string> => Boolean(t?.[l]);

/** Approved-only Phase B view of a journey, for one locale. */
export function approvedB(key: JourneyKey, L: JLocale) {
  const b = PHASE_B[key];
  const img = (i: PhaseBImage) => ({ asset: i.asset, width: i.width, height: i.height, alt: i.alt[L] ?? '' });
  const expHeading = b.experiencesHeading && !b.experiencesHeading.needsReview ? (b.experiencesHeading.text[L] ?? null) : null;
  const qHeading = b.questionsHeading && !b.questionsHeading.needsReview ? (b.questionsHeading.text[L] ?? null) : null;
  return {
    route: b.route && !b.route.needsReview && has(b.route.heading, L) ? { stops: b.route.stops, heading: b.route.heading[L] as string } : null,
    daysLine: b.days && !b.days.needsReview && has(b.days.line, L) ? (b.days.line[L] as string) : null,
    experiences: expHeading
      ? {
          heading: expHeading,
          items: b.experiences
            .filter((e) => !e.needsReview && has(e.title, L) && has(e.body, L) && has(e.image.alt, L))
            .map((e) => ({ id: e.id, title: e.title[L] as string, body: e.body[L] as string, href: e.href, image: img(e.image) })),
        }
      : null,
    essayImages: b.essayImages
      .filter((e) => !e.needsReview && has(e.caption, L) && has(e.image.alt, L))
      .map((e) => ({ afterParagraph: e.afterParagraph, caption: e.caption[L] as string, image: img(e.image) })),
    pullQuote:
      b.pullQuote && !b.pullQuote.needsReview && has(b.pullQuote.text, L)
        ? { afterParagraph: b.pullQuote.afterParagraph, text: b.pullQuote.text[L] as string }
        : null,
    questions: qHeading
      ? {
          heading: qHeading,
          items: b.questions
            .filter((q) => !q.needsReview && has(q.question, L) && has(q.answer, L))
            .map((q) => ({ id: q.id, question: q.question[L] as string, answer: q.answer[L] as string, href: q.href })),
        }
      : null,
  };
}
export type ApprovedB = ReturnType<typeof approvedB>;
