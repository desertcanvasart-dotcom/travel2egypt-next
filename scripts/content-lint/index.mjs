/**
 * Content lint (docs/content-canon.md, VII.2: scripts, not prose).
 * Runs in every staging pre-flight on the locked copy files, and on its own:
 *
 *   node scripts/content-lint/index.mjs <file> [--lang en|es|ja] ...
 *
 * Three checks, per sentence:
 *  1. Banned vocabulary (canon II.5): ABORT, unless the phrase is on an
 *     explicit allow-list line in the locked file:  `lint-allow: <phrase>`
 *  2. Superlatives (canon II.3 as amended 2026-11-16):
 *     Tier 1  matches an approved entry in docs/established-superlatives.md → pass
 *     Tier 2  framed as our own judgement, or a comparison within the itinerary → pass
 *     Tier 3  ranks our product against others, or empty hype → ABORT
 *     else    a watch word in none of the tiers → FLAG (the page waits for owner approval)
 *  3. Typography (canon III.6): EN straight apostrophes → normalised (reported);
 *     °F anywhere → ABORT; italics markup in JA → ABORT; unaccented common ES words → ABORT.
 *
 * The owner extends the lists below; each list is per language.
 */
import { readFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);

export const BANNED = {
  en: ['nestled', 'hidden gem', 'must-visit', 'must-see', 'must visit', 'must see', 'breathtaking', 'bucket-list', 'bucket list', 'vibrant tapestry', 'rich history', 'look no further'],
  es: ['joya escondida', 'imprescindible', 'impresionante', 'de ensueño'],
  ja: ['隠れた名所', '絶景', '必見'],
};

export const TIER3 = {
  en: ['best tour', 'best price', 'lowest price', 'cheapest', '#1', 'number one', 'top-rated', 'top rated', 'unforgettable', 'once-in-a-lifetime', 'once in a lifetime'],
  es: ['el mejor tour', 'el mejor precio', 'el precio más bajo', 'el más barato', 'número uno', 'nº 1', 'inolvidable', 'una vez en la vida'],
  ja: ['最安値', '業界no.1', '業界ナンバーワン', 'ナンバーワン', '一生に一度'],
};

/** Tier 2: the sentence frames the superlative as ours, or compares parts of the same itinerary. */
export const TIER2 = {
  en: [/\bfor us\b/i, /\bin our experience\b/i, /\bof (this|the) (itinerary|trip|tour|journey|week|day)\b/i, /\b(day|night|stop|morning|afternoon|evening)s? (of|on|in) (this|the) (itinerary|trip|tour|journey|week)\b/i],
  es: [/\bpara nosotros\b/i, /\ben nuestra experiencia\b/i, /\bde(l| este| esta)? ?(itinerario|viaje|recorrido|tour|semana)\b/i],
  ja: [/私たちにとって/, /私たちの経験/, /この(旅程|旅|ツアー)/, /旅(の中)?で/, /行程(の中)?で/],
};

/** Watch words: a superlative in none of the tiers is flagged. */
export const WATCH = {
  // "most" + adjective: not "most of", not an adverb (-ly), not "most people".
  en: [/\b(oldest|largest|tallest|biggest|greatest|only|first|best)\b/i, /\bmost (?!of\b|people\b|visitors\b|travellers\b|travelers\b)[a-z]+(?<!ly)\b/i],
  es: [/(?<!\p{L})m[aá]s antigu[oa]s?(?!\p{L})/iu, /(?<!\p{L})m[aá]s grandes?(?!\p{L})/iu, /(?<!\p{L})[uú]nic[oa]s?(?!\p{L})/iu, /(?<!\p{L})primer[oa]?s?(?!\p{L})/iu],
  ja: [/最古/, /最大/, /唯一/, /初/],
};

/**
 * Not superlatives although they contain a watch word (order, place names, the
 * reader's own first visit). Owner-extendable. A real claim such as
 * "reassembled for the first time" still flags.
 */
export const NOT_SUPERLATIVE = {
  en: [/\bmatters? most\b/i, /\bmost (to|in|at|for|with|about|on)\b/i, /\bfirst cataract\b/i, /\bcomes? first\b/i, /\bvisit\w*\b.{0,40}\bfor the first time\b/i, /\bfirst (day|night|morning|evening|stop)\b/i],
  es: [/(?<!\p{L})un[oa]? [uú]nic[oa](?!\p{L})/iu, /\bprimera catarata\b/i, /\bva primero\b/i, /\bvisit\w*\b.{0,40}\bpor primera vez\b/i, /\bprimer (día|dia|noche)\b/i],
  ja: [/当初/, /初めて(の)?(エジプト|カイロ)?(を)?訪/, /初めての訪問/, /初日/],
};

/** Common Spanish words written without their accent. */
export const ES_UNACCENTED = ['kilometros', 'dias', 'mas antiguo', 'mas antigua', 'mas grande', 'tambien', 'ademas', 'despues', 'segun', 'facil', 'dificil', 'jardin', 'religion', 'region', 'educacion', 'informacion', 'excursion'];

const lower = (s) => s.toLocaleLowerCase();
const normApos = (s) => s.replace(/[’‘]/g, "'");

/** Split text into sentences (EN/ES on . ! ? ; JA on 。！？), keeping lines separate. */
export function sentences(text, lang) {
  const out = [];
  for (const line of text.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    const parts = lang === 'ja' ? t.split(/(?<=[。！？])/) : t.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡"“*(])/);
    for (const p of parts) if (p.trim()) out.push(p.trim());
  }
  return out;
}

/** Tier 1 entries: rows of docs/established-superlatives.md that the owner approved. */
export function loadEstablished(path = new URL('docs/established-superlatives.md', ROOT)) {
  if (!existsSync(path)) return { en: [], es: [], ja: [] };
  const rows = readFileSync(path, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.includes('|') && !/^\|?\s*-{3}/.test(l));
  const out = { en: [], es: [], ja: [] };
  for (const l of rows.slice(1)) {
    const cells = l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const [claim, es, ja, source, approved] = cells;
    if (!approved || /^(no|pending|)$/i.test(approved) || !source) continue;
    if (claim) out.en.push(lower(normApos(claim)));
    if (es) out.es.push(lower(es));
    if (ja) out.ja.push(ja);
  }
  return out;
}

/** Lines `lint-allow: <phrase>` in the locked file. */
function allowList(text) {
  return [...text.matchAll(/^\s*(?:<!--\s*)?lint-allow:\s*(.+?)\s*(?:-->)?\s*$/gim)].map((m) => lower(m[1]));
}

/**
 * Lint one text in one language. Returns { aborts, flags, notes }.
 * `established` defaults to docs/established-superlatives.md.
 */
export function lintText(text, lang, { established = loadEstablished(), file = '' } = {}) {
  const aborts = [];
  const flags = [];
  const notes = [];
  const allow = allowList(text);
  const body = text.replace(/^\s*(?:<!--\s*)?lint-allow:.*$/gim, '');

  // Typography (whole text)
  if (/°\s?F\b|℉/.test(body)) aborts.push({ rule: 'typography:fahrenheit', text: (body.match(/.{0,40}(°\s?F|℉).{0,20}/) ?? [''])[0], file });
  if (lang === 'ja' && /<\/?(em|i)\b|(^|[^*])\*[^*\s][^*]*\*(?!\*)|(^|\s)_[^_\s][^_]*_(\s|$)/m.test(body)) {
    aborts.push({ rule: 'typography:ja-italics', text: (body.match(/.{0,20}(<em>|<i>|\*[^*\s][^*]*\*|_[^_\s][^_]*_).{0,20}/) ?? [''])[0], file });
  }
  if (lang === 'en') {
    const n = (body.match(/(?<=\w)'(?=\w)|(?<=s)'(?=\s)/g) ?? []).length;
    if (n) notes.push({ rule: 'typography:apostrophes', text: `${n} straight apostrophe(s) normalised to ’ on write`, file });
  }
  if (lang === 'es') {
    for (const w of ES_UNACCENTED) {
      const re = new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, 'iu');
      if (re.test(body)) aborts.push({ rule: 'typography:es-accent', text: w, file });
    }
  }

  for (const s of sentences(body, lang)) {
    const ls = lower(normApos(s));
    // 1. Banned vocabulary
    for (const b of BANNED[lang] ?? []) if (ls.includes(b) && !allow.includes(b)) aborts.push({ rule: 'banned', text: s, word: b, file });
    // 2. Superlatives
    const t3 = (TIER3[lang] ?? []).find((b) => ls.includes(lower(b)));
    if (t3) {
      aborts.push({ rule: 'superlative:tier3', text: s, word: t3, file });
      continue;
    }
    // Drop phrases that contain a watch word but claim nothing.
    const claim = (NOT_SUPERLATIVE[lang] ?? []).reduce((acc, re) => acc.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'), ' '), s);
    const watched = (WATCH[lang] ?? []).map((re) => claim.match(re)?.[0]).filter(Boolean);
    if (!watched.length) continue;
    if ((established[lang] ?? []).some((claim) => ls.includes(claim))) continue; // Tier 1
    if ((TIER2[lang] ?? []).some((re) => re.test(s))) continue; // Tier 2
    flags.push({ rule: 'superlative:unclassified', text: s, word: watched.join(', '), file });
  }
  return { aborts, flags, notes };
}

/** Text of a locked file: .md as is; .json = every string value (locked ES/JA strings files). */
export function lockedText(path) {
  const raw = readFileSync(path, 'utf8');
  if (!String(path).endsWith('.json')) return raw;
  const vals = [];
  const walk = (v) => (typeof v === 'string' ? vals.push(v) : v && typeof v === 'object' && Object.values(v).forEach(walk));
  walk(JSON.parse(raw));
  return vals.join('\n');
}

const guessLang = (f) => (/[-_.]ja[-_.]|\bja-strings/.test(f) ? 'ja' : /[-_.]es[-_.]|\bes-strings/.test(f) ? 'es' : 'en');

/**
 * Pre-flight entry point. Lints each locked file; throws on any ABORT.
 * Returns the flags (the caller refuses --apply while there are unapproved flags).
 */
export function lintLocked(files, { quiet = false } = {}) {
  const all = { aborts: [], flags: [], notes: [] };
  for (const spec of files) {
    const [f, lang] = Array.isArray(spec) ? spec : [spec, guessLang(spec)];
    const r = lintText(lockedText(new URL(f, ROOT)), lang, { file: f });
    for (const k of Object.keys(all)) all[k].push(...r[k]);
  }
  if (!quiet) {
    for (const n of all.notes) console.log(`lint note  ${n.file}: ${n.text}`);
    for (const fl of all.flags) console.log(`lint FLAG  ${fl.file}: [${fl.word}] ${fl.text.slice(0, 140)}`);
  }
  if (all.aborts.length) {
    throw new Error(`content-lint ABORT (${all.aborts.length}):\n${all.aborts.map((a) => `  - ${a.rule}${a.word ? ` [${a.word}]` : ''} ${a.file}: ${a.text.slice(0, 140)}`).join('\n')}`);
  }
  if (!quiet) console.log(`content-lint: 0 aborts, ${all.flags.length} superlative flag(s) for owner review`);
  return all.flags;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang') continue;
    files.push(args[i + 1] === '--lang' ? [args[i], args[i + 2]] : args[i]);
    if (args[i + 1] === '--lang') i += 2;
  }
  try {
    const flags = lintLocked(files);
    process.exit(flags.length ? 2 : 0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
