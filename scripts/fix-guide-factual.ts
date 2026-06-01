/**
 * Workstream D — factual / cross-page consistency corrections (migration-staging).
 *
 * Data-driven exact-substring replacement in the EN body of specific guide
 * articles (the reviewer audited the English pages). Each FIX names the article
 * (city + slug), an exact `find` string, and its `replace`. The script:
 *   - fetches the published doc's EN body,
 *   - locates the block+span containing `find` (must match exactly once across
 *     the body unless `count` given),
 *   - replaces the substring in that span (preserving all _keys),
 *   - reports any FIX whose `find` matched 0 times (wording drift → inspect).
 *
 * Web-verified values (sources logged in session). Idempotent: a FIX whose
 * `find` is already absent AND whose `replace` is present is treated as done.
 *
 * Usage:
 *   npx tsx scripts/fix-guide-factual.ts --dry-run
 *   npx tsx scripts/fix-guide-factual.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

interface Fix { city: string; slug: string; find: string; replace: string; note?: string; type?: 'guideArticle' | 'city'; locale?: 'en' | 'es' | 'ja' }

const FIXES: Fix[] = [
  // F1 — Lake Bardawil area (Ramsar ~604 km²). [al-arish destination = city.overview]
  { type: 'city', city: 'al-arish', slug: 'al-arish', find: 'covering more than 700 square kilometres', replace: 'covering about 600 square kilometres', note: 'Bardawil area' },
  // F2 — Athribis Egyptian-German (Tübingen) mission began 2003, not 1969.
  { city: 'akhmim', slug: 'tours-in-akhmim', find: 'since 1969', replace: 'since 2003', note: 'Athribis mission start' },
  // F3 — Pelusium: Alexander reached Egypt 332 BC; Plague of Justinian AD 541.
  { city: 'al-arish', slug: 'ancient-city-of-pelusium', find: '333 BC', replace: '332 BC', note: 'Alexander at Pelusium' },
  { city: 'al-arish', slug: 'ancient-city-of-pelusium', find: 'AD 524', replace: 'AD 541', note: 'Plague of Justinian' },
  // F5 — Citadel of Qaitbay 1477–1479 (en-dash; align to dedicated pages).
  { type: 'city', city: 'alexandria', slug: 'alexandria', find: 'built in 1479–80', replace: 'built in 1477–1479', note: 'Qaitbay Citadel date (city overview)' },
  { city: 'alexandria', slug: 'things-to-do-in-alexandria', find: 'built in 1479–80', replace: 'built in 1477–1479', note: 'Qaitbay Citadel date' },
  // F6 — Pompey's Pillar ~27 m (align to dedicated Serapeum/Pillar pages).
  { city: 'alexandria', slug: 'things-to-do-in-alexandria', find: 'Twenty-five metres', replace: 'About twenty-seven metres', note: "Pompey's Pillar height" },
  // F7 — Aga Khan Mausoleum: align Aswan pages to dedicated page (pink limestone).
  { type: 'city', city: 'aswan', slug: 'aswan', find: 'pink Aswan granite', replace: 'pink limestone', note: 'Aga Khan material (city overview)' },
  { city: 'aswan', slug: 'things-to-do-in-aswan', find: 'pink Aswan granite', replace: 'pink limestone', note: 'Aga Khan material' },
  // F8 — Famine Stela ~187 BC (Year 18 of Ptolemy V), not 250 BC.
  { city: 'aswan', slug: 'sehel-island', find: '250 BC', replace: '187 BC', note: 'Famine Stela date' },
  // F9 — Crystal Mountain is barite & calcite, not quartzite.
  { city: 'bahariya-oasis', slug: 'things-to-do-in-bahariya-oasis', find: 'a small ridge of quartzite', replace: 'a small ridge of barite and calcite', note: 'Crystal Mountain mineral' },
  // F12 — Ancient Sands golf course is 18-hole, not 9.
  { city: 'al-gouna', slug: 'stay-in-al-gouna', find: '9-hole on-site golf course', replace: '18-hole on-site golf course', note: 'Ancient Sands holes' },
  // Doubled word.
  { city: 'al-minya', slug: 'top-restaurants-in-al-minya', find: 'dedicated dedicated', replace: 'dedicated', note: 'doubled word' },
  // F10 — Belzoni opened Khafre's pyramid in a single event on 2 March 1818
  // (no 1816 entry); burial-chamber inscription dated 2 (not 1) March 1818.
  { city: 'giza', slug: 'pyramid-of-khafre', find: 'first entered by the Italian explorer Giovanni Battista Belzoni in 1816.', replace: 'first entered by the Italian explorer Giovanni Battista Belzoni on 2 March 1818.', note: 'Belzoni entry date' },
  { city: 'giza', slug: 'pyramid-of-khafre', find: 'He returned in 1818, when he inscribed his name and the date of discovery — "Discovered by G. Belzoni. 1 Mar. 1818" —', replace: 'He inscribed his name and the date of discovery — "Discovered by G. Belzoni. 2 Mar. 1818" —', note: 'Belzoni inscription date + remove false two-visit framing' },
  // Coloured Canyon: ~20–30 km by road from Nuweiba, not "only three kilometres".
  { city: 'dahab', slug: 'coloured-canyon', find: 'only three kilometres from Nuweiba, the closer base', replace: 'about 20 to 30 kilometres by road from Nuweiba, the closer base', note: 'Coloured Canyon distance from Nuweiba' },
  // Qasr Dush walls: align to other Baris pages ("up to six metres").
  { city: 'baris', slug: 'the-roman-fortress-at-dush', find: 'rise to six metres in places, and to twelve in others', replace: 'rise to six metres in places', note: 'Dush wall height consistency' },
  // Speos Artemidos ~22 km south of Al-Minya (consistent with Beni Hasan ~20 km).
  { city: 'al-minya', slug: 'speos-artemidos', find: 'about twenty-eight kilometres south of Al-Minya', replace: 'about twenty-two kilometres south of Al-Minya', note: 'Speos distance consistency' },
  // El Gouna → Luxor: ~300 km / 4–5 h each way (was understated 220 km / 3–4 h).
  { city: 'al-gouna', slug: 'al-gouna-guided-tours', find: 'about 220 kilometres away — three to four hours each way', replace: 'about 300 kilometres away — four to five hours each way', note: 'El Gouna–Luxor distance' },
  { city: 'al-gouna', slug: 'al-gouna-guided-tours', find: 'six to eight hours of driving in total', replace: 'eight to ten hours of driving in total', note: 'El Gouna–Luxor total drive time consistency' },
  // El Gouna → Hurghada Intl Airport: ~40 km (figures were 25/26-30/41 across pages).
  { city: 'al-gouna', slug: 'mangroovy-beach', find: 'around twenty-five kilometres from Hurghada International Airport', replace: 'about forty kilometres from Hurghada International Airport', note: 'El Gouna–airport distance' },
  // Al Quseir Mövenpick is ~6 km north of town (El Quadim Bay), not ~1 km
  // (consistent with Food page "five to six kilometres north").
  { city: 'al-quseir', slug: 'getting-around-in-al-quseir', find: 'Mövenpick about a kilometre north', replace: 'Mövenpick about six kilometres north', note: 'Mövenpick distance consistency' },
  // Akhmim: Cairo–Sohag train ~6–7h (align to Tours page + reality; was low).
  { city: 'akhmim', slug: 'how-to-go-to-akhmim', find: 'From Cairo, the journey takes roughly five to six hours', replace: 'From Cairo, the journey takes roughly six to seven hours', note: 'Cairo–Sohag train time' },
  // Abu Simbel relocation cost ~$40M (align History page to main page + reality).
  { city: 'abu-simbel', slug: 'abu-simbel-historical-overview', find: 'cost around 36 million US dollars', replace: 'cost around 40 million US dollars', note: 'relocation cost consistency' },
  // Abu Simbel Great Temple interior depth: same page used 56m and 60m; unify on 56m.
  { type: 'city', city: 'abu-simbel', slug: 'abu-simbel', find: 'roughly 60-metre corridor', replace: 'roughly 56-metre corridor', note: 'temple length self-consistency' },
  // Fayoum waterwheels: "sharweel" is wrong (means "trousers"); they are the
  // water-powered taboot (per the dedicated Waterwheels page).
  { city: 'al-fayoum', slug: 'things-to-do-in-al-fayoum', find: 'sharweel', replace: 'taboot', note: 'waterwheel term' },
  // Abu Simbel drive-time: align main page (outlier 3–3.5h) to how-to-go + tours (3.5–4h).
  { type: 'city', city: 'abu-simbel', slug: 'abu-simbel', find: 'around three to three and a half hours each way', replace: 'around three and a half to four hours each way', note: 'Aswan–Abu Simbel drive time consistency' },
  // Mosque of Muhammad Ali completion: align Citadel page to dedicated mosque page (1848).
  { city: 'cairo', slug: 'the-citadel-of-saladin', find: 'begun 1830, completed 1857', replace: 'begun 1830, completed 1848', note: 'Muhammad Ali mosque date consistency' },
  // Bahariya: the Zed-Amun-ef-ankh / Bannentiu tombs are at Qarat Qasr Salim,
  // not Ain El-Hubaga (consistent with Travel Guide / History / Things to Do).
  { city: 'bahariya-oasis', slug: 'bawiti', find: 'The Decorated Tombs of Ain El-Hubaga', replace: 'The Decorated Tombs of Qarat Qasr Salim', note: 'Bawiti tomb location consistency' },
  // --- Second-pass consistency (verified against current live content) ---
  // Bir Umm Fawakhir is ~halfway on the ~180 km Quft–Quseir road, so ~90 km W.
  { city: 'al-quseir', slug: 'tours-in-al-quseir', find: 'Bir Umm Fawakhir, about sixty kilometres west on the Wadi Hammamat road', replace: 'Bir Umm Fawakhir, about ninety kilometres west on the Wadi Hammamat road', note: 'Bir Umm Fawakhir distance' },
  // Esna: the pronaos IS the hypostyle hall (begun under Claudius); only its
  // rear wall is Ptolemaic. Fixes the self-contradiction.
  { city: 'esna', slug: 'history-of-esna', find: 'Construction of the pronaos began under Ptolemy VI Philometor in the second century BC.', replace: 'Only the rear wall of the pronaos is Ptolemaic, built under Ptolemy VI Philometor and Ptolemy VIII Euergetes in the second century BC.', note: 'Esna pronaos build-history' },
  // El Gouna → Hurghada Intl Airport ~35–40 km (was understated 26–30).
  { city: 'al-gouna', slug: 'getting-around-in-al-gouna', find: 'around 26 to 30 kilometres south of El Gouna', replace: 'around 35 to 40 kilometres south of El Gouna', note: 'airport distance' },
  { city: 'al-gouna', slug: 'how-to-reach-al-gouna', find: 'roughly 26 to 30 kilometres south of El Gouna', replace: 'roughly 35 to 40 kilometres south of El Gouna', note: 'airport distance' },
  // Qasr al-Ghueita: align History page to Things-to-do (Persian main construction).
  { city: 'al-wadi-al-gadid', slug: 'history-of-al-wadi-al-gadid', find: 'began in the Twenty-Fifth Dynasty and was later expanded', replace: 'dates mainly to the Persian period in the late sixth century BC and was later expanded', note: 'Qasr al-Ghueita date consistency' },
  // Cairo Geniza: align Coptic Cairo summary to the dedicated Ben Ezra page.
  { city: 'cairo', slug: 'coptic-cairo', find: 'approximately 300,000 manuscript fragments dating from the ninth to nineteenth centuries', replace: 'around 400,000 manuscript fragments dating from the sixth to nineteenth centuries', note: 'Cairo Geniza figures' },
  // Qasr Qarun has no inscriptions; the two pages disagree on century — broaden
  // both to "the Ptolemaic period" to remove the contradiction honestly.
  { city: 'al-fayoum', slug: 'al-fayoum-events', find: 'the Ptolemaic period — roughly the 3rd to 2nd century BC — and stands', replace: 'the Ptolemaic period, and stands', note: 'Qasr Qarun date consistency' },
  { city: 'al-fayoum', slug: 'things-to-do-in-al-fayoum', find: 'the late Ptolemaic period — roughly the 1st century BC — and consists', replace: 'the Ptolemaic period, and consists', note: 'Qasr Qarun date consistency' },
  // Abu Simbel solar-festival page: last drive-time outlier → 3.5–4h (cluster-wide).
  { city: 'abu-simbel', slug: 'upcoming-events-in-abu-simbel', find: 'the drive takes about three to three and a half hours', replace: 'the drive takes about three and a half to four hours', note: 'Aswan–Abu Simbel drive time consistency' },

  // ============================================================
  // ES / JA — same factual errors in the translated bodies.
  // ============================================================
  // --- Spanish ---
  { locale: 'es', type: 'city', city: 'al-arish', slug: 'al-arish', find: 'más de 700 kilómetros cuadrados', replace: 'unos 600 kilómetros cuadrados', note: 'Bardawil area (es)' },
  { locale: 'es', city: 'bahariya-oasis', slug: 'things-to-do-in-bahariya-oasis', find: 'una pequeña cresta de cuarcita', replace: 'una pequeña cresta de barita y calcita', note: 'Crystal Mountain (es)' },
  { locale: 'es', city: 'aswan', slug: 'things-to-do-in-aswan', find: 'Construido en granito rosa de Asuán', replace: 'Construido en piedra caliza rosa', note: 'Aga Khan material (es)' },
  { locale: 'es', type: 'city', city: 'aswan', slug: 'aswan', find: 'construido en granito rosa de Asuán', replace: 'construido en piedra caliza rosa', note: 'Aga Khan material (es, city)' },
  { locale: 'es', city: 'alexandria', slug: 'things-to-do-in-alexandria', find: 'construida en 1479-80', replace: 'construida en 1477-1479', note: 'Qaitbay date (es)' },
  { locale: 'es', type: 'city', city: 'alexandria', slug: 'alexandria', find: 'construida en 1479-80', replace: 'construida en 1477-1479', note: 'Qaitbay date (es, city)' },
  { locale: 'es', type: 'city', city: 'abu-simbel', slug: 'abu-simbel', find: 'aproximadamente 60 metros del corredor', replace: 'aproximadamente 56 metros del corredor', note: 'temple length (es)' },
  { locale: 'es', city: 'akhmim', slug: 'tours-in-akhmim', find: 'misión egipcio-alemana desde 1969', replace: 'misión egipcio-alemana desde 2003', note: 'Athribis (es)' },
  { locale: 'es', city: 'al-arish', slug: 'ancient-city-of-pelusium', find: '333 a. C.', replace: '332 a. C.', note: 'Alexander (es)' },
  { locale: 'es', city: 'al-arish', slug: 'ancient-city-of-pelusium', find: 'epidemia en 524 d. C.', replace: 'epidemia en 541 d. C.', note: 'Plague (es)' },
  // --- Japanese ---
  { locale: 'ja', type: 'city', city: 'al-arish', slug: 'al-arish', find: '700平方kmを超えます', replace: '約600平方kmです', note: 'Bardawil area (ja)' },
  { locale: 'ja', city: 'bahariya-oasis', slug: 'things-to-do-in-bahariya-oasis', find: '小さな石英質の尾根', replace: '小さなバライト（重晶石）と方解石の尾根', note: 'Crystal Mountain (ja)' },
  { locale: 'ja', city: 'aswan', slug: 'things-to-do-in-aswan', find: 'ピンクのアスワンの花崗岩で', replace: 'ピンクの石灰岩で', note: 'Aga Khan material (ja)' },
  { locale: 'ja', type: 'city', city: 'aswan', slug: 'aswan', find: 'ピンクのアスワンの花崗岩で建てられ', replace: 'ピンクの石灰岩で建てられ', note: 'Aga Khan material (ja, city)' },
  { locale: 'ja', type: 'city', city: 'alexandria', slug: 'alexandria', find: '1479〜80年に', replace: '1477〜1479年に', note: 'Qaitbay date (ja, city)' },
  { locale: 'ja', city: 'akhmim', slug: 'tours-in-akhmim', find: '1969年からエジプト・ドイツ合同調査隊', replace: '2003年からエジプト・ドイツ合同調査隊', note: 'Athribis (ja)' },
  { locale: 'ja', city: 'al-arish', slug: 'ancient-city-of-pelusium', find: '紀元前333年', replace: '紀元前332年', note: 'Alexander (ja)' },
  { locale: 'ja', city: 'al-arish', slug: 'ancient-city-of-pelusium', find: '紀元524年', replace: '紀元541年', note: 'Plague (ja)' },
  // batch 3
  { locale: 'es', city: 'alexandria', slug: 'things-to-do-in-alexandria', find: 'Veinticinco metros de granito rojo', replace: 'Unos veintisiete metros de granito rojo', note: "Pompey's Pillar height (es)" },
  { locale: 'ja', city: 'alexandria', slug: 'things-to-do-in-alexandria', find: '1479〜80年に', replace: '1477〜1479年に', note: 'Qaitbay date (ja, things)' },
  { locale: 'es', city: 'aswan', slug: 'sehel-island', find: 'tallada hacia el 250 a. C.', replace: 'tallada hacia el 187 a. C.', note: 'Famine Stela date (es)' },
  { locale: 'ja', city: 'aswan', slug: 'sehel-island', find: '紀元前250年頃', replace: '紀元前187年頃', note: 'Famine Stela date (ja)' },
  { locale: 'es', city: 'al-minya', slug: 'speos-artemidos', find: 'a unos 28 kilómetros al sur de Al Minya', replace: 'a unos 22 kilómetros al sur de Al Minya', note: 'Speos distance (es)' },
  { locale: 'ja', city: 'al-minya', slug: 'speos-artemidos', find: 'アル・ミニヤの南約28km', replace: 'アル・ミニヤの南約22km', note: 'Speos distance (ja)' },
  { locale: 'es', city: 'baris', slug: 'the-roman-fortress-at-dush', find: 'hasta seis metros en algunos lugares y hasta doce en otros', replace: 'hasta seis metros en algunos lugares', note: 'Dush walls (es)' },
  { locale: 'ja', city: 'baris', slug: 'the-roman-fortress-at-dush', find: '場所によって6m、別の場所では12mにまで立ち上がり', replace: '場所によって最大6mまで立ち上がり', note: 'Dush walls (ja)' },
  // batch 4
  { locale: 'es', city: 'akhmim', slug: 'how-to-go-to-akhmim', find: 'Desde El Cairo, el trayecto dura unas cinco o seis horas', replace: 'Desde El Cairo, el trayecto dura unas seis o siete horas', note: 'Cairo–Sohag train (es)' },
  { locale: 'ja', city: 'akhmim', slug: 'how-to-go-to-akhmim', find: 'カイロからは約5〜6時間', replace: 'カイロからは約6〜7時間', note: 'Cairo–Sohag train (ja)' },
  { locale: 'es', city: 'giza', slug: 'pyramid-of-khafre', find: 'Giovanni Battista Belzoni en 1816.', replace: 'Giovanni Battista Belzoni el 2 de marzo de 1818.', note: 'Belzoni entry (es)' },
  { locale: 'es', city: 'giza', slug: 'pyramid-of-khafre', find: 'Regresó en 1818, momento en que inscribió su nombre y la fecha del descubrimiento («Discovered by G. Belzoni. 1 Mar. 1818»)', replace: 'Inscribió su nombre y la fecha del descubrimiento («Discovered by G. Belzoni. 2 Mar. 1818»)', note: 'Belzoni inscription (es)' },
  { locale: 'ja', city: 'giza', slug: 'pyramid-of-khafre', find: 'ベルツォーニで、1816年のことでした。', replace: 'ベルツォーニで、1818年3月2日のことでした。', note: 'Belzoni entry (ja)' },
  { locale: 'ja', city: 'giza', slug: 'pyramid-of-khafre', find: '彼は1818年に戻り、玄室の南壁に自分の名前と発見の日付、「G・ベルツォーニにより発見。1818年3月1日」を刻みました。', replace: '彼は玄室の南壁に自分の名前と発見の日付、「G・ベルツォーニにより発見。1818年3月2日」を刻みました。', note: 'Belzoni inscription (ja)' },
  { locale: 'es', city: 'dahab', slug: 'coloured-canyon', find: 'a solo tres kilómetros de Nuweiba, la base más cercana', replace: 'a unos 20 a 30 kilómetros por carretera de Nuweiba, la base más cercana', note: 'Coloured Canyon distance (es)' },
  { locale: 'ja', city: 'dahab', slug: 'coloured-canyon', find: 'ヌウェイバからはわずか3kmです', replace: 'ヌウェイバからは道路で約20〜30kmです', note: 'Coloured Canyon distance (ja)' },
  // batch 5
  { locale: 'es', city: 'al-gouna', slug: 'al-gouna-guided-tours', find: 'a unos 220 kilómetros —tres a cuatro horas en cada sentido', replace: 'a unos 300 kilómetros —cuatro a cinco horas en cada sentido', note: 'El Gouna–Luxor (es)' },
  { locale: 'ja', city: 'al-gouna', slug: 'al-gouna-guided-tours', find: '道路距離は約220km', replace: '道路距離は約300km', note: 'El Gouna–Luxor distance (ja)' },
  { locale: 'ja', city: 'al-gouna', slug: 'al-gouna-guided-tours', find: '片道3〜4時間ほどです', replace: '片道4〜5時間ほどです', note: 'El Gouna–Luxor time (ja)' },
  { locale: 'es', city: 'al-gouna', slug: 'mangroovy-beach', find: 'a unos veinticinco kilómetros del Aeropuerto Internacional de Hurghada', replace: 'a unos cuarenta kilómetros del Aeropuerto Internacional de Hurghada', note: 'airport distance (es)' },
  { locale: 'ja', city: 'al-gouna', slug: 'mangroovy-beach', find: 'ハルガダ国際空港から約25km', replace: 'ハルガダ国際空港から約40km', note: 'airport distance (ja)' },
  { locale: 'es', city: 'al-quseir', slug: 'getting-around-in-al-quseir', find: 'el Mövenpick a un kilómetro al norte', replace: 'el Mövenpick a unos seis kilómetros al norte', note: 'Mövenpick distance (es)' },
  { locale: 'ja', city: 'al-quseir', slug: 'getting-around-in-al-quseir', find: 'Mövenpick は町の北約1km', replace: 'Mövenpick は町の北約6km', note: 'Mövenpick distance (ja)' },
  // batch 6
  // NOTE: Bawiti es/ja deliberately NOT changed — those translations are an
  // older version describing tombs genuinely near the Ain El-Hubaga spring
  // (Fakhry 1938), internally consistent; not the en Qarat Qasr Salim mislabel.
  { locale: 'es', city: 'cairo', slug: 'the-citadel-of-saladin', find: 'completada en 1857 d. C.', replace: 'completada en 1848 d. C.', note: 'Muhammad Ali mosque date (es)' },
  { locale: 'ja', city: 'cairo', slug: 'the-citadel-of-saladin', find: '1830年着工、1857年完成', replace: '1830年着工、1848年完成', note: 'Muhammad Ali mosque date (ja)' },
  { locale: 'es', type: 'city', city: 'abu-simbel', slug: 'abu-simbel', find: 'entre tres horas y tres horas y media en cada sentido', replace: 'entre tres horas y media y cuatro horas en cada sentido', note: 'Aswan drive time (es)' },
  { locale: 'es', city: 'al-fayoum', slug: 'al-fayoum-events', find: 'del periodo ptolemaico — aproximadamente del siglo III al II a. C. — y se alza', replace: 'del periodo ptolemaico y se alza', note: 'Qasr Qarun date (es)' },
  // batch 7 (final)
  { locale: 'ja', type: 'city', city: 'abu-simbel', slug: 'abu-simbel', find: '片道の所要時間は約3〜3時間半です', replace: '片道の所要時間は約3時間半〜4時間です', note: 'Aswan drive time (ja)' },
  { locale: 'ja', city: 'alexandria', slug: 'things-to-do-in-alexandria', find: '赤色アスワン花崗岩の25m', replace: '赤色アスワン花崗岩の約27m', note: "Pompey's Pillar height (ja)" },
  { locale: 'es', city: 'al-fayoum', slug: 'things-to-do-in-al-fayoum', find: 'del periodo ptolemaico tardío — aproximadamente del siglo I a. C. — y consta', replace: 'del periodo ptolemaico y consta', note: 'Qasr Qarun date (es, things)' },
  { locale: 'ja', city: 'al-fayoum', slug: 'things-to-do-in-al-fayoum', find: '神殿はプトレマイオス朝後期、およそ紀元前1世紀の建物で', replace: '神殿はプトレマイオス朝の建物で', note: 'Qasr Qarun date (ja, things)' },
  { locale: 'ja', city: 'al-fayoum', slug: 'al-fayoum-events', find: '神殿はプトレマイオス時代、およそ紀元前3〜2世紀にさかのぼり', replace: '神殿はプトレマイオス時代にさかのぼり', note: 'Qasr Qarun date (ja, events)' },
];

interface Span { _type: string; _key?: string; text?: string }
interface Block { _key: string; _type: string; children?: Span[] }
interface LE<T> { _key: string; value: T }

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) { if (a === '--commit') commit = true; else if (a === '--dry-run') dryRun = true; else { process.stderr.write(`Unknown arg: ${a}\n`); process.exit(2); } }
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }
  return { commit, dryRun };
}
function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against ${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Factual corrections ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}   fixes: ${FIXES.length}\n`);
  const client = getClient();

  // group fixes by (type,city,slug)
  const byDoc = new Map<string, Fix[]>();
  for (const f of FIXES) { const k = `${f.type ?? 'guideArticle'}|${f.city}|${f.slug}`; if (!byDoc.has(k)) byDoc.set(k, []); byDoc.get(k)!.push(f); }

  let applied = 0, missed = 0, alreadyDone = 0;
  let tx = client.transaction();
  let ops = 0;

  for (const [key, fixes] of byDoc) {
    const [type, city, slug] = key.split('|');
    const field = type === 'city' ? 'overview' : 'body';
    const doc = type === 'city'
      ? await client.fetch<{ _id: string; overview?: LE<Block[]>[] } | null>(
          `*[_type=="city" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]{ _id, overview }`, { s: slug })
      : await client.fetch<{ _id: string; body?: LE<Block[]>[] } | null>(
          `*[_type=="guideArticle" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s && parentCity->slug[_key=="en"][0].value.current==$c][0]{ _id, body }`,
          { s: slug, c: city });
    if (!doc) { console.log(`  ✗ ${type} ${city}/${slug}: doc not found`); missed += fixes.length; continue; }
    const fieldVal = (doc as Record<string, unknown>)[field] as LE<Block[]>[] | undefined;

    let changed = false;
    for (const f of fixes) {
      const loc = f.locale ?? 'en';
      const entry = fieldVal?.find((e) => e._key === loc);
      if (!entry || !Array.isArray(entry.value)) { console.log(`  ✗ ${city}/${slug} [${loc}]: no ${field}`); missed++; continue; }
      let matches = 0;
      for (const block of entry.value) {
        if (block._type !== 'block' || !Array.isArray(block.children)) continue;
        for (const sp of block.children) {
          if (sp._type === 'span' && typeof sp.text === 'string' && sp.text.includes(f.find)) {
            sp.text = sp.text.split(f.find).join(f.replace);
            matches++;
            changed = true;
          }
        }
      }
      if (matches > 0) { console.log(`  ✓ ${city}/${slug} [${loc}]: "${f.find}" → "${f.replace}" (${matches}×)  [${f.note ?? ''}]`); applied++; }
      else {
        const present = entry.value.some((b) => b.children?.some((s) => typeof s.text === 'string' && s.text.includes(f.replace)));
        if (present) { console.log(`  - ${city}/${slug} [${loc}]: "${f.find}" not found but replacement present — already done`); alreadyDone++; }
        else { console.log(`  ⚠ ${city}/${slug} [${loc}]: FIND NOT MATCHED: "${f.find}"  [${f.note ?? ''}]`); missed++; }
      }
    }
    if (changed && args.commit) { tx = tx.patch(doc._id, (p) => p.set({ [field]: fieldVal })); ops++; }
  }

  if (args.commit && ops > 0) { await tx.commit({ visibility: 'sync' }); console.log(`\n✓ Committed ${ops} doc patches.`); }
  console.log(`\n=== Summary ===\napplied: ${applied}   already-done: ${alreadyDone}   missed/unmatched: ${missed}`);
  if (!args.commit) console.log('\nDry-run — no writes.');
}

main().catch((e) => { console.error(e); process.exit(1); });
