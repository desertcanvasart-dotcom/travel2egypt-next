/**
 * Numeric-claim gate (canon III.2): every figure in an ES/JA string must
 * equal the figures in its EN source string. Number words are normalised
 * first (EN/ES words, JA 万/千, "1960s" ↔ "sesenta"/"1960〜70年代"), so the
 * same value written differently passes and a drifted value aborts.
 *
 *   numericGate(enStrings, locStrings, lang)   // keyed objects; throws on mismatch
 */

const EN_WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };
const ES_WORDS = { dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100 };
const ORDINAL_EN = { second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20 };
const MONTHS_EN = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const MONTHS_ES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18, XIX: 19, XX: 20, XXI: 21 };
/** Names that contain numbers but state no figure (hotel brands, place names). */
const NAMES = { en: ['four seasons', '6th of october'], es: ['four seasons', '6 de octubre'], ja: ['フォーシーズンズ', '10月6日市'] };
const ORDINAL_ES = { segundo: 2, segunda: 2, tercer: 3, tercero: 3, tercera: 3, cuarto: 4, quinto: 5, sexto: 6, séptimo: 7 };
const JA_KANJI = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

/** The set of numeric values a string states. Words like "a" / "one of" are ignored. */
export function figures(s, lang) {
  // Roman numerals after a name (Sety I, Ramses VI) are figures.
  let t = ` ${s.replace(/(?<=\p{Lu}\p{Ll}+ )(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b/gu, (r) => ` ${ROMAN[r]} `).toLowerCase()} `;
  for (const n of NAMES[lang] ?? []) t = t.split(n).join(' ');
  // Centuries in Roman numerals: "siglo XIV" (ES).
  if (lang === 'es') t = t.replace(/\bsiglos? ([xvi]+)\b/g, (_, r) => ` siglo ${ROMAN[r.toUpperCase()] ?? r} `);
  const out = [];
  // "twenty million" / "2000万" / "2,000"
  if (lang === 'ja') {
    t = t.replace(/(\d+(?:\.\d+)?)万/g, (_, n) => ` ${Math.round(parseFloat(n) * 10000)} `).replace(/(\d+(?:\.\d+)?)千/g, (_, n) => ` ${Math.round(parseFloat(n) * 1000)} `);
    // 一日 / 二つ / 三泊: single kanji numerals before a counter
    t = t.replace(/([一二三四五六七八九十])(?=[日泊つ人回か週柱羽体基本名階大度])/g, (k) => ` ${JA_KANJI[k]} `);
    // 1960〜70年代 → 1960 1970
    t = t.replace(/(\d{2})(\d{2})\s*[〜~～ー-]\s*(\d{2})年代/g, (_, c, d1, d2) => ` ${c}${d1} ${c}${d2} `);
  }
  t = t.replace(/(\d),(\d{3})/g, '$1$2');
  if (lang === 'en') {
    t = t.replace(/\b(\d{4})s\b/g, '$1');
    t = t.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|one|two|three|four|five|six|seven|eight|nine|ten) million\b/g, (_, w) => ` ${EN_WORDS[w] * 1000000} `);
    for (const [w, n] of Object.entries({ ...EN_WORDS, ...ORDINAL_EN })) t = t.replace(new RegExp(`\\b${w}\\b`, 'g'), ` ${n} `);
    t = t.replace(/\bmillion\b/g, '');
    for (const [w, n] of Object.entries(MONTHS_EN)) t = t.replace(new RegExp(`\\b${w}\\b`, 'g'), ` ${n} `);
  }
  if (lang === 'es') {
    // "los años sesenta y setenta" (decades) → 1960 1970
    t = t.replace(/años (sesenta|setenta|ochenta|noventa|cincuenta)(?: y (sesenta|setenta|ochenta|noventa))?/g, (_, a, b) => ` 19${ES_WORDS[a]} ${b ? `19${ES_WORDS[b]}` : ''} `);
    t = t.replace(/\b(\d+) millones\b/g, (_, n) => ` ${parseInt(n, 10) * 1000000} `);
    t = t.replace(/\b(veinte|treinta|diez|cinco|dos|tres) millones\b/g, (_, w) => ` ${ES_WORDS[w] * 1000000} `);
    for (const [w, n] of Object.entries(MONTHS_ES)) t = t.replace(new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, 'gu'), `$1 ${n} `);
    for (const [w, n] of Object.entries({ ...ES_WORDS, ...ORDINAL_ES })) t = t.replace(new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, 'gu'), `$1 ${n} `);
  }
  for (const m of t.matchAll(/\d+(?:\.\d+)?/g)) out.push(Number(m[0]));
  // 1 is left out: "a", "one of", "un/una", 一 are articles far more often than figures.
  return out.filter((n) => n !== 1);
}

/** Compare as multisets of distinct values (the same figure may be repeated in one language). */
const distinct = (a) => [...new Set(a)].sort((x, y) => x - y);

export function numericGate(en, loc, lang, { quiet = false } = {}) {
  const bad = [];
  for (const [k, v] of Object.entries(en)) {
    if (typeof v !== 'string' || typeof loc[k] !== 'string') continue;
    const a = distinct(figures(v, 'en'));
    const b = distinct(figures(loc[k], lang));
    // Every EN figure must appear in the translation, and no figure may be added.
    if (a.join(',') !== b.join(',')) bad.push({ key: k, en: a, [lang]: b });
  }
  if (bad.length) {
    throw new Error(`numeric gate ABORT (${lang}, ${bad.length}):\n${bad.map((x) => `  - ${x.key}: EN ${JSON.stringify(x.en)} ≠ ${lang.toUpperCase()} ${JSON.stringify(x[lang])}`).join('\n')}`);
  }
  if (!quiet) console.log(`numeric gate (${lang}): ${Object.keys(en).length} strings, every figure matches EN`);
}
