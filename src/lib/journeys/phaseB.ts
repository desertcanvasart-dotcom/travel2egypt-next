/**
 * Journey pages Phase B — proposals (B1: First time in Egypt, 2026-11-10;
 * B2: the other five journeys, 2026-11-11).
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
  // ── Phase B2 (2026-11-11): the other five journeys, same six modules. All in
  // review: review/journeys/journeys-phase-b-{cultural,family,desert,style,coming-back}-en.md
  cultural: {
    route: {
      // Route fact "Cairo · desert monasteries · Luxor and Abydos · Aswan";
      // the monasteries = Wadi El Natrun (essay ¶3); Abydos before Luxor going south.
      stops: ['cairo', 'wadi-el-natrun', 'abydos', 'luxor', 'aswan'],
      heading: { en: 'The route' },
      needsReview: true,
    },
    days: { line: { en: '9–12 days' }, needsReview: true },
    experiencesHeading: { text: { en: 'Three moments that make a cultural trip' }, needsReview: true },
    experiences: [
      {
        id: 'coptic-cairo',
        title: { en: 'Coptic Cairo, inside the fortress' },
        body: {
          en: 'In one Cairo city block — Coptic Cairo, inside the walls of a Roman fortress — stands a synagogue that was once a church, churches built over the fortress gates, and beneath one of them a crypt where tradition holds the Holy Family sheltered. That block is the whole argument for this trip in miniature: nothing in Egypt replaced what came before it; everything moved in upstairs.',
        },
        href: '/guide/cairo/coptic-cairo',
        image: {
          asset: 'image-811897b6964d78b4c247dfac539ff79414881cf0-3000x2199-jpg',
          width: 3000,
          height: 2199,
          alt: { en: 'Twin white bell towers with crosses above the Hanging Church in Coptic Cairo under a blue sky' },
        },
        needsReview: true,
      },
      {
        id: 'desert-monasteries',
        title: { en: 'Monasteries that still receive visitors' },
        body: {
          en: 'Monasticism — the whole idea of it — began in the Egyptian desert, and the communities that began it are still there. Wadi El Natrun’s monasteries between Cairo and Alexandria; St. Anthony’s by the Red Sea hills, arguably the oldest working monastery on earth. These are not museums with opening hours. They are living houses that receive visitors.',
        },
        href: '/guide/wadi-el-natrun/monastery-of-saint-macarius-the-great',
        image: {
          asset: 'image-5c8413fd36cfa8d10544c07e61557728660bcb4e-2752x1536-jpg',
          width: 2752,
          height: 1536,
          alt: { en: 'Cream mud-brick Coptic monastery domes and cross-topped bell towers rising among palm trees under a blue sky' },
        },
        needsReview: true,
      },
      {
        id: 'nubian-aswan',
        title: { en: 'Nubian Aswan, visited properly' },
        body: {
          en: 'A Nubian village visited properly — with time, over tea, through someone who belongs there — plus Elephantine’s layered ruins and the Nubian Museum, which is the best-told story in any Egyptian museum and criminally under-visited. Nubian Aswan is also simply the gentlest place on this itinerary, and we place it last for that reason.',
        },
        href: '/guide/aswan/the-nubian-museum',
        image: {
          asset: 'image-17aad626d5700a2c586389f7e22c961f37a88131-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: 'Brightly painted Nubian houses with domed roofs, arched yellow doors and blue-washed steps in a riverside village' },
        },
        needsReview: true,
      },
    ],
    essayImages: [
      {
        // After "Start where the layers are thickest…" (names Ibn Tulun).
        afterParagraph: 1,
        image: {
          asset: 'image-ff28778d999ed5a1c12cfebb25fdc87fa8ab15c0-2752x1536-jpg',
          width: 2752,
          height: 1536,
          alt: { en: 'Courtyard of the Mosque of Ibn Tulun in Cairo, with its domed fountain and spiral minaret.' },
        },
        caption: { en: 'The courtyard of the Mosque of Ibn Tulun, Cairo, with its spiral minaret.' },
        needsReview: true,
      },
      {
        // After "The ancient sites are still on this trip…" (names Abydos and Seti I).
        afterParagraph: 3,
        image: {
          asset: 'image-61b5ef1b3881b909321799ca23108d45c1c1f4dc-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: 'Hieroglyph-carved temple wall at Abydos catching warm light, the colonnaded Temple of Seti I beyond at dusk' },
        },
        caption: { en: 'Carved hieroglyphs at Abydos, with the Temple of Seti I beyond.' },
        needsReview: true,
      },
    ],
    pullQuote: {
      afterParagraph: 2,
      text: { en: 'The cultural traveller is the one who wants the whole book.' },
      needsReview: true,
    },
    questionsHeading: { text: { en: 'Questions cultural travellers ask' }, needsReview: true },
    questions: [
      {
        id: 'religious-dress',
        question: { en: 'What should I wear to mosques, churches and monasteries?' },
        answer: {
          en: 'Cover shoulders and knees, for both men and women, at every religious site — mosque, church, or monastery. Loose, lightweight clothing handles both the modesty expectation and the heat. Women entering mosques are generally expected to cover their hair; carrying a light scarf solves this and is useful at unexpectedly conservative churches too. Many major mosques lend wraps or robes at the entrance to visitors who arrive underdressed.',
        },
        href: '/travel-tips/visiting-a-religious-site',
        needsReview: true,
      },
      {
        id: 'mosque-visits',
        question: { en: 'Can non-Muslims visit mosques?' },
        answer: {
          en: 'Most historic mosques welcome non-Muslim visitors outside prayer times. The major prayer of the week is the Friday midday congregational prayer, when mosques are busiest and visitor access is most restricted. Visitors should expect to remove their shoes before entering the prayer hall — carrying them, or leaving them at the designated rack — and to move quietly around the edges of the space rather than across the centre, particularly if anyone is praying.',
        },
        href: '/travel-tips/visiting-a-religious-site',
        needsReview: true,
      },
      {
        id: 'monasteries',
        question: { en: 'Can I visit the desert monasteries?' },
        answer: {
          en: 'The Monastery of Saint Macarius is normally visited by private car or as part of a Wadi Al-Natron monastery day from Cairo, around 92 kilometres from the capital. As with all working monasteries, access is shaped by liturgical schedules, fasting seasons, monastic needs, security arrangements, and restoration work. Visitors should dress modestly, speak quietly, avoid photography unless clearly permitted, and accept that some churches or internal areas may be closed without notice.',
        },
        href: '/guide/wadi-el-natrun/monastery-of-saint-macarius-the-great',
        needsReview: true,
      },
      {
        id: 'ramadan',
        question: { en: 'What changes during Ramadan?' },
        answer: {
          en: 'Ramadan rearranges the Egyptian day more completely than any other period of the year. Museums and archaeological sites usually stay open but frequently on reduced schedules. For a visitor, the practical effect is that mornings are the productive window and the hour around sunset belongs to iftar, the breaking of the fast. Travelling during Ramadan is not difficult, but it rewards planning around the shifted rhythm rather than against it.',
        },
        href: '/travel-tips/opening-hours-and-public-holidays',
        needsReview: true,
      },
    ],
  },
  family: {
    route: {
      // Route fact "Cairo · Nile cruise · Red Sea"; the cruise is the Aswan →
      // Luxor leg (as on the First-time map); the Red Sea = Hurghada (the
      // essay's weave links the Hurghada guide).
      stops: ['cairo', 'aswan', 'luxor', 'hurghada'],
      heading: { en: 'The route' },
      needsReview: true,
    },
    days: { line: { en: '10–12 days (8 without the Red Sea)' }, needsReview: true },
    experiencesHeading: { text: { en: 'Three moments that make a family trip' }, needsReview: true },
    experiences: [
      {
        id: 'cairo-mornings',
        title: { en: 'Cairo in short, vivid strikes' },
        body: {
          en: 'Cairo first, taken in short, vivid strikes: the Giza plateau early, one pyramid interior while it is still cool, the Tutankhamun galleries taken at a child’s speed — which is fast through some rooms and transfixed in others — and the afternoon at the hotel pool, on purpose. Two anchors a day is our rule for adults; with children it is one, and it happens in the morning.',
        },
        href: '/guide/giza/the-great-pyramid-of-khufu',
        image: {
          asset: 'image-b4af83c55481b9230163d764f2cf78b68c644345-3000x1999-jpg',
          width: 3000,
          height: 1999,
          alt: { en: 'Young boy in a straw hat sitting cross-legged, gazing at the Great Sphinx and a pyramid at Giza' },
        },
        needsReview: true,
      },
      {
        id: 'the-boat',
        title: { en: 'Unpack once, on the Nile' },
        body: {
          en: 'A cruise means unpacking once. It means the pool is thirty metres from the temple gangway, the kitchen already knows what your children eat, and the distances between sites cross themselves while everyone sleeps. Temples come one per morning — Kom Ombo’s crocodiles and Edfu’s falcon are reliable hits — and the deck does the rest.',
        },
        href: '/nile-cruises',
        image: {
          asset: 'image-00569fd84a0dc0b81185b77f8eed59fc35e12a3d-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: 'Nile cruise ship moored below the riverside ruins of Kom Ombo Temple in golden evening light' },
        },
        needsReview: true,
      },
      {
        id: 'red-sea-last',
        title: { en: 'The Red Sea, last' },
        body: {
          en: 'Ending there, rather than starting, gives the trip somewhere to exhale. Three or four nights of reef and pool after the sites are done, when the early mornings have been earned and nobody has to set an alarm. Children remember Egypt as the place with the mummies and the fish, which is a better souvenir than any itinerary can print.',
        },
        href: '/guide/hurghada',
        image: {
          asset: 'image-1d907d8b7a7b24d585ba9abbb195287c671a6bea-3000x1999-jpg',
          width: 3000,
          height: 1999,
          alt: { en: 'Shoals of orange anthias and reef fish above a coral reef in the clear Red Sea.' },
        },
        needsReview: true,
      },
    ],
    essayImages: [
      {
        // After "Consider what this country offers an eight-year-old…" (painted tombs).
        afterParagraph: 1,
        image: {
          asset: 'image-c920272660003276cfbddadf34a65f7f93490d63-3000x1999-jpg',
          width: 3000,
          height: 1999,
          alt: { en: 'Painted tomb wall covered in rows of colourful ancient Egyptian hieroglyphs and figures' },
        },
        caption: { en: 'A painted tomb wall, covered in rows of hieroglyphs and figures.' },
        needsReview: true,
      },
      {
        // After "Then the Nile…" (Edfu's falcon).
        afterParagraph: 3,
        image: {
          asset: 'image-46e54696e8dd7dc627e89df20f34ee58d3cebbe5-3000x1992-jpg',
          width: 3000,
          height: 1992,
          alt: { en: 'Sunlit temple relief of a crowned goddess facing the falcon-headed god Horus, carved in pale stone' },
        },
        caption: { en: 'A temple relief of the falcon-headed god Horus.' },
        needsReview: true,
      },
    ],
    pullQuote: {
      afterParagraph: 2,
      text: { en: 'Children do not need Egypt explained to them; they need it paced for them.' },
      needsReview: true,
    },
    questionsHeading: { text: { en: 'Questions families ask' }, needsReview: true },
    questions: [
      {
        id: 'daily-rhythm',
        question: { en: 'What does a day look like with young children?' },
        answer: {
          en: "The single most useful adjustment for travelling in Egypt with young children is shifting the day's centre of gravity earlier. Be at a major site — the Pyramids, Karnak, Luxor Temple, the Valley of the Kings — by 7:00 am, in the first hour after gates open. Be back at the hotel by 11:00 am. Pool time, lunch, and nap or quiet hour through the hottest part of the day, roughly noon to 4:00 pm.",
        },
        href: '/travel-tips/traveling-with-kids',
        needsReview: true,
      },
      {
        id: 'cruise-children',
        question: { en: 'Is a Nile cruise good for children?' },
        answer: {
          en: "Nile cruises are particularly well-suited to families with children aged five to nine. The boat provides routine, predictable meals, a pool, evening entertainment, and a fixed bedroom that does not need to be repacked each night. The cruise pace — one or two temple visits per day with substantial onboard downtime — matches young children's stamina better than a land-based itinerary covering the same sites would.",
        },
        href: '/travel-tips/traveling-with-kids',
        needsReview: true,
      },
      {
        id: 'best-sites',
        question: { en: 'Which sites work best for children?' },
        answer: {
          en: 'The Pyramids of Giza are the obvious entry point and work for all ages. The Grand Egyptian Museum is the most child-friendly major museum in Egypt. Karnak allows roaming. The Valley of the Kings is harder for under-fives. Children from about seven upwards usually engage well, particularly if given specific tombs to focus on. Red Sea snorkelling is the most reliably joyful family activity in Egypt.',
        },
        href: '/travel-tips/traveling-with-kids',
        needsReview: true,
      },
      {
        id: 'food-water',
        question: { en: 'What about food and water?' },
        answer: {
          en: 'Egyptian food is generally accessible to young palates, though the specific dishes that work for adults are not always the dishes that work for children. Bottled water always, for everyone in the family. Carry more bottled water than seems necessary; Egyptian heat dehydrates children faster than the conditions feel from inside an air-conditioned car or hotel lobby.',
        },
        href: '/travel-tips/traveling-with-kids',
        needsReview: true,
      },
    ],
  },
  desert: {
    route: {
      // Route fact "Cairo · Bahariya · White Desert (or Fayoum)": the White
      // Desert line, back to Cairo. "(or Fayoum)" is an alternative, not a stop.
      stops: ['cairo', 'bahariya', 'white-desert', 'cairo'],
      heading: { en: 'The route' },
      needsReview: true,
    },
    days: { line: { en: '2 days for the White Desert, 1–2 for Fayoum (4–5 if the desert is the trip)' }, needsReview: true },
    experiencesHeading: { text: { en: 'Three moments that make a desert trip' }, needsReview: true },
    experiences: [
      {
        id: 'white-desert-night',
        title: { en: 'A night in the White Desert' },
        body: {
          en: "What the wind has carved there — mushrooms, spires, shapes the guides have named and shapes they haven't — photographs like another planet and behaves like one too. Camp goes up among the formations. Dinner is cooked over fire. A fennec fox will very likely visit, because they have learned what camps mean.",
        },
        href: '/guide/farafra-oasis/white-desert-national-park',
        image: {
          asset: 'image-a96cbad739d78a9ad2ecfdc2cf2d64d424b8e4f2-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: 'Two blackened tea pots warming beside a desert campfire on the sand at dusk' },
        },
        needsReview: true,
      },
      {
        id: 'fayoum',
        title: { en: 'Fayoum, the gentler desert' },
        body: {
          en: 'Fayoum is barely two hours from Cairo and holds an astonishing amount in a small compass. Fayoum works as a long day from Cairo or, better, as a soft overnight in Tunis with a hotel bed, which makes it the desert for travellers who want the silence without the sleeping bag.',
        },
        href: '/guide/al-fayoum',
        image: {
          asset: 'image-cfe2b087d7a14487156df17977e622578d4480dc-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: "Sandstone bluffs overlook the still blue waters of Lake Qarun in Egypt's Fayoum depression." },
        },
        needsReview: true,
      },
      {
        id: 'valley-of-the-whales',
        title: { en: 'The Valley of the Whales' },
        body: {
          en: 'Wadi El Hitan, the Valley of the Whales, where forty-million-year-old skeletons lie in the open sand, whales with the last traces of the legs they were in the process of losing. Evolution, written where you can walk up and read it.',
        },
        href: '/guide/al-fayoum/wadi-al-hittan',
        image: {
          asset: 'image-04baa4450af912d360e6637d76637c278559f2c0-3000x2001-jpg',
          width: 3000,
          height: 2001,
          alt: { en: 'A fossilised whale skeleton on display in the Wadi al-Hitan museum in Fayoum.' },
        },
        needsReview: true,
      },
    ],
    essayImages: [
      {
        // After "That night usually happens in the White Desert…" (the Black Desert's hills).
        afterParagraph: 1,
        image: {
          asset: 'image-8ff5fe847168778859f87211f296dc12e5d9a0c4-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: "Sweeping view of the Black Desert's dark volcanic hills over golden sand under a cloud-streaked sky" },
        },
        caption: { en: 'The dark hills of the Black Desert.' },
        needsReview: true,
      },
      {
        // After "Dawn in the chalk is the other half of the argument…"
        afterParagraph: 2,
        image: {
          asset: 'image-ae477d9e60860b06c910e194d3ed6eb2b7df0077-3000x2010-jpg',
          width: 3000,
          height: 2010,
          alt: { en: 'Wind-carved white chalk rock formations, one shaped like a mushroom, on the desert floor under a blue sky' },
        },
        caption: { en: 'Wind-carved chalk formations, one shaped like a mushroom.' },
        needsReview: true,
      },
    ],
    pullQuote: {
      afterParagraph: 3,
      text: {
        en: 'And then the main event, which is nothing at all: no light on any horizon, the Milky Way at full strength, and a silence so complete most people realise they have never actually heard one before.',
      },
      needsReview: true,
    },
    questionsHeading: { text: { en: 'Questions desert travellers ask' }, needsReview: true },
    questions: [
      {
        id: 'camp-or-day',
        question: { en: 'Is a day visit enough, or should I camp?' },
        answer: {
          en: 'A one-night camp is the minimum experience that does the landscape justice. The difference between arriving for a late afternoon visit and spending a night among the formations — watching the light change through dusk, seeing the chalk glow under moonlight, waking to the formations at sunrise — is not marginal. Guides provide food, water, camping equipment, and route knowledge. There are no facilities inside the park in the ordinary sense.',
        },
        href: '/guide/farafra-oasis/white-desert-national-park',
        needsReview: true,
      },
      {
        id: 'how-cold',
        question: { en: 'How cold are desert nights?' },
        answer: {
          en: 'Day and night temperature swings can be sharp, often fifteen to twenty degrees Celsius between afternoon and midnight. In the White Desert, which lies 45 kilometres north of Qasr al-Farafra, winter nights can drop sharply toward freezing — cold enough that camping requires a proper sleeping bag rated for low temperatures, not a summer bag. Bring real warm layers, not just a light scarf.',
        },
        href: '/guide/farafra-oasis/weather-in-farafra-oasis',
        needsReview: true,
      },
      {
        id: 'best-time',
        question: { en: 'When is the best time to go?' },
        answer: {
          en: 'October through April is the sensible season. November to February are the best months for camping. Summer temperatures regularly exceed 45 degrees Celsius; camping is not advisable, and most safari operators suspend or severely reduce desert operations.',
        },
        href: '/guide/farafra-oasis/white-desert-national-park',
        needsReview: true,
      },
      {
        id: 'park-rules',
        question: { en: 'Are there rules in the White Desert?' },
        answer: {
          en: 'Rules that remain in effect: vehicles must stay on designated tracks; no fires except in designated camping areas; no removal of rocks, fossils, chalk, crystals, or any natural material; no littering. The formations look strong. They are not.',
        },
        href: '/guide/farafra-oasis/white-desert-national-park',
        needsReview: true,
      },
    ],
  },
  style: {
    route: {
      // Route fact "Usually Cairo · Nile by dahabiya · Aswan"; the dahabiya
      // leg starts at Luxor ("The most common run is between Luxor and Aswan",
      // /blog/dahabiya-nile-cruises-wind-powered-journey).
      stops: ['cairo', 'luxor', 'aswan'],
      heading: { en: 'The route' },
      needsReview: true,
    },
    days: { line: { en: '10–14 days (unhurried)' }, needsReview: true },
    experiencesHeading: { text: { en: 'Three moments that make a trip in style' }, needsReview: true },
    experiences: [
      {
        id: 'dahabiya',
        title: { en: 'The Nile under sail' },
        body: {
          en: "The fullest version of the Nile is a dahabiya: a shallow-draught sailing boat of eight or ten cabins, or chartered whole, moving under canvas at the river's own speed. A dahabiya moors where the big ships cannot — at islands, at small temples with no queue because there is no dock, at a sandbank for dinner ashore — and it crosses the water in something the ships never offer: quiet.",
        },
        href: '/blog/dahabiya-nile-cruises-wind-powered-journey',
        image: {
          asset: 'image-be5960e1597224e47956aeb75a8d0564731b6c83-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: 'Traditional twin-masted dahabiya sailing boat gliding on the Nile past green banks and desert hills at dusk' },
        },
        needsReview: true,
      },
      {
        id: 'landmark-hotels',
        title: { en: 'Hotels that are themselves sites' },
        body: {
          en: 'Mena House with the Pyramids filling its garden windows; the Old Cataract above the First Cataract at Aswan, still trading on the afternoon light that Agatha Christie wrote by. Staying in them is not a room upgrade, it is an extra monument on the itinerary.',
        },
        href: '/hotels',
        image: {
          asset: 'image-3b78ca1ecd75ac0d22e72eb8e991af791b9c4744-3000x1320-jpg',
          width: 3000,
          height: 1320,
          alt: { en: "The Old Cataract hotel and moored feluccas on the Nile's granite shore at Aswan." },
        },
        needsReview: true,
      },
      {
        id: 'one-egyptologist',
        title: { en: 'One Egyptologist, throughout' },
        body: {
          en: 'Guiding, at this register, means one Egyptologist who is yours for the duration — the same person at Giza and at Philae, building on what you saw yesterday instead of restarting the introduction. And it means access spent where it counts: the site at opening when the light is low and the coaches have not arrived, the tomb visited at the quiet hour, the occasional door that opens early or stays open late.',
        },
        href: '/about',
        image: {
          asset: 'image-5eb7b6bfef891fae731163bfa30495428bfa8934-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: 'Colonnaded forecourt and carved pylons of Philae Temple under a pale blue sky, visitors crossing the paving' },
        },
        needsReview: true,
      },
    ],
    essayImages: [
      {
        // After "Start with the river…" (the ships never offer quiet).
        afterParagraph: 1,
        image: {
          asset: 'image-44d3a1dd7ef59cfc7d829e905eade532214a4929-3000x1992-jpg',
          width: 3000,
          height: 1992,
          alt: { en: 'Cane chairs on a shaded riverboat deck as a large cruise ship passes on the Nile' },
        },
        caption: { en: 'A shaded riverboat deck, with a large cruise ship passing on the Nile.' },
        needsReview: true,
      },
      {
        // After "Guiding, at this register…" (the same person at Giza).
        afterParagraph: 3,
        image: {
          asset: 'image-b620522286b15ca9299ed5d862c5ad852f856404-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: 'The Great Sphinx of Giza in front of the Pyramid of Khafre under a clear pale sky' },
        },
        caption: { en: 'The Great Sphinx before the Pyramid of Khafre, Giza.' },
        needsReview: true,
      },
    ],
    pullQuote: {
      afterParagraph: 4,
      text: { en: 'Egypt sells no shortage of private-access moments; the craft is knowing which are worth it and which are theatre.' },
      needsReview: true,
    },
    questionsHeading: { text: { en: 'Questions about travelling in style' }, needsReview: true },
    questions: [
      {
        id: 'dahabiya-sail',
        question: { en: 'Does a dahabiya really sail?' },
        answer: {
          en: "Modern dahabiyas use the sail when there is wind, but they don't run on sail alone. Schedule, safety, wind direction, and river conditions sometimes require a tugboat or an engine. A trustworthy operator says so openly.",
        },
        href: '/blog/dahabiya-nile-cruises-wind-powered-journey',
        needsReview: true,
      },
      {
        id: 'dahabiya-length',
        question: { en: 'How long is a dahabiya trip?' },
        answer: {
          en: 'The most common run is between Luxor and Aswan. A stretch that large ships often handle in three or four nights, a dahabiya may travel over five to seven. Beyond the main temples, places like Esna, Elkab, and Gebel el-Silsila enter the itinerary.',
        },
        href: '/blog/dahabiya-nile-cruises-wind-powered-journey',
        needsReview: true,
      },
      {
        id: 'when-to-book',
        question: { en: 'How far ahead should I book?' },
        answer: {
          en: 'For peak-season travel, book at least six to eight weeks ahead, longer for the Christmas and New Year window. Major heritage hotels — the Old Cataract in Aswan, the Marriott Mena House at Giza, the Cecil in Alexandria — fill quickest.',
        },
        href: '/travel-tips/tips-on-accommodations',
        needsReview: true,
      },
      {
        id: 'best-season',
        question: { en: 'When is the Nile at its best?' },
        answer: {
          en: 'The Nile suits travel best from autumn through spring. From around October to April, the heat is comparatively mild and time on deck is comfortable. December and January are cool and pleasant; they are also a busy period. February and March often balance temperature and crowds well.',
        },
        href: '/blog/dahabiya-nile-cruises-wind-powered-journey',
        needsReview: true,
      },
    ],
  },
  'coming-back': {
    // No route map: the Route fact is "One of: Middle Egypt · Alexandria ·
    // Siwa and the oases" — three alternatives, not one route. A line joining
    // them would draw a trip the essay does not propose (see the review file).
    route: null,
    days: { line: { en: '7–10 days (one region)' }, needsReview: true },
    // "Egypt holds at least three regions worth an entire trip" (essay ¶2).
    experiencesHeading: { text: { en: 'Three regions worth an entire trip' }, needsReview: true },
    experiences: [
      {
        id: 'middle-egypt',
        title: { en: 'Middle Egypt, with no checklist' },
        body: {
          en: 'Beni Hasan, where the Middle Kingdom governors cut their tombs into the cliff and painted them with wrestlers and bird-catchers; Amarna, the capital Akhenaten built in five years and history abandoned in fifteen. The reason first trips leave this out is not quality. It is geometry: the sites are scattered across two hundred kilometres of valley with thin hotel choices, so the region rewards exactly what a returning traveller has — patience, and no checklist.',
        },
        href: '/guide/al-minya',
        image: {
          asset: 'image-b9ebafc3c263853c9910caa842b276e4bb30b342-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: 'The Nile at Al-Minya, palm groves and green fields along the water with the limestone cliffs of Middle Egypt rising behind' },
        },
        needsReview: true,
      },
      {
        id: 'alexandria',
        title: { en: 'Alexandria and the sea' },
        body: {
          en: 'Alexandria and the Mediterranean edge is less a different region than a different country. Greco-Roman instead of pharaonic, sea light instead of desert light, a corniche instead of a river bank. Alexandria is two and a half hours from Cairo by road and a century away in temperament.',
        },
        href: '/guide/alexandria',
        image: {
          asset: 'image-c2f23960cecdfc5bc85caecd2c085dbccf2ba76d-3000x2000-jpg',
          width: 3000,
          height: 2000,
          alt: { en: "Aerial view of the Citadel of Qaitbay guarding Alexandria's harbour and city skyline." },
        },
        needsReview: true,
      },
      {
        id: 'siwa',
        title: { en: 'Siwa, not on the way' },
        body: {
          en: 'This company was born in Siwa, and we will tell you plainly that it is not on the way to anything — eight hours from Cairo, close to the Libyan border, Berber-speaking, and organised around date gardens, salt lakes and the ruins of an oracle Alexander the Great crossed the desert to consult. That inconvenience is the point. Siwa is what Egypt is like when nothing is arranged for an audience.',
        },
        href: '/guide/siwa-oasis',
        image: {
          asset: 'image-8facb16f0510e5e5fd021ba11ad7186d46abfd83-4096x1460-jpg',
          width: 4096,
          height: 1460,
          alt: { en: 'Ruined mudbrick remains of the Temple of the Oracle above palm groves at Siwa Oasis.' },
        },
        needsReview: true,
      },
    ],
    essayImages: [
      {
        // After "Somewhere on your first trip — probably on the West Bank at Luxor…"
        afterParagraph: 0,
        image: {
          asset: 'image-184ef2efa39f30e1be0d403ac57f0462ec1f471d-2752x1536-jpg',
          width: 2752,
          height: 1536,
          alt: { en: 'The two weathered Colossi of Memnon standing on the desert plain near Luxor with tiny visitors below' },
        },
        caption: { en: 'The Colossi of Memnon on the West Bank at Luxor.' },
        needsReview: true,
      },
      {
        // After "The first is Middle Egypt…" (ends on Dendera's painted ceiling).
        afterParagraph: 2,
        image: {
          asset: 'image-85767da3913bceab3d103155a69c01583c98ad34-3000x2003-jpg',
          width: 3000,
          height: 2003,
          alt: { en: "Upward view of Dendera temple's painted columns and ceiling, covered in colourful hieroglyphs and Hathor capitals" },
        },
        caption: { en: 'Painted columns and ceiling inside the temple at Dendera.' },
        needsReview: true,
      },
    ],
    pullQuote: {
      afterParagraph: 3,
      text: { en: 'Here is what the first trip bought you: you have seen the essential story, so you no longer need it.' },
      needsReview: true,
    },
    questionsHeading: { text: { en: 'Questions returning travellers ask' }, needsReview: true },
    questions: [
      {
        id: 'siwa-getting-there',
        question: { en: 'How do I get to Siwa?' },
        answer: {
          en: 'There is no airport, no railway, and no quick final hop that makes the distance disappear. From Cairo, Alexandria, or the north coast, travellers first reach Marsa Matruh on the Mediterranean, then continue inland across the desert to Siwa. The final leg covers around 300 kilometres and takes roughly four to four and a half hours depending on stops, road conditions, and checkpoint delays.',
        },
        href: '/guide/siwa-oasis/how-to-go-in-siwa-oasis',
        needsReview: true,
      },
      {
        id: 'siwa-season',
        question: { en: 'When is the best time for Siwa?' },
        answer: {
          en: "For most visitors, October to March is the safest and most comfortable window. October and November offer the best all-round balance. The worst heat has passed, days become warm rather than punishing, nights are comfortable, and desert excursions are more pleasant. October also overlaps with the date harvest, one of the oasis's important agricultural rhythms, and with the Siyaha Festival at Dakrour Mountain.",
        },
        href: '/guide/siwa-oasis/weather-in-siwa-oasis',
        needsReview: true,
      },
      {
        id: 'alexandria-getting-there',
        question: { en: 'How do I get to Alexandria?' },
        answer: {
          en: 'The city sits about 220 kilometres northwest of Cairo on the Mediterranean coast. The train is usually the best balance of comfort and ease. A private car is the simplest door-to-door option. Faster modern trains can make the trip in roughly two and a half hours; older express services often take three to four hours depending on stops and delays.',
        },
        href: '/guide/alexandria/getting-to-alexandria',
        needsReview: true,
      },
      {
        id: 'middle-egypt-escorts',
        question: { en: 'Will there be a police escort in Middle Egypt?' },
        answer: {
          en: 'Foreign visitors in Middle Egypt may encounter tourist police coordination, checkpoints, or an escort for some routes. This can feel surprising if you have only travelled in Cairo or Luxor, but it is a normal feature of travel in parts of Middle Egypt. It does not necessarily indicate immediate danger. It does mean that timings may be affected and that independent improvisation can be harder than it looks on paper.',
        },
        href: '/guide/al-minya/getting-around-in-al-minya',
        needsReview: true,
      },
    ],
  },
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
