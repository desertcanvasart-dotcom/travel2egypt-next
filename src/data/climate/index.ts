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
 * EDITORIAL COPY: the `en` slots are owner-authored and LOCKED, wired verbatim
 * from climate-signature-copy-en-v1.csv — never redraft those.
 *
 * `es`/`ja` slots are CLAUDE-DRAFTED MACHINE TRANSLATIONS (staged 2026-07-09,
 * docs/climate-esja-draft-translations.json + scripts/climate-esja-draft-fill.ts;
 * owner explicitly authorized this as a starting point, same as the JA
 * legal-page draft). Owner reviewed and approved 2026-07-09 — the weather
 * page's render gate now includes es/ja (per-locale: a city missing copy for
 * a locale falls back to the photo hero automatically).
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
      es: {
        descriptors: 'Calor seco, templado por la ciudad · Inviernos luminosos · Lluvia escasa',
        gapText: '14° entre el mediodía y la medianoche',
        troughText: '9° — noches de enero',
        caption:
          'Calurosa y luminosa de mayo a septiembre, templada y de cielos azules todo el invierno — la lluvia llega apenas unos días al año, y la ciudad convierte cada uno en un acontecimiento.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '乾いた暑さ、都市に和らげられて · 明るい冬 · めったに降らない雨',
        gapText: '正午から真夜中まで14℃差',
        troughText: '9℃ — 1月の夜',
        caption:
          '5月から9月は暑く明るく、冬は一年を通じて穏やかで青空が広がる — 雨が降るのは年にほんの数日だけで、街はその一日一日を特別な出来事として迎える。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Borde desértico de la capital · Mañanas despejadas · Lluvia escasa',
        gapText: '14° entre el mediodía y la medianoche',
        troughText: '8° — amaneceres de enero',
        caption:
          'La meseta es un grado más calurosa y algo más polvorienta que la ciudad vecina — por eso, de mayo a septiembre, las pirámides son una cita matutina.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '首都の砂漠の縁 · 澄んだ朝 · めったに降らない雨',
        gapText: '正午から真夜中まで14℃差',
        troughText: '8℃ — 1月の明け方',
        caption:
          'この台地は隣接する街より1度ほど暑く、いくらか埃っぽい — だからこそ5月から9月は、ピラミッドは朝のうちに訪れるべき場所となる。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Aire de canal · Verde para lo que es Egipto · Inviernos suaves',
        gapText: '12° entre el día y la noche',
        troughText: '9° — noches de enero',
        caption:
          'La más suave de las ciudades del canal — templada por el agua y los árboles, y en su mejor momento durante el largo tramo templado que rodea el invierno.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A MAYO',
      },
      ja: {
        descriptors: '運河の空気 · エジプトにしては緑豊か · 穏やかな冬',
        gapText: '昼と夜で12℃差',
        troughText: '9℃ — 1月の夜',
        caption:
          '運河沿いの街の中でもっとも穏やかな場所 — 水と木々に和らげられ、冬を挟む長く温暖な期間に最も心地よくなる。',
        seasonLabel: 'ベストシーズン — 10月〜5月',
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
      es: {
        descriptors: 'Aire del Delta · Lluvia invernal · Veranos suavizados por el mar',
        gapText: '8° — el Delta retiene la noche',
        troughText: '9° — un enero lluvioso',
        caption:
          'Donde el Nilo se encuentra con el mar, el clima se vuelve mediterráneo: lluvia invernal de verdad, veranos suaves y una luz por la que los fotógrafos cruzan el Delta.',
        seasonLabel: 'LA TEMPORADA — DE ABRIL A NOVIEMBRE',
      },
      ja: {
        descriptors: 'デルタの空気 · 冬の雨 · 海が和らげる夏',
        gapText: '8℃ — デルタが夜の気温を保つ',
        troughText: '9℃ — 雨がちな1月',
        caption:
          'ナイル川が海と出会う場所では、気候は地中海性に変わる。本格的な冬の雨、穏やかな夏、そして写真家たちがデルタを越えてまで求める光がある。',
        seasonLabel: 'ベストシーズン — 4月〜11月',
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
      es: {
        descriptors: 'Silencio desértico · Luminoso y seco · Mañanas frescas de monasterio',
        gapText: '13° entre el mediodía y la medianoche',
        troughText: '7° — noches de enero',
        caption:
          'Clima de monasterio: seco, luminoso e inmóvil — las mañanas de invierno aquí son lo bastante frías como para explicar los hábitos de lana, y las visitas de verano deben hacerse antes del mediodía.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '砂漠の静けさ · 明るく乾燥 · 修道院の涼しい朝',
        gapText: '正午から真夜中まで13℃差',
        troughText: '7℃ — 1月の夜',
        caption:
          '修道院にふさわしい気候——乾いて明るく、静か。ここの冬の朝は、修道士たちがウールの修道服をまとう理由がわかるほど冷え込み、夏の訪問は正午前が鉄則だ。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Aire marino · Un invierno de verdad · Lluvia invernal · El refugio veraniego de El Cairo',
        gapText: 'solo 8° — el mar retiene la noche',
        troughText: '9° — un invierno de verdad',
        caption:
          'La única ciudad egipcia con un invierno de verdad — gris, húmedo, mediterráneo — y la costa a la que El Cairo escapa cuando llega el verano. Su temporada es la inversa de la del valle.',
        seasonLabel: 'LA TEMPORADA — DE MAYO A OCTUBRE',
      },
      ja: {
        descriptors: '海風 · 本物の冬 · 冬の雨 · カイロの夏の避暑地',
        gapText: 'わずか8℃ — 海が夜の気温を保つ',
        troughText: '9℃ — 本物の冬',
        caption:
          '本物の冬を持つエジプトで唯一の街——曇りがちで雨が多く、地中海性の気候。夏が訪れるとカイロの人々が逃げ込む海岸でもある。ここのベストシーズンは、ナイル渓谷とはちょうど逆になる。',
        seasonLabel: 'ベストシーズン — 5月〜10月',
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
      es: {
        descriptors: 'Aguas turquesa · La costa veraniega de Egipto · Inviernos tormentosos',
        gapText: '7° — templado por el mar',
        troughText: '8° — un enero de temporada baja',
        caption:
          'Matruh vive de una sola temporada: los meses de verano, cuando sus lagunas simulan el Egeo — el invierno es ventoso, húmedo y mayormente cerrado, y lo decimos sin rodeos.',
        seasonLabel: 'LA TEMPORADA — DE JUNIO A SEPTIEMBRE',
      },
      ja: {
        descriptors: 'ターコイズブルーの海 · エジプトの夏の海岸 · 荒れる冬',
        gapText: '7℃ — 海が和らげる',
        troughText: '8℃ — 閉季の1月',
        caption:
          'マトルーは一つの季節だけで成り立つ街——ラグーンがエーゲ海さながらの表情を見せる夏の数か月だ。冬は風が強く雨がちで、ほとんどの施設が閉まる——それを正直に伝えておく。',
        seasonLabel: 'ベストシーズン — 6月〜9月',
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
      es: {
        descriptors: 'Canal y mar · Veranos húmedos · Inviernos suaves y lluviosos',
        gapText: '7° entre el día y la noche',
        troughText: '10° — noches de enero',
        caption:
          'Más puerto activo que centro turístico: templado la mayor parte del año, húmedo en pleno verano, y en su mejor momento cuando la luz se alarga — primavera y otoño.',
        seasonLabel: 'LA TEMPORADA — PRIMAVERA Y OTOÑO',
      },
      ja: {
        descriptors: '運河と海 · 湿度の高い夏 · 穏やかでにわか雨の多い冬',
        gapText: '昼と夜で7℃差',
        troughText: '10℃ — 1月の夜',
        caption:
          'リゾートというより現役の港町——一年の大半は穏やかで、真夏は湿度が高く、日が長く伸びる春と秋に最も心地よい。',
        seasonLabel: 'ベストシーズン — 春と秋',
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
      es: {
        descriptors: 'Sol todo el año · Brisas de laguna · Un mar cálido',
        gapText: '9° — el mar retiene la noche',
        troughText: '11° — noches de enero',
        caption:
          'Las lagunas apenas tienen temporada baja: el invierno es soleado y con brisa, el verano es caluroso pero el mar lo compensa — aquí la pregunta del calendario es la temperatura del agua, no el clima.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A MAYO',
      },
      ja: {
        descriptors: '一年中降り注ぐ太陽 · ラグーンのそよ風 · 温かい海',
        gapText: '9℃ — 海が夜の気温を保つ',
        troughText: '11℃ — 1月の夜',
        caption:
          'このラグーンにオフシーズンはほとんどない——冬は晴れて風があり、夏は暑いが海がそれを補ってくれる。ここでカレンダーを左右するのは天候ではなく水温だ。',
        seasonLabel: 'ベストシーズン — 9月〜5月',
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
      es: {
        descriptors: 'La calma de la costa antigua · Sol constante · Un mar cálido',
        gapText: '9° entre el día y la noche',
        troughText: '11° — noches de enero',
        caption:
          'El puerto más antiguo de esta costa conserva su costumbre más amable: sol casi todos los días del año, con el mar un grado más cálido que el aire en la mayoría de las mañanas de invierno.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A MAYO',
      },
      ja: {
        descriptors: '古き海岸の静けさ · 安定した日照 · 温かい海',
        gapText: '昼と夜で9℃差',
        troughText: '11℃ — 1月の夜',
        caption:
          'この海岸で最も古い港は、この土地らしい穏やかな習慣を守り続けている——一年のほぼ毎日が晴れ、冬の朝の多くは海水温が気温より1度ほど高い。',
        seasonLabel: 'ベストシーズン — 9月〜5月',
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
      es: {
        descriptors: 'Sol casi todos los días · Un mar templado para nadar en invierno · Viento constante',
        gapText: '9° — el mar retiene la noche',
        troughText: '11° — noches de enero',
        caption:
          'El clima de Hurghada es más una promesa que un pronóstico: sol casi todos los días, un mar que sigue siendo apto para nadar durante todo el invierno, y un viento en torno al cual se organizan las escuelas de kitesurf.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A MAYO',
      },
      ja: {
        descriptors: 'ほぼ毎日晴れる · 冬でも泳げる海 · 安定した風',
        gapText: '9℃ — 海が夜の気温を保つ',
        troughText: '11℃ — 1月の夜',
        caption:
          'ハルガダの天気は予報というより約束のようなものだ——ほぼ毎日晴れ、冬を通して泳げる海があり、カイトスクールがスケジュールを組むほど安定した風が吹く。',
        seasonLabel: 'ベストシーズン — 9月〜5月',
      },
    },
  },
  'marsa-alam': {
    highs: [23, 24, 26, 29, 32, 35, 36, 36, 34, 31, 28, 24],
    lows: [14, 13, 15, 19, 23, 25, 27, 27, 26, 23, 19, 15],
    rain: null,
    season: { spans: [[8, 11], [0, 4]] },
    gapMonth: 5,
    troughMonth: 0,
    editorial: {
      en: {
        descriptors:
          'The far south · The warmest winter sea · Desert-backed reefs',
        gapText: '10° between day and night',
        troughText: '14° — the mildest January on the coast',
        caption:
          'The furthest south we send beach travellers, and the reason is January: the warmest winter water in Egypt, over reefs that need nothing else said for them.',
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
      es: {
        descriptors: 'El extremo sur · El mar más cálido en invierno · Arrecifes respaldados por el desierto',
        gapText: '10° entre el día y la noche',
        troughText: '12° — el enero más suave de la costa',
        caption:
          'El punto más al sur al que enviamos a los viajeros de playa, y la razón es enero: el agua invernal más cálida de Egipto, sobre unos arrecifes que no necesitan más presentación.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A MAYO',
      },
      ja: {
        descriptors: '最南端の地 · 冬でも最も温かい海 · 砂漠を背にしたサンゴ礁',
        gapText: '昼と夜で10℃差',
        troughText: '12℃ — この海岸で最も穏やかな1月',
        caption:
          'ビーチ目的の旅行者を案内する最南端の地——その理由は1月にある。エジプトで最も温かい冬の海水温を誇り、その下に広がるサンゴ礁については、もはや多くを語る必要もない。',
        seasonLabel: 'ベストシーズン — 9月〜5月',
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
      es: {
        descriptors: 'Un puerto activo · Viento serio · Inviernos luminosos',
        gapText: '9° entre el día y la noche',
        troughText: '11° — noches de enero',
        caption:
          'Safaga es donde la costa trabaja de verdad — muelles de fosfatos, barcos de buceo y un viento por el que los windsurfistas cruzan continentes; el clima es el de Hurghada, pero con menos sombrillas en la arena.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A MAYO',
      },
      ja: {
        descriptors: '現役の港 · 本格的な風 · 明るい冬',
        gapText: '昼と夜で9℃差',
        troughText: '11℃ — 1月の夜',
        caption:
          'サファーガはこの海岸の「仕事場」だ——リン鉱石の埠頭、ダイビングボート、そしてウィンドサーファーが大陸を越えてでも求める風がある。気候的にはハルガダと同じだが、砂浜のパラソルはずっと少ない。',
        seasonLabel: 'ベストシーズン — 9月〜5月',
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
      es: {
        descriptors: 'Boca del canal · Seco y luminoso · Tardes ventosas',
        gapText: '11° entre el día y la noche',
        troughText: '10° — noches de enero',
        caption:
          'Una ciudad de paso con un clima de paso: seco, luminoso y ventoso donde el canal se encuentra con el golfo — agradable en los meses intermedios, y sin disimular julio.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A MAYO',
      },
      ja: {
        descriptors: '運河の入り口 · 乾燥して明るい · 風の強い午後',
        gapText: '昼と夜で11℃差',
        troughText: '10℃ — 1月の夜',
        caption:
          '通過点の街には、それにふさわしい気候がある——運河が湾と出会う場所は乾燥し、明るく、風が強い。中間シーズンは快適だが、7月についてはごまかさない。',
        seasonLabel: 'ベストシーズン — 10月〜5月',
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
      es: {
        descriptors: 'El Sinaí mediterráneo · Costa bordeada de palmeras · Lluvia invernal',
        gapText: '8° — templado por el mar',
        troughText: '9° — un enero con chubascos',
        caption:
          'El rostro mediterráneo del Sinaí: palmerales, chubascos invernales y un largo verano templado — un clima distinto al de los complejos turísticos dos horas al sur, y más tranquilo.',
        seasonLabel: 'LA TEMPORADA — DE MAYO A OCTUBRE',
      },
      ja: {
        descriptors: '地中海に面したシナイ · ヤシ並木の海岸 · 冬の雨',
        gapText: '8℃ — 海が和らげる',
        troughText: '9℃ — にわか雨の多い1月',
        caption:
          'シナイ半島の地中海的な一面——ヤシの林、冬のにわか雨、そして穏やかで長い夏。南へ2時間のリゾート地とはまったく異なる、より静かな気候だ。',
        seasonLabel: 'ベストシーズン — 5月〜10月',
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
      es: {
        descriptors: 'Mar cálido, viento fresco · Telón de fondo de montañas · Una temporada larga',
        gapText: '10° entre el día y la noche',
        troughText: '12° — noches de enero',
        caption:
          'El truco de Dahab es el viento que baja de las montañas: suaviza el verano y mantiene la laguna fiel a sí misma — aquí la temporada dura casi todo el año.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A MAYO',
      },
      ja: {
        descriptors: '温かい海、涼しい風 · 山を背景に · 長く続くシーズン',
        gapText: '昼と夜で10℃差',
        troughText: '12℃ — 1月の夜',
        caption:
          'ダハブの秘密は山から吹き下ろす風にある——夏の暑さを和らげ、ラグーンの表情を保ってくれる。ここでは一年のほとんどがベストシーズンといえる。',
        seasonLabel: 'ベストシーズン — 9月〜5月',
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
      es: {
        descriptors: 'La calma del golfo · Agua cálida · Amaneceres de montaña',
        gapText: '10° entre el día y la noche',
        troughText: '11° — noches de enero',
        caption:
          'El tramo tranquilo del golfo: campamentos de playa, sombra de montaña al caer la tarde, y un mar que sigue cálido mucho después de que la multitud se disperse.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A MAYO',
      },
      ja: {
        descriptors: '湾の静けさ · 温かい水 · 山の夜明け',
        gapText: '昼と夜で10℃差',
        troughText: '11℃ — 1月の夜',
        caption:
          '湾の中でも静かな一角——ビーチキャンプ、夕方には山の影が落ち、人出が減った後も海はいつまでも温かいままだ。',
        seasonLabel: 'ベストシーズン — 9月〜5月',
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
      es: {
        descriptors: 'Hecha para el viento · Agua plana y cálida · Costa de fin de semana',
        gapText: '9° entre el día y la noche',
        troughText: '11° — noches de enero',
        caption:
          'Ras Sudr vende una sola cosa y el clima la entrega a diario: viento — constante, de costado, y lo bastante fuerte como para que la temporada de kite apenas se cierre.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A JUNIO',
      },
      ja: {
        descriptors: '風のために生まれた地 · 穏やかで温かい水 · 週末の海岸',
        gapText: '昼と夜で9℃差',
        troughText: '11℃ — 1月の夜',
        caption:
          'ラス・スドルが売りにするものはただ一つ、そして気候はそれを毎日届けてくれる——風だ。安定していて、サイドショアで、キトシーズンがほとんど途切れないほど強い。',
        seasonLabel: 'ベストシーズン — 9月〜6月',
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
      es: {
        descriptors: 'A 1600 metros de altitud · Noches de invierno bajo cero · Alguna que otra nevada',
        gapText: '15° de aire de montaña',
        troughText: '−2° — enero, y hace frío de verdad',
        caption:
          'La única página del clima egipcio con nieve: a 1600 metros, las noches de invierno se congelan, los días de verano se mantienen templados como en la montaña, y el amanecer en la cumbre exige hasta la última capa de ropa que llevaste.',
        seasonLabel: 'LA TEMPORADA — PRIMAVERA Y OTOÑO',
      },
      ja: {
        descriptors: '標高1,600メートル · 氷点下になる冬の夜 · 時折の降雪',
        gapText: '山の空気による15℃差',
        troughText: '−2℃ — 1月、正真正銘の寒さ',
        caption:
          '雪が登場するエジプトで唯一の天気ページ——標高1,600メートルでは冬の夜は氷点下になり、夏の日中は山らしく穏やかなまま。山頂の日の出を見るなら、持ってきた重ね着すべてが必要になる。',
        seasonLabel: 'ベストシーズン — 春と秋',
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
        troughText: '13° — among the warmest winter nights on the Red Sea',
        caption:
          'Sharm exists because of its winter: sun in the middle of a European January, a sea still fit for swimming, and rain so rare the airport treats it as news.',
        seasonLabel: 'THE SEASON — SEPTEMBER TO MAY',
      },
      es: {
        descriptors: 'La capital del sol invernal · Un mar cálido · Sin lluvias',
        gapText: '10° entre el día y la noche',
        troughText: '13° — las noches de enero más cálidas de Egipto',
        caption:
          'Sharm existe gracias a su invierno: sol en pleno enero europeo, un mar todavía apto para nadar, y una lluvia tan rara que el aeropuerto la trata como noticia.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A MAYO',
      },
      ja: {
        descriptors: '冬の陽光の首都 · 温かい海 · ほとんど雨が降らない',
        gapText: '昼と夜で10℃差',
        troughText: '13℃ — エジプトで最も温かい1月の夜',
        caption:
          'シャルムはその冬のためにこそ存在する——ヨーロッパが真冬の1月にも太陽が降り注ぎ、海は今なお泳げるほど温かく、雨は空港がニュースとして扱うほど珍しい。',
        seasonLabel: 'ベストシーズン — 9月〜5月',
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
      es: {
        descriptors: 'Vistas a cuatro países · La calma del golfo · Inviernos luminosos',
        gapText: '10° entre el día y la noche',
        troughText: '11° — noches de enero',
        caption:
          'El golfo en su punto más estrecho y calmado — días de invierno hechos para el agua, tardes de verano hechas para la piscina, y las montañas de Jordania tiñéndose de rosa al otro lado del estrecho al anochecer.',
        seasonLabel: 'LA TEMPORADA — DE SEPTIEMBRE A MAYO',
      },
      ja: {
        descriptors: '4か国を望む景色 · 穏やかな湾 · 明るい冬',
        gapText: '昼と夜で10℃差',
        troughText: '11℃ — 1月の夜',
        caption:
          '湾がもっとも狭く、もっとも穏やかになる場所——冬の日は海にふさわしく、夏の午後はプールにふさわしい。そして夕暮れには海峡の向こうにヨルダンの山々がピンク色に染まる。',
        seasonLabel: 'ベストシーズン — 9月〜5月',
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
      es: {
        descriptors: 'El extremo sur de Egipto · Un verano de 43° · Perfección invernal',
        gapText: '16° entre el mediodía y la medianoche',
        troughText: '10° — noches de enero',
        caption:
          'La entrada más «caliente» de Egipto en todos los sentidos: tardes de verano que superan los 43°, razón por la cual los templos se visitan al amanecer — y por la que el invierno aquí es sencillamente perfecto.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: 'エジプト最南の地 · 43℃の夏 · 完璧な冬',
        gapText: '正午から真夜中まで16℃差',
        troughText: '10℃ — 1月の夜',
        caption:
          'あらゆる意味でエジプト最も「熱い」観光地——夏の午後は43℃を超え、だからこそ神殿は夜明けに訪れるべき場所となる。そして、だからこそここの冬はまさに完璧だ。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'La luz del Egipto Medio · Calor seco · Noches frescas junto al río',
        gapText: '16° entre el mediodía y la medianoche',
        troughText: '7° — noches de enero',
        caption:
          'Clima de ciudad tejedora: seco, luminoso y sin adornos — visítala junto con Sohag y Abidos en los meses de invierno, cuando la luz hace justicia a los tapices.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '中部エジプトの光 · 乾いた暑さ · 涼しい川辺の夜',
        gapText: '正午から真夜中まで16℃差',
        troughText: '7℃ — 1月の夜',
        caption:
          '織物の街にふさわしい気候——乾いていて明るく、実直そのもの。ソハーグやアビドスと合わせて冬の間に訪れれば、光が織物の美しさを最も引き立ててくれる。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Lagos del desierto · El campo de El Cairo · Amaneceres invernales fríos',
        gapText: '15° entre el mediodía y la medianoche',
        troughText: '6° — amaneceres de enero junto al lago',
        caption:
          'Fayum es el clima de El Cairo sin la ciudad: más claro, más silencioso, algo más frío al amanecer — y el Valle de las Ballenas es una caminata de invierno, no de verano.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '砂漠の湖 · カイロの田園地帯 · 冷え込む冬の夜明け',
        gapText: '正午から真夜中まで15℃差',
        troughText: '6℃ — 湖畔の1月の夜明け',
        caption:
          'ファイユームはカイロと同じ気候から街だけを取り除いたような場所——より澄んでいて、より静かで、夜明けはいくらか冷え込む。そして「クジラの谷」は夏ではなく冬に歩くべき場所だ。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'El norte del Alto Egipto · Luminoso y seco · Noches de invierno frías',
        gapText: '15° entre el mediodía y la medianoche',
        troughText: '5° — las noches de enero más frías del valle',
        caption:
          'El Egipto Medio es un grado más fresco que el extremo sur — Amarna y Beni Hasan se disfrutan mejor en las mañanas de invierno, con una chaqueta para la travesía en barca.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '上エジプト北部 · 明るく乾燥 · 肌寒い冬の夜',
        gapText: '正午から真夜中まで15℃差',
        troughText: '5℃ — ナイル渓谷で最も冷え込む1月の夜',
        caption:
          '中部エジプトは最南部より1度ほど涼しい——アマルナやベニ・ハサンを訪れるなら冬の朝が一番で、渡し舟に乗るときはジャケットを一枚。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'El Nuevo Valle · Sequedad de desierto profundo · Cielos inmensos',
        gapText: '18° — la oscilación del desierto profundo',
        troughText: '4° — noches de enero en el desierto',
        caption:
          'La gobernación que reúne a Kharga, Dakhla y Baris en una calma inmensa: clima de desierto profundo genuino — sin lluvias, de cielos enormes, y frío en cuanto el sol se retira.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: 'ニューバレー県 · 深い砂漠の乾燥 · 広大な空',
        gapText: '18℃ — 深い砂漠特有の寒暖差',
        troughText: '4℃ — 砂漠の1月の夜',
        caption:
          'ハルガ、ダーヒラ、バリスを一つの広大な静寂の中に抱える県——真の深砂漠気候だ。雨は降らず、空は途方もなく広く、太陽が沈んだ瞬間に冷え込む。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'El lugar más seco del Nilo · Inviernos cálidos · Una meseta de verano',
        gapText: 'una meseta de 42°, 16° más fresca por la noche',
        troughText: '9° — noches de enero',
        caption:
          'El tramo habitado más caluroso del río, y el más seco — aquí la lluvia es noticia. Las tardes de invierno son cuando Asuán se muestra más generosa: cálida, seca y hecha para el agua.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: 'ナイル川流域で最も乾燥した地 · 温暖な冬 · 灼熱の夏',
        gapText: '42℃の酷暑、夜は16℃涼しくなる',
        troughText: '9℃ — 1月の夜',
        caption:
          'この川沿いで人が暮らす区間の中でもっとも暑く、もっとも乾燥した場所——ここでは雨が降るとニュースになる。アスワンが最も気前よく感じられるのは冬の午後だ。温暖で乾いていて、水辺で過ごすのにうってつけになる。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'La capital del Egipto Medio · Calor seco · Noches frescas',
        gapText: '16° entre el mediodía y la medianoche',
        troughText: '6° — noches de enero',
        caption:
          'Clima de ciudad universitaria en pleno centro del valle: caluroso y seco, con el desierto cerca por ambos lados — el invierno es la temporada, y los monasterios sobre la ciudad son su recompensa.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '中部エジプトの中心都市 · 乾いた暑さ · 涼しい夜',
        gapText: '正午から真夜中まで16℃差',
        troughText: '6℃ — 1月の夜',
        caption:
          'ナイル渓谷のちょうど真ん中に位置する大学都市の気候——両側から砂漠が迫り、暑く乾いている。ベストシーズンは冬で、街を見下ろす丘の修道院群がその褒美となる。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Puerta de entrada al valle · Seco y luminoso · Inviernos suaves',
        gapText: '14° entre el mediodía y la medianoche',
        troughText: '6° — noches de enero',
        caption:
          'El primer soplo del Alto Egipto al sur de El Cairo: un grado más cálido, notablemente más seco, y de camino a la pirámide de Meidum — una parada de mañana de invierno donde las haya.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '渓谷への玄関口 · 乾燥して明るい · 穏やかな冬',
        gapText: '正午から真夜中まで14℃差',
        troughText: '6℃ — 1月の夜',
        caption:
          'カイロの南、上エジプトの最初の息吹を感じる街——1度ほど暖かく、明らかに乾燥していて、メイドゥームのピラミッドへ向かう途中にある。まさに冬の朝に立ち寄るべき場所だ。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Clima de mañana de crucero · Calor seco · Cielos despejados',
        gapText: '16° entre el mediodía y la medianoche',
        troughText: '8° — noches de enero',
        caption:
          'Edfu se visita a las nueve de la mañana al bajar del barco, y es justo lo correcto: los patios del templo retienen el calor hacia el mediodía, y los carruajes de caballos lo saben bien.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: 'クルーズの朝にふさわしい気候 · 乾いた暑さ · 澄んだ空',
        gapText: '正午から真夜中まで16℃差',
        troughText: '8℃ — 1月の夜',
        caption:
          'エドフは船を降りた朝9時に訪れるのが正解だ——神殿の中庭は正午までに熱がこもるようになり、それは馬車の御者たちが一番よく知っている。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'La luz de la ciudad de la esclusa · Calor seco · Tardes frescas junto al río',
        gapText: '16° entre el mediodía y la medianoche',
        troughText: '8° — noches de enero',
        caption:
          'Esna sucede mientras los barcos hacen cola para la esclusa — un templo matutino con un techo restaurado que merece cada minuto de espera, en un clima que aconseja ir antes del almuerzo.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '水門の街の光 · 乾いた暑さ · 涼しい川辺の夕べ',
        gapText: '正午から真夜中まで16℃差',
        troughText: '8℃ — 1月の夜',
        caption:
          'エスナは船が水門の順番待ちをしている間に訪れる街だ——修復された天井を持つ朝の神殿は、待ち時間に見合う価値がある。そしてこの気候は、昼食前に行けと教えてくれる。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Templo a orillas del río · Calor seco · Citas con el atardecer',
        gapText: '16° entre el mediodía y la medianoche',
        troughText: '9° — noches de enero',
        caption:
          'El único templo que los barcos visitan a la hora dorada — Kom Ombo al atardecer es la cita mejor iluminada del crucero, y el aire vespertino del río es la recompensa al calor del día.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '川岸の神殿 · 乾いた暑さ · 夕暮れの呼び声',
        gapText: '正午から真夜中まで16℃差',
        troughText: '9℃ — 1月の夜',
        caption:
          '船がゴールデンアワーに訪れる唯一の神殿——夕暮れのコム・オンボはクルーズの中で最も美しく照らされる瞬間であり、川から吹く夜の空気は、一日の暑さに対する何よりの褒美となる。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'El mayor yacimiento al aire libre del planeta · Calor seco · Tardes cálidas en las tumbas',
        gapText: '17° entre el mediodía y la medianoche',
        troughText: '7° — noches de enero',
        caption:
          'El clima de Luxor escribe el itinerario: las tumbas de la Orilla Occidental a las ocho, Karnak antes del mediodía, felucca a las cinco — de mayo a septiembre, ese orden no es un consejo, es supervivencia.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '地球最大の野外遺跡 · 乾いた暑さ · 墓室が温まる午後',
        gapText: '正午から真夜中まで17℃差',
        troughText: '7℃ — 1月の夜',
        caption:
          'ルクソールの気候が旅程そのものを決めてしまう——西岸の墓群は8時、カルナックは正午前、ファルーカ(帆船)は5時。5月から9月にかけて、この順番は単なるアドバイスではなく、生き延びるための鉄則だ。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Calor seco · Cielos despejados · Noches frescas · Casi sin lluvia',
        gapText: '17° entre el mediodía y la medianoche',
        troughText: '6° — noches de enero',
        caption:
          'El clima de Qena no es complicado. Es honesto: sin lluvias, luminoso, y diecisiete grados más fresco cada noche que la tarde que la precedió — aquí la decisión de la temporada es el calor, y nada más.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '乾いた暑さ · 澄んだ空 · 涼しい夜 · ほとんど雨が降らない',
        gapText: '正午から真夜中まで17℃差',
        troughText: '6℃ — 1月の夜',
        caption:
          'ケナの気候は複雑ではない。ただ正直なだけだ——雨は降らず、明るく、そして夜はその日の午後より17度も涼しくなる。ここで季節を決めるのは暑さ、それだけだ。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Tierra de Abidos · Seco y luminoso · Amaneceres invernales fríos',
        gapText: '16° entre el mediodía y la medianoche',
        troughText: '5° — amaneceres de enero',
        caption:
          'La base para Abidos y el Monasterio Blanco, y una propuesta de mañana de invierno: despejado, fresco temprano, caluroso hacia las dos — programa las tallas para la luz rasante.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: 'アビドスの地 · 乾燥して明るい · 冷え込む冬の夜明け',
        gapText: '正午から真夜中まで16℃差',
        troughText: '5℃ — 1月の夜明け',
        caption:
          'アビドスと白の修道院を訪れる拠点であり、冬の朝にふさわしい提案がある——澄んだ空、早朝は涼しく、午後2時には暑くなる。彫刻を鑑賞するなら、斜めから差す柔らかな光の時間帯に合わせよう。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Manantiales de oasis · Noches de desierto profundo · Puerta de entrada a la caliza',
        gapText: '18° — la oscilación del desierto',
        troughText: '3° — noches de invierno cercanas a la congelación',
        caption:
          'El clima de Bahariya importa sobre todo después de que oscurece: los manantiales siguen cálidos, el desierto no — las noches de acampada de diciembre en el Desierto Blanco rozan el cero, y eso forma parte de la experiencia.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: 'オアシスの温泉 · 深い砂漠の夜 · 白亜の大地への玄関口',
        gapText: '18℃ — 砂漠特有の寒暖差',
        troughText: '3℃ — 氷点近くまで下がる冬の夜',
        caption:
          'バハレイヤの気候が本領を発揮するのは日が沈んだ後だ——温泉は温かいままだが、砂漠はそうはいかない。12月に白砂漠でキャンプすれば夜は氷点近くまで下がるが、それもまた醍醐味の一つだ。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'El extremo sur de los oasis · Veranos feroces · Quietud invernal',
        gapText: '18° — la oscilación del desierto profundo',
        troughText: '5° — noches de enero',
        caption:
          'El último oasis antes de que la arena lo domine todo: los veranos aquí son los más calurosos del Nuevo Valle, los inviernos son quietos e impecables, y las antiguas rutas de caravanas se explican por sí solas.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A MARZO',
      },
      ja: {
        descriptors: 'オアシス地帯最南の地 · 猛烈な夏 · 静寂の冬',
        gapText: '18℃ — 深い砂漠特有の寒暖差',
        troughText: '5℃ — 1月の夜',
        caption:
          '砂がすべてを覆い尽くす前の最後のオアシス——夏はニューバレー県で最も暑く、冬は静かで申し分ない。古いキャラバンルートが、その理由を物語っている。',
        seasonLabel: 'ベストシーズン — 10月〜3月',
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
      es: {
        descriptors: 'Acantilados rosados · Sombra de adobe · Sequedad de desierto profundo',
        gapText: '18° — la oscilación del desierto',
        troughText: '4° — noches de invierno',
        caption:
          'Dakhla está construida para su propio clima: los pasadizos cubiertos de Al Qasr eran el aire acondicionado medieval, y todavía funcionan — los días de invierno son impecables, las noches de invierno piden encender el fuego.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: 'ピンク色の断崖 · 日干しレンガの日陰 · 深い砂漠の乾燥',
        gapText: '18℃ — 砂漠特有の寒暖差',
        troughText: '4℃ — 冬の夜',
        caption:
          'ダーヒラは、この土地の気候そのもののために築かれた街だ。アル・カスルの屋根付き路地は中世の「空調」であり、今も機能している——冬の日中は申し分なく、冬の夜には暖炉に火を灯したくなる。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
        gapText: '19° — among the widest swings in Egypt',
        troughText: '2° — desert winter nights',
        caption:
          "Farafra fronts the White Desert, and its climate is the camping brief: flawless winter days, nights that touch freezing among the chalk, and a silence the thermometer can't measure.",
        seasonLabel: 'THE SEASON — OCTOBER TO APRIL',
      },
      es: {
        descriptors: 'El oasis más pequeño · La puerta del Desierto Blanco · Noches de acampada bajo cero',
        gapText: '19° — la mayor oscilación de Egipto',
        troughText: '2° — noches de invierno en el desierto',
        caption:
          'Farafra da la cara al Desierto Blanco, y su clima es el resumen de la acampada: días de invierno impecables, noches que rozan la congelación entre la caliza, y un silencio que el termómetro no puede medir.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '最も小さなオアシス · 白砂漠への入り口 · 凍える夜のキャンプ',
        gapText: '19℃ — エジプトで最も大きな寒暖差',
        troughText: '2℃ — 砂漠の冬の夜',
        caption:
          'ファラフラは白砂漠の玄関に位置し、その気候はまさにキャンプの案内書のようなもの——冬の日中は申し分なく、白亜の岩の間で夜は氷点に迫り、そして温度計では測れない静寂がある。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Capital del Nuevo Valle · Sin lluvias · El calor de las rutas de caravanas',
        gapText: '18° — la oscilación del desierto profundo',
        troughText: '5° — noches de enero',
        caption:
          'La capital del Nuevo Valle conserva el clima de las caravanas: sin lluvias, de cielos inmensos, y ferozmente calurosa hacia mayo — los fuertes romanos a lo largo de la ruta de los cuarenta días se guarnecían en invierno, y por una buena razón.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: 'ニューバレー県の県都 · 雨が降らない · キャラバン路の熱',
        gapText: '18℃ — 深い砂漠特有の寒暖差',
        troughText: '5℃ — 1月の夜',
        caption:
          'ニューバレー県の県都は、今もキャラバン時代さながらの気候を保っている——雨は降らず、空は途方もなく広く、5月には猛烈に暑くなる。「40日の道」沿いのローマ時代の砦が冬に守備隊を置いていたのには理由があったのだ。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
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
      es: {
        descriptors: 'Lagos de sal · Otoños de cosecha de dátiles · Sombra construida por los bereberes',
        gapText: '17° entre el mediodía y la medianoche',
        troughText: '4° — noches de invierno',
        caption:
          'El calendario de Siwa es único: la cosecha de dátiles perfuma octubre, los lagos de sal siguen siendo aptos para nadar mucho después del verano, y las noches de invierno son lo bastante frías como para justificar los muros de kershef.',
        seasonLabel: 'LA TEMPORADA — DE OCTUBRE A ABRIL',
      },
      ja: {
        descriptors: '塩湖 · ナツメヤシ収穫の秋 · ベルベル人が築いた日陰',
        gapText: '正午から真夜中まで17℃差',
        troughText: '4℃ — 冬の夜',
        caption:
          'シワ・オアシスのカレンダーはこの土地だけのものだ——10月はナツメヤシの収穫の香りに包まれ、塩湖は夏が終わってもずっと泳げるままで、冬の夜はケルシェフの壁が必要になるほど冷え込む。',
        seasonLabel: 'ベストシーズン — 10月〜4月',
      },
    },
  },
};
