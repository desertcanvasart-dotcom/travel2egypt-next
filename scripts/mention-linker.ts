/**
 * Mention-based internal-link finder (FIND step) — read-only.
 *
 * Rebuild of the 2026-07-04 prototype, now with guards + tiers:
 *   - Longest-match wins across overlapping entity mentions
 *     (オールド・カイロ beats カイロ at the same position).
 *   - JA compound guard: a match whose adjacent character is katakana/・/ー
 *     is dropped (it is the middle of a longer katakana compound);
 *     adjacent kanji keeps the match but flags it (カイロ国際空港).
 *   - EN/ES title-phrase collision flags: lowercase-in-prose (the matched
 *     text starts lowercase where the entity title starts uppercase) and
 *     generic-title-phrase (the title contains guide/history/weather-style
 *     generic words) — both demote to Tier B.
 *   - Tier column: A = place/monument mention (city target, or attraction
 *     guideArticle target) with no flags — safe to apply in bulk after a
 *     spot-check; B = title-phrase matches and anything flagged — needs
 *     per-row review.
 *
 * Mechanics (unchanged from the prototype):
 *   - Entity index: cities, guideArticles, blog articles, tours — per-locale
 *     names + localized URLs (EN slug fallback).
 *   - Sources: published article bodies (one doc per language) and
 *     guideArticle bodies ([{_key: locale, value: blocks[]}]).
 *   - Skips text already inside internalLink/externalLink marks, skips
 *     self-links, one suggestion per (doc, locale, target), ≤8 per doc-locale.
 *   - Records block _key + char offset so the APPLY step can write the
 *     annotation precisely.
 *
 * Usage:
 *   npx tsx scripts/mention-linker.ts
 * Output:
 *   docs/mention-link-suggestions-tiered-<date>.csv
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

const MAX_PER_DOC = 8;
const MIN_NAME_LEN: Record<Locale, number> = { en: 3, es: 3, ja: 2 };

// Generic words that make an EN/ES title read as ordinary prose rather than
// a reference to the page ("Historia de Suez", "Best Time to Visit Egypt").
const GENERIC_TITLE_WORDS =
  /\b(guide|guía|guia|history|historia|weather|tiempo|clima|tips|consejos|best|mejor|época|epoca|how|cómo|como|things|visiting|visit|visita|travel|viaje|viajar|vacation|vacaciones|holiday|safety|seguridad|itinerary|itinerario|top)\b/i;

// ── localized-field helpers ────────────────────────────────────────────────

type IntlString = { _key: string; value?: string }[] | null | undefined;
type IntlSlug = { _key: string; value?: { current?: string } }[] | null | undefined;

const locValue = (arr: IntlString, locale: Locale): string | undefined => {
  if (!Array.isArray(arr)) return undefined;
  return arr.find((e) => e._key === locale)?.value ?? undefined;
};
const locValueWithFallback = (arr: IntlString, locale: Locale): string | undefined =>
  locValue(arr, locale) ?? locValue(arr, 'en');
const locSlug = (arr: IntlSlug, locale: Locale): string | undefined => {
  if (!Array.isArray(arr)) return undefined;
  return (
    arr.find((e) => e._key === locale)?.value?.current ??
    arr.find((e) => e._key === 'en')?.value?.current ??
    undefined
  );
};
const prefix = (locale: Locale) => (locale === 'en' ? '' : `/${locale}`);

// ── entity index ───────────────────────────────────────────────────────────

type Entity = {
  id: string;
  type: 'city' | 'guideArticle' | 'article' | 'tour';
  name: string; // per-locale display name (the anchor we search for)
  title: string; // canonical title for the CSV
  url: string;
  kind?: string; // guideArticle editorial kind (attraction, food, …)
  city?: string; // EN parent-city slug (guideArticle targets) — cross-city guard
};

async function buildEntityIndex(): Promise<Record<Locale, Entity[]>> {
  const [cities, guides, articles, tours] = await Promise.all([
    client.fetch(
      `*[_type=='city' && !(_id in path('drafts.**')) && defined(slug)]{_id, name, slug}`
    ),
    client.fetch(
      `*[_type=='guideArticle' && !(_id in path('drafts.**')) && defined(slug)]{_id, title, slug, kind, 'citySlug': parentCity->slug}`
    ),
    client.fetch(
      `*[_type=='article' && !(_id in path('drafts.**')) && defined(slug.current)]{_id, title, 'slug': slug.current, language}`
    ),
    client.fetch(
      `*[_type=='tour' && !(_id in path('drafts.**')) && defined(slug)]{_id, title, slug}`
    ),
  ]);

  const index: Record<Locale, Entity[]> = { en: [], es: [], ja: [] };
  for (const locale of LOCALES) {
    for (const c of cities) {
      const name = locValueWithFallback(c.name, locale);
      const slug = locSlug(c.slug, locale);
      if (!name || !slug || name.length < MIN_NAME_LEN[locale]) continue;
      index[locale].push({
        id: c._id,
        type: 'city',
        name,
        title: name,
        url: `${prefix(locale)}/guide/${slug}`,
      });
    }
    for (const g of guides) {
      const name = locValue(g.title, locale) ?? locValue(g.title, 'en');
      const slug = locSlug(g.slug, locale);
      const citySlug = locSlug(g.citySlug, locale);
      if (!name || !slug || !citySlug || name.length < MIN_NAME_LEN[locale]) continue;
      index[locale].push({
        id: g._id,
        type: 'guideArticle',
        name,
        title: name,
        url: `${prefix(locale)}/guide/${citySlug}/${slug}`,
        kind: g.kind,
        city: locSlug(g.citySlug, 'en'),
      });
    }
    for (const a of articles) {
      if (a.language !== locale) continue;
      if (!a.title || !a.slug || a.title.length < MIN_NAME_LEN[locale]) continue;
      index[locale].push({
        id: a._id,
        type: 'article',
        name: a.title,
        title: a.title,
        url: `${prefix(locale)}/blog/${a.slug}`,
      });
    }
    for (const t of tours) {
      const name = locValue(t.title, locale) ?? locValue(t.title, 'en');
      const slug = locSlug(t.slug, locale);
      if (!name || !slug || name.length < MIN_NAME_LEN[locale]) continue;
      index[locale].push({
        id: t._id,
        type: 'tour',
        name,
        title: name,
        url: `${prefix(locale)}/${slug}`,
      });
    }
    // Longest names first so greedy overlap resolution prefers them.
    index[locale].sort((a, b) => b.name.length - a.name.length);
  }
  return index;
}

// ── portable-text scanning ─────────────────────────────────────────────────

type PTSpan = { _type: string; text?: string; marks?: string[] };
type PTBlock = { _type: string; _key?: string; children?: PTSpan[]; markDefs?: { _key: string; _type: string }[] };

/** Concatenated block text + a per-char mask of ranges already inside a link mark. */
function blockText(block: PTBlock): { text: string; linked: boolean[] } {
  const linkKeys = new Set(
    (block.markDefs ?? [])
      .filter((d) => d._type === 'internalLink' || d._type === 'externalLink')
      .map((d) => d._key)
  );
  let text = '';
  const linked: boolean[] = [];
  for (const span of block.children ?? []) {
    if (span._type !== 'span' || typeof span.text !== 'string') continue;
    const isLinked = (span.marks ?? []).some((m) => linkKeys.has(m));
    // iterate UTF-16 units, not code points — match offsets are UTF-16 indices
    for (let i = 0; i < span.text.length; i++) {
      text += span.text[i];
      linked.push(isLinked);
    }
  }
  return { text, linked };
}

const isLetterOrDigit = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);
const isKatakanaOrDot = (ch: string | undefined) => !!ch && /[゠-ヿ]/.test(ch); // incl. ・ ー
const isKanji = (ch: string | undefined) => !!ch && /[一-鿿]/.test(ch);
const hasLatin = (s: string) => /[a-zA-Z]/.test(s);

type Candidate = {
  entity: Entity;
  start: number;
  end: number;
  matched: string;
  flags: string[];
};

function findCandidates(text: string, textLower: string, entities: Entity[], locale: Locale): Candidate[] {
  const out: Candidate[] = [];
  for (const e of entities) {
    const latin = hasLatin(e.name);
    const needle = latin ? e.name.toLowerCase() : e.name;
    const hay = latin ? textLower : text;
    let from = 0;
    while (true) {
      const i = hay.indexOf(needle, from);
      if (i === -1) break;
      from = i + 1;
      const end = i + needle.length;
      const before = text[i - 1];
      const after = text[end];
      const matched = text.slice(i, end);
      const flags: string[] = [];

      if (latin) {
        // word boundaries for Latin-script names
        if (isLetterOrDigit(before) || isLetterOrDigit(after)) continue;
        if (
          matched[0] !== e.name[0] &&
          matched[0] === matched[0].toLowerCase() &&
          e.name[0] === e.name[0].toUpperCase() &&
          // a lowercased leading article (el Valle de los Reyes) is normal prose
          !/^(el|la|los|las|un|una|the|a|an)\s/i.test(e.name)
        )
          flags.push('lowercase-in-prose');
        if (e.name.includes(' ') && GENERIC_TITLE_WORDS.test(e.name))
          flags.push('generic-title-phrase');
      } else {
        // JA compound guard: mid-katakana-compound → drop; kanji-adjacent → flag
        if (isKatakanaOrDot(before) || isKatakanaOrDot(after)) continue;
        if (isKanji(before) || isKanji(after)) flags.push('ja-kanji-adjacent');
      }
      out.push({ entity: e, start: i, end, matched, flags });
    }
  }
  return out;
}

/** Greedy non-overlap resolution, longest span first (then leftmost). */
function resolveOverlaps(cands: Candidate[]): Candidate[] {
  const sorted = [...cands].sort(
    (a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start
  );
  const kept: Candidate[] = [];
  for (const c of sorted) {
    if (kept.some((k) => c.start < k.end && k.start < c.end)) continue;
    kept.push(c);
  }
  return kept.sort((a, b) => a.start - b.start);
}

function sentenceAround(text: string, start: number, end: number): string {
  const stops = /[.!?。！？]/;
  let s = start;
  while (s > 0 && !stops.test(text[s - 1])) s--;
  let e = end;
  while (e < text.length && !stops.test(text[e])) e++;
  if (e < text.length) e++;
  let ctx = text.slice(s, e).trim();
  if (ctx.length > 200) ctx = ctx.slice(0, 197) + '…';
  return ctx;
}

// ── main ───────────────────────────────────────────────────────────────────

type Row = {
  locale: Locale;
  tier: 'A' | 'B';
  flags: string;
  source_type: string;
  source_title: string;
  source_url: string;
  anchor: string;
  target_type: string;
  target_title: string;
  target_url: string;
  target_id: string;
  context: string;
  source_id: string;
  block_key: string;
  offset: number;
};

const tierOf = (c: Candidate): 'A' | 'B' => {
  if (c.flags.length > 0) return 'B';
  if (c.entity.type === 'city') return 'A';
  if (c.entity.type === 'guideArticle' && c.entity.kind === 'attraction') return 'A';
  return 'B';
};

function scanBlocks(
  blocks: PTBlock[],
  entities: Entity[],
  locale: Locale,
  source: { id: string; type: string; title: string; url: string; city?: string }
): Row[] {
  const rows: Row[] = [];
  // Seed with targets ALREADY linked anywhere in this locale's body so a
  // page never accumulates two links to the same document across publish
  // cycles (first "Aswan" is linked+published → don't suggest the second).
  const seenTargets = new Set<string>();
  for (const block of blocks) {
    for (const md of block.markDefs ?? []) {
      const ref = (md as any).reference?._ref;
      if (md._type === 'internalLink' && ref) seenTargets.add(ref);
    }
  }
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    if (block._type !== 'block') continue;
    const { text, linked } = blockText(block);
    if (!text) continue;
    const textLower = text.toLowerCase();
    const applicable = entities.filter((e) => e.id !== source.id);
    const cands = resolveOverlaps(findCandidates(text, textLower, applicable, locale));
    for (const c of cands) {
      if (seenTargets.has(c.entity.id)) continue;
      // Cross-city guard: a guide page mentioning an attraction that lives
      // under ANOTHER city is often talking about a same-named local feature
      // (Philae's own Temple of Hathor vs Dendera's). Needs human review.
      if (
        source.city &&
        c.entity.type === 'guideArticle' &&
        c.entity.city &&
        c.entity.city !== source.city &&
        !c.flags.includes('cross-city-attraction')
      )
        c.flags.push('cross-city-attraction');
      // skip anything overlapping an existing link mark
      let isLinked = false;
      for (let i = c.start; i < c.end; i++) if (linked[i]) { isLinked = true; break; }
      if (isLinked) continue;
      seenTargets.add(c.entity.id);
      rows.push({
        locale,
        tier: tierOf(c),
        flags: c.flags.join('+'),
        source_type: source.type,
        source_title: source.title,
        source_url: source.url,
        anchor: c.matched,
        target_type: c.entity.type,
        target_title: c.entity.title,
        target_url: c.entity.url,
        target_id: c.entity.id,
        context: sentenceAround(text, c.start, c.end),
        source_id: source.id,
        block_key: block._key ?? String(bi),
        offset: c.start,
      });
      if (rows.length >= MAX_PER_DOC) return rows;
    }
  }
  return rows;
}

const csvEscape = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function main() {
  console.log('Building entity index…');
  const index = await buildEntityIndex();
  for (const l of LOCALES) console.log(`  ${l}: ${index[l].length} entities`);

  console.log('Fetching source bodies…');
  const [articles, guides] = await Promise.all([
    client.fetch(
      `*[_type=='article' && !(_id in path('drafts.**')) && defined(slug.current) && defined(body)]{_id, title, 'slug': slug.current, language, body}`
    ),
    client.fetch(
      `*[_type=='guideArticle' && !(_id in path('drafts.**')) && defined(slug) && defined(body)]{_id, title, slug, body, 'citySlug': parentCity->slug}`
    ),
  ]);
  console.log(`  ${articles.length} articles, ${guides.length} guideArticles`);

  const rows: Row[] = [];
  let bodies = 0;

  for (const a of articles) {
    const locale = a.language as Locale;
    if (!LOCALES.includes(locale) || !Array.isArray(a.body)) continue;
    bodies++;
    rows.push(
      ...scanBlocks(a.body, index[locale], locale, {
        id: a._id,
        type: 'article',
        title: a.title ?? '',
        url: `${prefix(locale)}/blog/${a.slug}`,
      })
    );
  }

  for (const g of guides) {
    if (!Array.isArray(g.body)) continue;
    for (const entry of g.body) {
      const locale = entry._key as Locale;
      if (!LOCALES.includes(locale) || !Array.isArray(entry.value)) continue;
      const slug = locSlug(g.slug, locale);
      const citySlug = locSlug(g.citySlug, locale);
      if (!slug || !citySlug) continue;
      bodies++;
      rows.push(
        ...scanBlocks(entry.value, index[locale], locale, {
          id: g._id,
          type: 'guideArticle',
          title: locValue(g.title, locale) ?? locValue(g.title, 'en') ?? '',
          url: `${prefix(locale)}/guide/${citySlug}/${slug}`,
          city: locSlug(g.citySlug, 'en'),
        })
      );
    }
  }

  const header =
    'locale,tier,flags,source_type,source_title,source_url,anchor,target_type,target_title,target_url,target_id,context,source_id,block_key,offset';
  const date = process.env.RUN_DATE || new Date().toISOString().slice(0, 10);
  const outPath = resolve(process.cwd(), `docs/mention-link-suggestions-tiered-${date}.csv`);
  writeFileSync(
    outPath,
    [header, ...rows.map((r) => Object.values(r).map(csvEscape).join(','))].join('\n') + '\n'
  );

  // summary
  const count = (pred: (r: Row) => boolean) => rows.filter(pred).length;
  console.log(`\nScanned ${bodies} bodies → ${rows.length} suggestions → ${outPath}`);
  for (const l of LOCALES)
    console.log(
      `  ${l}: ${count((r) => r.locale === l)}  (A: ${count((r) => r.locale === l && r.tier === 'A')}, B: ${count((r) => r.locale === l && r.tier === 'B')})`
    );
  const flagCounts: Record<string, number> = {};
  for (const r of rows)
    for (const f of r.flags ? r.flags.split('+') : []) flagCounts[f] = (flagCounts[f] ?? 0) + 1;
  console.log('  flags:', JSON.stringify(flagCounts));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
