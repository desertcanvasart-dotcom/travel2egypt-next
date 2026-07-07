/* ============================================================================
 * climate/index.ts — per-city climate data for the weather-page signature hero.
 *
 * ⚠️  DRAFT — DATA PENDING OWNER SPOT-CHECK.
 * The numeric arrays (highs / lows / rain / season spans) are compiled from
 * climate normals and cross-checked against each page's own legacy prose and
 * against the owner's locked editorial figures (the °C values asserted inside
 * gap_text / trough_text / captions). They are honest estimates good to about
 * ±1°C, NOT authoritative station normals — spot-check before this is treated
 * as canonical. Qena, Aswan and Alexandria are the design mock's verbatim
 * reference records.
 *
 * EDITORIAL COPY is owner-authored and LOCKED. The `en` slots below are wired
 * verbatim from climate-signature-copy-en-v1.csv. `es`/`ja` are intentionally
 * empty: weather pages are EN-only at launch (the template locale-gates the
 * hero), and the ES/JA editorial batch lands later, journeys-style. Never
 * draft these strings.
 *
 * Keyed by city slug (EN). The three deduplicated cities (farafra-oasis,
 * rosetta-rasheed, siwa-oasis) have two live docs each; keying by city slug
 * gives both the same signature, which is the owner's instruction — the old
 * duplicate URL 301s to the keeper anyway.
 *
 * Month indices are 0=Jan … 11=Dec. Season spans are inclusive [a,b] with
 * a≤b; a wrap-around season (e.g. Oct–Apr) is expressed as two spans
 * [[9,11],[0,3]]. `gapMonth` is the peak-heat month the day–night measure is
 * drawn at; `troughMonth` is the low-point month (January everywhere here).
 * ==========================================================================*/

export type Locale = 'en' | 'es' | 'ja';
export type MonthSpan = [number, number];

export interface ClimateEditorial {
  descriptors?: string;
  gapText?: string;
  troughText?: string;
  caption?: string;
  seasonLabel?: string;
}

export interface ClimateRecord {
  highs: number[]; // 12 day-highs °C, Jan→Dec
  lows: number[]; //  12 night-lows °C
  rain: number[] | null; // 12 rain-day counts, or null to hide the row
  season: { spans: MonthSpan[] };
  gapMonth: number;
  troughMonth: number;
  editorial: Partial<Record<Locale, ClimateEditorial>>;
}

export const climateData: Record<string, ClimateRecord> = {
  // ── Lower Egypt ──────────────────────────────────────────────────────────
  cairo: {
    highs: [19, 21, 24, 28, 32, 34, 35, 35, 33, 30, 25, 21],
    lows: [9, 10, 12, 15, 18, 20, 22, 22, 20, 17, 14, 11],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 5,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Dry heat, city-tempered · Bright winters · Rare rain',
        gapText: '14° between noon and midnight',
        troughText: '9° — January nights',
        caption:
          'Hot and bright from May to September, mild and blue-skied all winter — rain comes a handful of days a year, and the city treats each one as an event.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  giza: {
    highs: [19, 22, 25, 29, 33, 35, 36, 35, 33, 30, 25, 21],
    lows: [8, 9, 11, 14, 18, 20, 22, 22, 20, 16, 13, 10],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Desert edge of the capital · Clear mornings · Rare rain',
        gapText: '14° between noon and midnight',
        troughText: '8° — January dawns',
        caption:
          'The plateau runs a degree hotter and a shade dustier than the city beside it — which is why the pyramids are a morning appointment from May to September.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  ismailia: {
    highs: [19, 21, 24, 28, 32, 34, 35, 35, 33, 30, 25, 21],
    lows: [9, 9, 11, 14, 18, 21, 23, 23, 21, 17, 14, 11],
    rain: null,
    season: { spans: [[9, 11], [0, 4]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Canal air · Green for Egypt · Mild winters',
        gapText: '12° between day and night',
        troughText: '9° — January nights',
        caption:
          'The gentlest of the canal cities — tempered by water and trees, and at its best in the long mild stretch either side of winter.',
        seasonLabel: 'THE SEASON — OCTOBER TO MAY',
      },
    },
  },
  'rosetta-rasheed': {
    highs: [18, 18, 20, 23, 26, 28, 30, 31, 29, 27, 24, 20],
    lows: [9, 9, 11, 14, 18, 21, 23, 23, 22, 18, 14, 11],
    rain: [10, 8, 5, 2, 1, 0, 0, 0, 1, 3, 6, 9],
    season: { spans: [[3, 10]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Delta air · Winter rain · Sea-softened summers',
        gapText: '8° — the Delta holds the night',
        troughText: '9° — a wet January',
        caption:
          'Where the Nile meets the sea the climate turns Mediterranean: real winter rain, soft summers, and light that photographers cross the Delta for.',
        seasonLabel: 'THE SEASON — APRIL TO NOVEMBER',
      },
    },
  },
  'wadi-el-natrun': {
    highs: [19, 21, 25, 29, 33, 35, 36, 36, 33, 30, 25, 21],
    lows: [7, 8, 10, 14, 18, 21, 23, 23, 20, 16, 12, 9],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          'Desert quiet · Bright and dry · Cool monastery mornings',
        gapText: '13° between noon and midnight',
        troughText: '7° — January nights',
        caption:
          'Monastery weather: dry, bright and still — winter mornings here are cold enough to explain the wool habits, and summer visits belong before noon.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },

  // ── Mediterranean ────────────────────────────────────────────────────────
  alexandria: {
    highs: [18, 19, 21, 24, 27, 29, 30, 31, 30, 28, 24, 20],
    lows: [9, 9, 11, 14, 17, 21, 23, 23, 22, 18, 14, 11],
    rain: [11, 9, 6, 2, 1, 0, 0, 0, 1, 3, 6, 10],
    season: { spans: [[4, 9]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          "Sea air · A real winter · Winter rain · Cairo's summer refuge",
        gapText: 'only 8° — the sea holds the night',
        troughText: '9° — a real winter',
        caption:
          "The one Egyptian city with a real winter — grey, wet, Mediterranean — and the coast Cairo escapes to when summer arrives. Its season is the inverse of the valley's.",
        seasonLabel: 'THE SEASON — MAY TO OCTOBER',
      },
    },
  },
  'marsa-matruh': {
    highs: [17, 18, 19, 22, 25, 28, 29, 30, 28, 26, 22, 19],
    lows: [8, 8, 10, 12, 16, 20, 22, 23, 21, 17, 13, 10],
    rain: [9, 7, 4, 2, 1, 0, 0, 0, 1, 3, 6, 8],
    season: { spans: [[5, 8]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          "Turquoise water · Egypt's summer coast · Stormy winters",
        gapText: '7° — sea-tempered',
        troughText: '8° — a closed-season January',
        caption:
          'Matruh runs on one season: the summer months when its lagoons do their Aegean impression — winter is windy, wet and largely shuttered, and we say so.',
        seasonLabel: 'THE SEASON — JUNE TO SEPTEMBER',
      },
    },
  },
  'port-said': {
    highs: [18, 19, 21, 24, 27, 29, 31, 31, 30, 28, 24, 20],
    lows: [10, 10, 12, 15, 19, 22, 24, 24, 22, 19, 15, 12],
    rain: [7, 5, 3, 1, 0, 0, 0, 0, 0, 2, 4, 6],
    season: { spans: [[2, 4], [8, 10]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Canal and sea · Humid summers · Mild, showery winters',
        gapText: '7° between day and night',
        troughText: '10° — January nights',
        caption:
          'A working harbour more than a resort: mild most of the year, humid in high summer, and best when the light is long — spring and autumn.',
        seasonLabel: 'THE SEASON — SPRING AND AUTUMN',
      },
    },
  },

  // ── Red Sea ──────────────────────────────────────────────────────────────
  'al-gouna': {
    highs: [22, 23, 25, 29, 33, 36, 37, 37, 34, 31, 27, 23],
    lows: [11, 12, 14, 18, 22, 25, 28, 28, 26, 22, 17, 14],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Year-round sun · Lagoon breezes · A warm sea',
        gapText: '9° — the sea holds the night',
        troughText: '11° — January nights',
        caption:
          'The lagoons barely have an off-season: winter is sunny with a breeze, summer is hot with a sea that compensates — the calendar question here is water temperature, not weather.',
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
    },
  },
  'al-quseir': {
    highs: [22, 23, 25, 29, 32, 35, 36, 36, 34, 31, 27, 23],
    lows: [11, 12, 14, 18, 22, 25, 27, 27, 25, 22, 17, 14],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Old-coast quiet · Steady sun · A warm sea',
        gapText: '9° between day and night',
        troughText: '11° — January nights',
        caption:
          'The oldest port on this coast keeps the coast’s kindest habit: sun nearly every day of the year, with the sea a degree warmer than the air most winter mornings.',
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
    },
  },
  hurghada: {
    highs: [21, 22, 25, 29, 33, 36, 37, 37, 34, 31, 27, 23],
    lows: [11, 12, 14, 18, 22, 26, 28, 28, 26, 22, 17, 14],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          'Sun nearly every day · A swimmable winter sea · Reliable wind',
        gapText: '9° — the sea holds the night',
        troughText: '11° — January nights',
        caption:
          "Hurghada's weather is a promise more than a forecast: sun almost every day, a sea that stays swimmable through winter, and wind the kite schools plan around.",
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
    },
  },
  'marsa-alam': {
    highs: [23, 24, 26, 29, 32, 35, 36, 36, 34, 31, 28, 24],
    lows: [12, 13, 15, 19, 23, 25, 27, 27, 26, 23, 19, 15],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 5,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          'The far south · The warmest winter sea · Desert-backed reefs',
        gapText: '10° between day and night',
        troughText: '12° — the mildest January on the coast',
        caption:
          'The furthest south we send beach travellers, and the reason is January: the warmest winter water in Egypt, over reefs that need nothing else said for them.',
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
    },
  },
  safaga: {
    highs: [21, 22, 25, 29, 33, 36, 37, 37, 34, 31, 27, 23],
    lows: [11, 12, 14, 18, 22, 26, 28, 28, 26, 22, 17, 14],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'A working port · Serious wind · Bright winters',
        gapText: '9° between day and night',
        troughText: '11° — January nights',
        caption:
          'Safaga is where the coast works — phosphate docks, dive boats, and a wind that windsurfers cross continents for; the weather is Hurghada’s, with fewer umbrellas on the sand.',
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
    },
  },
  suez: {
    highs: [19, 21, 24, 28, 32, 35, 36, 36, 33, 30, 25, 21],
    lows: [10, 11, 13, 17, 21, 24, 25, 25, 23, 19, 15, 12],
    rain: null,
    season: { spans: [[9, 11], [0, 4]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Canal mouth · Dry and bright · Windy afternoons',
        gapText: '11° between day and night',
        troughText: '10° — January nights',
        caption:
          'A transit city with transit weather: dry, bright and windy where the canal meets the gulf — comfortable in the shoulder months, honest about July.',
        seasonLabel: 'THE SEASON — OCTOBER TO MAY',
      },
    },
  },

  // ── Sinai ────────────────────────────────────────────────────────────────
  'al-arish': {
    highs: [18, 19, 21, 24, 27, 29, 31, 31, 30, 28, 24, 20],
    lows: [9, 9, 11, 13, 17, 20, 22, 23, 21, 18, 14, 11],
    rain: [10, 7, 4, 2, 0, 0, 0, 0, 0, 2, 5, 8],
    season: { spans: [[4, 9]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Mediterranean Sinai · Palm-lined coast · Winter rain',
        gapText: '8° — sea-tempered',
        troughText: '9° — a showery January',
        caption:
          "Sinai's Mediterranean face: palm groves, winter showers and a long mild summer — a different climate from the resorts two hours south, and a quieter one.",
        seasonLabel: 'THE SEASON — MAY TO OCTOBER',
      },
    },
  },
  dahab: {
    highs: [22, 23, 26, 30, 34, 37, 38, 38, 35, 32, 27, 23],
    lows: [12, 13, 16, 20, 24, 26, 28, 28, 26, 22, 18, 14],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Warm sea, cool wind · Mountain backdrop · A long season',
        gapText: '10° between day and night',
        troughText: '12° — January nights',
        caption:
          "Dahab's trick is the wind off the mountains: it takes the edge off summer and keeps the lagoon honest — the season here is most of the year.",
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
    },
  },
  nuweiba: {
    highs: [21, 22, 25, 29, 33, 36, 37, 37, 34, 31, 26, 22],
    lows: [11, 12, 15, 19, 23, 25, 27, 27, 25, 21, 17, 13],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Gulf quiet · Warm water · Mountain dawns',
        gapText: '10° between day and night',
        troughText: '11° — January nights',
        caption:
          'The quiet stretch of the gulf: beach camps, mountain shadow by late afternoon, and a sea that stays warm long after the crowds thin.',
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
    },
  },
  'ras-sudr': {
    highs: [20, 21, 24, 28, 32, 35, 36, 36, 33, 30, 25, 21],
    lows: [11, 12, 14, 18, 22, 25, 27, 27, 25, 21, 16, 13],
    rain: null,
    season: { spans: [[8, 11], [0, 5]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Built for wind · Flat, warm water · Weekend coast',
        gapText: '9° between day and night',
        troughText: '11° — January nights',
        caption:
          'Ras Sudr sells one thing and the climate delivers it daily: wind — steady, side-shore, and strong enough that the kite season barely closes.',
        seasonLabel: 'THE SEASON — SEPTEMBER TO JUNE',
      },
    },
  },
  'saint-catherine': {
    highs: [10, 12, 15, 20, 25, 29, 30, 30, 27, 22, 16, 12],
    lows: [-2, -1, 2, 6, 10, 13, 15, 15, 12, 8, 3, 0],
    rain: null,
    season: { spans: [[2, 4], [8, 10]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          '1,600 metres up · Freezing winter nights · The occasional snowfall',
        gapText: '15° of mountain air',
        troughText: '−2° — January, and honestly cold',
        caption:
          'The one Egyptian weather page with snow on it: at 1,600 metres the winter nights freeze, the summer days stay mountain-mild, and the summit sunrise wants every layer you brought.',
        seasonLabel: 'THE SEASON — SPRING AND AUTUMN',
      },
    },
  },
  'sharm-el-sheikh': {
    highs: [22, 23, 25, 29, 33, 36, 38, 38, 35, 32, 27, 23],
    lows: [13, 14, 16, 20, 24, 26, 28, 28, 26, 23, 18, 15],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Winter-sun capital · A warm sea · Rainless',
        gapText: '10° between day and night',
        troughText: '13° — the warmest January nights in Egypt',
        caption:
          'Sharm exists because of its winter: sun in the middle of a European January, a sea still fit for swimming, and rain so rare the airport treats it as news.',
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
    },
  },
  taba: {
    highs: [21, 22, 25, 29, 33, 36, 37, 37, 34, 31, 26, 22],
    lows: [11, 12, 15, 19, 23, 25, 27, 27, 25, 21, 17, 13],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 7,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Four-country views · Gulf calm · Bright winters',
        gapText: '10° between day and night',
        troughText: '11° — January nights',
        caption:
          "The gulf at its narrowest and calmest — winter days made for the water, summer afternoons made for the pool, and Jordan's mountains pink across the strait at dusk.",
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
    },
  },

  // ── Upper Egypt (Nile Valley) ─────────────────────────────────────────────
  'abu-simbel': {
    highs: [24, 27, 32, 38, 42, 43, 43, 43, 41, 37, 30, 25],
    lows: [10, 12, 16, 21, 25, 27, 27, 27, 25, 21, 16, 12],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: "Egypt's deep south · A 43° summer · Winter perfection",
        gapText: '16° between noon and midnight',
        troughText: '10° — January nights',
        caption:
          'The hottest ticket in Egypt in every sense: summer afternoons past 43°, which is why the temples are a dawn appointment — and why winter here is simply perfect.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  akhmim: {
    highs: [22, 25, 29, 34, 38, 40, 40, 40, 37, 33, 28, 23],
    lows: [7, 9, 12, 17, 21, 23, 24, 24, 21, 17, 12, 8],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Middle Egypt light · Dry heat · Cool river nights',
        gapText: '16° between noon and midnight',
        troughText: '7° — January nights',
        caption:
          'Weaving-town weather: dry, bright and workmanlike — see it with Sohag and Abydos in the winter months, when the light does the tapestries justice.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  'al-fayoum': {
    highs: [20, 22, 26, 31, 35, 37, 38, 38, 35, 31, 26, 21],
    lows: [6, 8, 11, 15, 19, 22, 23, 23, 20, 17, 12, 8],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Desert lakes · Cairo’s countryside · Cold winter dawns',
        gapText: '15° between noon and midnight',
        troughText: '6° — January dawns by the lake',
        caption:
          'Fayoum is Cairo’s weather with the city removed: clearer, quieter, a shade colder at dawn — and the Valley of the Whales is a winter walk, not a summer one.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  'al-minya': {
    highs: [20, 23, 27, 32, 36, 38, 38, 38, 36, 32, 27, 22],
    lows: [5, 7, 10, 15, 19, 22, 23, 23, 20, 16, 11, 7],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Northern Upper Egypt · Bright and dry · Chilly winter nights',
        gapText: '15° between noon and midnight',
        troughText: "5° — the valley's coldest January nights",
        caption:
          'Middle Egypt runs a degree cooler than the deep south — Amarna and Beni Hasan are winter mornings at their best, with a jacket for the boat crossing.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  'al-wadi-al-gadid': {
    highs: [21, 24, 28, 34, 38, 41, 41, 41, 38, 34, 28, 23],
    lows: [4, 6, 10, 15, 20, 23, 23, 23, 20, 15, 9, 5],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'The New Valley · Deep-desert dry · Vast skies',
        gapText: '18° — the deep-desert swing',
        troughText: '4° — desert January nights',
        caption:
          'The governorate that holds Kharga, Dakhla and Baris in one enormous quiet: true deep-desert weather — rainless, huge-skied, and cold the moment the sun leaves.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  aswan: {
    highs: [23, 26, 31, 36, 40, 42, 42, 42, 40, 36, 29, 24],
    lows: [9, 10, 14, 19, 23, 25, 26, 26, 24, 20, 14, 10],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Driest place on the Nile · Warm winters · A summer plateau',
        gapText: 'a 42° plateau, 16° cooler by night',
        troughText: '9° — January nights',
        caption:
          'The hottest inhabited stretch of the river, and the driest — rain is a news event here. Winter afternoons are when Aswan feels most generous: warm, dry, and made for the water.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  asyut: {
    highs: [21, 24, 28, 33, 37, 39, 39, 39, 37, 32, 27, 22],
    lows: [6, 8, 11, 16, 20, 23, 23, 23, 21, 17, 12, 8],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: "Middle Egypt's capital · Dry heat · Cool nights",
        gapText: '16° between noon and midnight',
        troughText: '6° — January nights',
        caption:
          'University-city weather in the middle of the valley: hot and dry with the desert close on both sides — winter is the season, and the monasteries above town are its reward.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  'beni-suef': {
    highs: [20, 22, 26, 31, 35, 37, 37, 37, 35, 31, 26, 21],
    lows: [6, 8, 11, 15, 20, 22, 23, 23, 21, 17, 12, 8],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Valley gateway · Dry and bright · Mild winters',
        gapText: '14° between noon and midnight',
        troughText: '6° — January nights',
        caption:
          "The first breath of Upper Egypt south of Cairo: a degree warmer, noticeably drier, and on the way to Meidum's pyramid — a winter-morning stop if there ever was one.",
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  edfu: {
    highs: [23, 26, 30, 35, 39, 41, 41, 41, 39, 35, 29, 24],
    lows: [8, 10, 13, 18, 22, 25, 25, 25, 23, 19, 14, 10],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Cruise-morning weather · Dry heat · Clear skies',
        gapText: '16° between noon and midnight',
        troughText: '8° — January nights',
        caption:
          'Edfu is met at nine in the morning off a boat, which is exactly right: the temple’s courts hold the heat by noon, and the horse carriages know it.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  esna: {
    highs: [23, 26, 30, 35, 39, 41, 41, 41, 39, 35, 29, 24],
    lows: [8, 10, 13, 18, 22, 25, 25, 25, 23, 19, 14, 10],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Lock-town light · Dry heat · Cool river evenings',
        gapText: '16° between noon and midnight',
        troughText: '8° — January nights',
        caption:
          'Esna happens while the boats queue for the lock — a morning temple with a restored ceiling worth every waiting minute, in a climate that says go before lunch.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  'kom-ombo': {
    highs: [23, 26, 31, 36, 40, 42, 42, 42, 40, 36, 29, 24],
    lows: [9, 11, 14, 19, 23, 26, 26, 26, 24, 20, 15, 11],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Riverbank temple · Dry heat · Sunset calls',
        gapText: '16° between noon and midnight',
        troughText: '9° — January nights',
        caption:
          "The one temple the boats visit at golden hour — Kom Ombo at sunset is the cruise's best-lit appointment, and the evening air off the river is the reward for the day's heat.",
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  luxor: {
    highs: [23, 26, 31, 36, 40, 42, 42, 42, 39, 35, 29, 24],
    lows: [7, 9, 13, 18, 22, 25, 25, 25, 22, 18, 13, 9],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          'The largest open-air site on earth · Dry heat · Tomb-warm afternoons',
        gapText: '17° between noon and midnight',
        troughText: '7° — January nights',
        caption:
          "Luxor's weather writes the itinerary: West Bank tombs at eight, Karnak before noon, felucca at five — from May to September that order isn't advice, it's survival.",
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  qena: {
    highs: [23, 26, 30, 35, 39, 41, 41, 41, 38, 34, 28, 24],
    lows: [6, 8, 12, 17, 21, 24, 25, 25, 22, 18, 12, 8],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 5,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Dry heat · Clear skies · Cool nights · Almost no rain',
        gapText: '17° between noon and midnight',
        troughText: '6° — January nights',
        caption:
          'Qena’s climate is not complicated. It is honest: rainless, bright, and seventeen degrees cooler every night than the afternoon that preceded it — the season decision here is heat, nothing else.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  sohag: {
    highs: [21, 24, 28, 33, 37, 39, 39, 39, 37, 32, 27, 22],
    lows: [5, 7, 10, 15, 19, 22, 23, 23, 20, 16, 11, 7],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Abydos country · Dry and bright · Cold winter dawns',
        gapText: '16° between noon and midnight',
        troughText: '5° — January dawns',
        caption:
          'The base for Abydos and the White Monastery, and a winter-morning proposition: clear, cool early, hot by two — time the carving for the low light.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },

  // ── Western Desert (oases) ────────────────────────────────────────────────
  'bahariya-oasis': {
    highs: [20, 23, 27, 32, 37, 39, 40, 40, 37, 32, 26, 21],
    lows: [3, 5, 9, 14, 18, 21, 22, 22, 19, 15, 9, 5],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Oasis springs · Deep-desert nights · Gateway to the chalk',
        gapText: '18° — the desert swing',
        troughText: '3° — winter nights near freezing',
        caption:
          "Bahariya's weather matters most after dark: the springs stay warm, the desert doesn't — December camp nights in the White Desert beyond touch zero, and that is part of the point.",
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  baris: {
    highs: [22, 25, 29, 35, 39, 42, 42, 42, 39, 34, 28, 23],
    lows: [5, 7, 11, 16, 21, 24, 24, 24, 21, 16, 10, 6],
    rain: null,
    season: { spans: [[9, 11], [0, 2]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          'The deep south of the oases · Fierce summers · Winter stillness',
        gapText: '18° — the deep-desert swing',
        troughText: '5° — January nights',
        caption:
          'The last oasis before the sand takes over entirely: summers here are the hottest in the New Valley, winters are still and flawless, and the old caravan roads explain themselves.',
        seasonLabel: 'THE SEASON — OCTOBER TO MARCH',
      },
    },
  },
  'dakhla-oasis': {
    highs: [21, 24, 28, 33, 38, 40, 41, 41, 38, 33, 27, 22],
    lows: [4, 6, 10, 15, 20, 23, 23, 23, 20, 15, 9, 5],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Pink cliffs · Mud-brick shade · Deep-desert dry',
        gapText: '18° — the desert swing',
        troughText: '4° — winter nights',
        caption:
          'Dakhla is built for its own climate: Al Qasr’s covered lanes were medieval air conditioning, and they still work — winter days are flawless, winter nights want the fire lit.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  'farafra-oasis': {
    highs: [20, 23, 27, 33, 37, 40, 41, 41, 38, 32, 26, 21],
    lows: [2, 4, 8, 13, 18, 21, 22, 22, 19, 13, 7, 3],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          "The smallest oasis · The White Desert's doorstep · Freezing camp nights",
        gapText: '19° — the widest swing in Egypt',
        troughText: '2° — desert winter nights',
        caption:
          "Farafra fronts the White Desert, and its climate is the camping brief: flawless winter days, nights that touch freezing among the chalk, and a silence the thermometer can't measure.",
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  'kharga-oasis': {
    highs: [22, 25, 29, 34, 38, 41, 41, 41, 38, 33, 27, 23],
    lows: [5, 7, 11, 16, 21, 23, 23, 23, 21, 16, 10, 6],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'New Valley capital · Rainless · Caravan-road heat',
        gapText: '18° — the deep-desert swing',
        troughText: '5° — January nights',
        caption:
          'The New Valley’s capital keeps caravan climate: rainless, huge-skied, fiercely hot by May — the Roman forts along the forty-days road were garrisoned in winter for a reason.',
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
  'siwa-oasis': {
    highs: [20, 22, 25, 30, 34, 37, 38, 38, 35, 31, 26, 21],
    lows: [4, 6, 9, 13, 17, 20, 21, 21, 19, 15, 10, 6],
    rain: null,
    season: { spans: [[9, 11], [0, 3]] },
    gapMonth: 6,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors: 'Salt lakes · Date-harvest autumns · Berber-built shade',
        gapText: '17° between noon and midnight',
        troughText: '4° — winter nights',
        caption:
          "Siwa's calendar is its own: the date harvest scents October, the salt lakes are swimmable long past summer, and winter nights are cold enough to justify the kershef walls.",
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
    },
  },
};
