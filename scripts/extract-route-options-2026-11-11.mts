/**
 * Product page right column (owner spec, 2026-11-11) — extract `routeLegs`
 * and `customisationOptions` from each product's OWN text, with the same
 * rules as the phase 1 extraction (scripts/extract-product-facts-2026-11-09.mts):
 *
 * - Claude reads one product in one language and returns items, each with
 *   the sentence it came from. An item is kept ONLY if that sentence appears
 *   word for word in the product's text (whitespace, quotes, dashes
 *   normalised). No quote → no item.
 * - Route legs: every place (from, to, every stop sailed past) must appear in
 *   the product text; a stop sailed past on a cruise is kept only if it is
 *   named in that leg's own source sentence; the legs must chain
 *   (leg n's "to" = leg n+1's "from"). Otherwise the whole route for that
 *   language is dropped and reported — a partial route never renders.
 * - Customisation options: only changes the text already offers (swap, add,
 *   alternative transport…), 1–4, one short line each. None → nothing.
 * - Everything is written with needsReview: true (hidden on the site).
 *
 * Results are cached in migration/product-extraction-route/<id>.<lang>.json.
 *
 *   npx tsx scripts/extract-route-options-2026-11-11.mts             # extract (API) + cache
 *   … --write          also write routeLegs + customisationOptions to Sanity (needsReview: true)
 *   … --review         (re)write review/product-extraction/batch-01b-en.md from the cache
 *   … --only <slug,…>  restrict to EN slugs (default: Batch 1)
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';
import { createClient } from '@sanity/client';

import * as RL from '../src/lib/products/routeLabels.ts';
import type { RouteMode } from '../src/lib/products/routeLabels.ts';
// tsx loads the .ts module as CommonJS; read the named exports off the namespace.
const { ROUTE_MODES, routeModeLabel } = ((RL as any).default ?? RL) as typeof RL;

const sanity = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const MODEL = 'claude-opus-5-5';
const LANGS = ['en', 'es', 'ja'] as const;
type Lang = (typeof LANGS)[number];
const CACHE = 'migration/product-extraction-route';
const WRITE = process.argv.includes('--write');
const REVIEW = process.argv.includes('--review');
const arg = (f: string) => (process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : null);
fs.mkdirSync(CACHE, { recursive: true });

// Batch 1 (review/product-extraction/batches-plan.md), 7-Day tour first.
const BATCH_1 = [
  'epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs',
  '10-days-nile-dreamer-tour-experience',
  '10-day-egypt-travel-journey-through-history',
  '9-day-classic-egypt-family-adventure',
  '10-day-nile-and-western-desert-tour',
  '4-day-history-culture-escape',
  'pyramids-of-giza-and-grand-egyptian-museum',
  'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara',
  'pyramids-of-giza-and-sphinx-group-day-tour',
  'day-tour-to-karnak-luxor-temples-luxor-museum',
  'grand-west-bank-group-day-tour-luxor',
  'skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience',
  'abu-simbel-by-car-from-aswan', // listed in batches-plan under its old slug private-tour-abu-simble-by-bus-from-aswan
  'nubian-temples-day-tour-from-aswan',
  'aswan-felucca-adventure',
  '2-day-pyramids-mediterranean-tour',
  'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo',
];
const ONLY = arg('--only')?.split(',') ?? BATCH_1;

// ── Product text (phase 1 text + the customisation / concierge note) ──────
type Loc = Array<{ _key: string; value?: unknown }> | undefined | null;
const pick = (arr: Loc, l: Lang): unknown => (Array.isArray(arr) ? arr.find((x) => x?._key === l)?.value : undefined);
const blockText = (b: any): string => (Array.isArray(b?.children) ? b.children.map((c: any) => c?.text ?? '').join('') : '');
function ptToLines(pt: unknown): string[] {
  if (!Array.isArray(pt)) return [];
  const out: string[] = [];
  for (const b of pt) {
    if (b?._type !== 'block') continue;
    const t = blockText(b).trim();
    if (!t) continue;
    out.push(/^h[1-6]$/.test(b.style ?? '') ? `## ${t}` : b.listItem ? `- ${t}` : t);
  }
  return out;
}
interface Doc {
  _id: string;
  type: string;
  durationDays?: number | null;
  slug: Loc;
  title: Loc;
  summary: Loc;
  body: Loc;
  conciergeNote: Loc;
  days?: Array<{ dayNumber?: number; title?: Loc; accommodation?: Loc; morning?: Loc; afternoon?: Loc }> | null;
  timeline?: Array<{ time?: Loc; description?: Loc }> | null;
}
function productText(d: Doc, l: Lang): string {
  const lines: string[] = [];
  const title = pick(d.title, l);
  if (title) lines.push(`# ${title}`);
  const summary = pick(d.summary, l);
  if (typeof summary === 'string' && summary.trim()) lines.push(summary.trim());
  lines.push(...ptToLines(pick(d.body, l)));
  for (const day of d.days ?? []) {
    const t = pick(day.title, l);
    lines.push(`## Day ${day.dayNumber ?? ''}${t ? `: ${t}` : ''}`);
    const acc = pick(day.accommodation, l);
    if (acc) lines.push(`Overnight: ${acc}`);
    lines.push(...ptToLines(pick(day.morning, l)), ...ptToLines(pick(day.afternoon, l)));
  }
  for (const s of d.timeline ?? []) {
    const t = [pick(s.time, l), pick(s.description, l)].filter(Boolean).join(' — ');
    if (t) lines.push(`- ${t}`);
  }
  const note = pick(d.conciergeNote, l);
  if (typeof note === 'string' && note.trim()) lines.push('## Note', note.trim());
  return lines.join('\n');
}

const norm = (s: string) =>
  s
    .normalize('NFKC')
    .replace(/[‘’‚‛`´]/g, "'")
    .replace(/[“”„‟«»「」『』]/g, '"')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
const quoted = (text: string, src: string) => {
  const q = norm(src).replace(/^["'…\.]+|["'…\.]+$/g, '').trim();
  return q.length >= 8 && norm(text).includes(q);
};
const has = (text: string, name: string) => norm(text).includes(norm(name));

// ── Extraction ───────────────────────────────────────────────────────────
// A leg may cite up to 3 sentences (e.g. one naming the stops sailed past, one
// stating the nights); each must be an exact quote.
const Leg = z.object({
  from: z.string(),
  to: z.string(),
  via: z.array(z.string()),
  mode: z.enum(ROUTE_MODES as unknown as [RouteMode, ...RouteMode[]]),
  nights: z.number().int().nullable(),
  sources: z.array(z.string()),
});
const Opt = z.object({ option: z.string(), source: z.string() });
const Out = z.object({ routeLegs: z.array(Leg), customisationOptions: z.array(Opt) });
type OutT = z.infer<typeof Out>;

const SYSTEM = `You extract facts from a travel product page, for a human reviewer. You never add, infer or improve facts.

Return two lists, written in the SAME LANGUAGE as the page (place names as the page spells them):

1. routeLegs (multi-day products only; an empty list for day tours): the journey as an ordered chain of legs between overnight bases, from the first place to the last, ONLY where the page states how the traveller moves between them.
   - from / to: places (cities or towns), never a vehicle. "Nile cruise" is a mode, not a place.
   - mode: one of ${ROUTE_MODES.join(', ')}. sleeper_train = an overnight / sleeper / sleeping train; train = a daytime train; nile_cruise = a cruise ship on the Nile; dahabiya = a dahabiya; felucca = a felucca sail used to travel; flight = a domestic flight; road = by car, coach, van or "drive"; boat = any other boat or ferry.
   - nights: the number of nights spent on that leg ONLY if the page states it (e.g. "three nights aboard … between Aswan and Luxor" → 3); otherwise null.
   - via: places a CRUISE or DAHABIYA leg stops at on the way (e.g. "Kom Ombo", "Edfu"), in sailing order, ONLY if the page names them as stops on that leg (a route line such as "Where · Cairo → (sleeper train) → Aswan → Kom Ombo → Edfu → Luxor" counts). Otherwise an empty list. Never list sights inside a city.
   - The legs must chain: each leg's "to" is the next leg's "from". Include the return leg (e.g. back to Cairo) when the page states it. Repeated places are fine.
   - If the page does not let you build the WHOLE chain without guessing (how the traveller moves on every leg), return an empty list.
   - sources: 1 to 3 sentences that together state the leg: the mode, the nights (if any) and every via stop.

2. customisationOptions: changes the page ITSELF offers the traveller — a swap, an addition, an alternative way to travel, an extension, a substitution "on request". 1 to 4 items, each one short line (max ~55 characters), worded as an option the traveller can choose, starting with a verb (e.g. "Fly south instead of the sleeper train", "Add Abu Simbel at Aswan"). Merge items that are the same change. Only options the page states; never generic ideas (hotel upgrades, extra days) unless the page states them. If the page offers none, return an empty list. Never more than 4.

Every source must be ONE sentence (or one line) copied EXACTLY, character for character, from the page text. Never paraphrase a source. If you cannot quote a source, leave the item out.`;

// ES / JA: the same items as the approved-for-review EN set, found in this
// language's own text (so the owner's EN decisions map one-to-one).
const AlignLeg = z.object({ from: z.string(), to: z.string(), via: z.array(z.string()), sources: z.array(z.string()) }).nullable();
const AlignOpt = z.object({ option: z.string(), source: z.string() }).nullable();
const AlignOut = z.object({ routeLegs: z.array(AlignLeg), customisationOptions: z.array(AlignOpt) });
type AlignT = z.infer<typeof AlignOut>;
const ALIGN = `You map facts already extracted from the ENGLISH version of a travel product page onto the same product's page in another language, for a human reviewer. You never add, infer or improve facts.

You get the English route legs and customisation options, and the page in the target language. Return the SAME items in the SAME order and count:
- routeLegs[i]: the place names of English leg i as the target page spells them (from, to, via in order), with 1-3 sources = sentences copied EXACTLY from the target page that state that leg. Every via stop must be named in one of that leg's sources (a route line such as "Ruta · El Cairo → … → Luxor" or "ルート · カイロ → … → ルクソール" counts — prefer it when the page has one). null if the target page does not state that leg.
- customisationOptions[i]: English option i written as one short line in the target language (Spanish: informal "tú" register, starting with an infinitive; Japanese: plain, natural phrasing), with source = ONE sentence copied EXACTLY from the target page that offers it. null if the target page does not offer it.
Copy sources character for character. Never paraphrase a source.`;

const anthropic = new Anthropic();
const ask = async <T,>(system: string, content: string, schema: z.ZodType<T>): Promise<T | null> => {
  const res = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content }],
    output_config: { format: zodOutputFormat(schema as never) },
  });
  if (res.stop_reason === 'refusal' || !res.parsed_output) return null;
  return res.parsed_output as T;
};

export interface KeptLeg { from: string; to: string; via: string[]; mode: RouteMode; nights: number | null; source: string }
interface Kept {
  routeLegs: KeptLeg[];
  routeRejected?: string;
  options: Array<{ text: string; source: string }>;
  dropped: number;
}

function checkRoute(text: string, legs: Array<{ from: string; to: string; via: string[]; sources: string[] }>): string | undefined {
  if (legs.length === 0) return 'the text does not state how every leg is travelled';
  if (legs.some((g) => g.sources.length === 0 || g.sources.some((s) => !quoted(text, s)))) return 'a leg without an exact source sentence';
  if (legs.some((g) => !has(text, g.from) || !has(text, g.to))) return 'a place is not named in the text';
  if (legs.some((g) => g.via.some((v) => !g.sources.some((s) => has(s, v))))) return 'a stop sailed past is not named in its leg’s source';
  if (legs.some((g, i) => i > 0 && norm(legs[i - 1].to) !== norm(g.from))) return 'the legs do not chain';
  if (legs.length === 1 && norm(legs[0].from) === norm(legs[0].to)) return 'single-stop route';
  return undefined;
}
const joinSources = (xs: string[]) => xs.map((x) => x.trim()).join(' … ');

async function extractEn(d: Doc): Promise<{ kept: Kept; raw: unknown } | null> {
  const text = productText(d, 'en');
  if (text.replace(/\s/g, '').length < 200) return null;
  const isMulti = d.type === 'package';
  const out = await ask<OutT>(SYSTEM, `Product type: ${isMulti ? `multi-day package, ${d.durationDays ?? '?'} days as stored` : 'day tour (return an empty routeLegs list)'}.\nLanguage: en.\n\n<page>\n${text}\n</page>`, Out);
  if (!out) return null;
  let dropped = 0;
  const options = out.customisationOptions
    .filter((x) => (quoted(text, x.source) ? true : (dropped++, false)))
    .slice(0, 4)
    .map((x) => ({ text: x.option.trim(), source: x.source.trim() }));
  let routeLegs: KeptLeg[] = [];
  let routeRejected: string | undefined;
  if (isMulti) {
    routeRejected = checkRoute(text, out.routeLegs);
    if (!routeRejected)
      routeLegs = out.routeLegs.map((g) => ({ from: g.from.trim(), to: g.to.trim(), via: g.via.map((v) => v.trim()), mode: g.mode, nights: g.nights, source: joinSources(g.sources) }));
  }
  return { kept: { routeLegs, routeRejected, options, dropped }, raw: out };
}

async function extractAligned(d: Doc, l: Lang, en: Kept): Promise<{ kept: Kept; raw: unknown } | null> {
  const text = productText(d, l);
  if (text.replace(/\s/g, '').length < 200) return null;
  if (en.routeLegs.length === 0 && en.options.length === 0) return { kept: { routeLegs: [], routeRejected: 'none in EN', options: [], dropped: 0 }, raw: null };
  const enJson = JSON.stringify({
    routeLegs: en.routeLegs.map(({ from, to, via, mode, nights }) => ({ from, to, via, mode, nights })),
    customisationOptions: en.options.map((o) => o.text),
  });
  const out = await ask<AlignT>(ALIGN, `Target language: ${l}.\n\n<english_items>\n${enJson}\n</english_items>\n\n<page>\n${text}\n</page>`, AlignOut);
  if (!out) return null;
  let dropped = 0;
  const options = en.options.flatMap((_, i) => {
    const o = out.customisationOptions[i];
    if (!o || !quoted(text, o.source)) return (dropped++, []);
    return [{ text: o.option.trim(), source: o.source.trim() }];
  });
  let routeLegs: KeptLeg[] = [];
  let routeRejected: string | undefined;
  if (en.routeLegs.length) {
    const legs = en.routeLegs.map((_, i) => out.routeLegs[i]);
    if (legs.some((g) => !g)) routeRejected = 'a leg is not stated in this language';
    else {
      const ok = legs as Array<NonNullable<(typeof legs)[number]>>;
      routeRejected = checkRoute(text, ok);
      if (!routeRejected && ok.some((g, i) => g.via.length !== en.routeLegs[i].via.length)) routeRejected = 'stops differ from EN';
      if (!routeRejected)
        routeLegs = ok.map((g, i) => ({ from: g.from.trim(), to: g.to.trim(), via: g.via.map((v) => v.trim()), mode: en.routeLegs[i].mode, nights: en.routeLegs[i].nights, source: joinSources(g.sources) }));
    }
  }
  return { kept: { routeLegs, routeRejected, options, dropped }, raw: out };
}

// ── Run ──────────────────────────────────────────────────────────────────
const docs = await sanity.fetch<Doc[]>(
  `*[_type=="tour" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in $slugs]{
    _id, type, durationDays, slug, title, summary, body, conciergeNote, days, timeline
  }`,
  { slugs: ONLY },
);
const enSlug = (d: Doc) => (pick(d.slug, 'en') as { current?: string } | undefined)?.current ?? d._id;
docs.sort((a, b) => ONLY.indexOf(enSlug(a)) - ONLY.indexOf(enSlug(b)));
console.log(`${docs.length} products × ${LANGS.length} languages`);

const cacheFile = (d: Doc, l: Lang) => path.join(CACHE, `${d._id}.${l}.json`);
const queue = [...docs];
async function worker() {
  for (;;) {
    const d = queue.shift();
    if (!d) return;
    try {
      let en: Kept | null = null;
      if (fs.existsSync(cacheFile(d, 'en'))) en = JSON.parse(fs.readFileSync(cacheFile(d, 'en'), 'utf8')).kept;
      else {
        const r = await extractEn(d);
        en = r?.kept ?? null;
        fs.writeFileSync(cacheFile(d, 'en'), JSON.stringify({ slug: enSlug(d), lang: 'en', empty: !r, raw: r?.raw ?? null, kept: en }, null, 2));
      }
      for (const l of ['es', 'ja'] as const) {
        if (fs.existsSync(cacheFile(d, l)) || !en) continue;
        const r = await extractAligned(d, l, en);
        fs.writeFileSync(cacheFile(d, l), JSON.stringify({ slug: enSlug(d), lang: l, empty: !r, raw: r?.raw ?? null, kept: r?.kept ?? null }, null, 2));
      }
      const sum = (l: Lang) => {
        const k = fs.existsSync(cacheFile(d, l)) ? (JSON.parse(fs.readFileSync(cacheFile(d, l), 'utf8')).kept as Kept | null) : null;
        return `${l}: legs ${k?.routeLegs.length ?? 0}${k?.routeRejected && d.type === 'package' ? ` (${k.routeRejected})` : ''} · options ${k?.options.length ?? 0}`;
      };
      console.log(`  ✓ ${enSlug(d)} — ${LANGS.map(sum).join(' | ')}`);
    } catch (err) {
      console.error(`✗ ${enSlug(d)}`, err instanceof Error ? err.message : err);
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

const load = (d: Doc, l: Lang): Kept | null => {
  const file = path.join(CACHE, `${d._id}.${l}.json`);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')).kept as Kept | null) : null;
};

// ── Review file ──────────────────────────────────────────────────────────
if (REVIEW) {
  const titles = await sanity.fetch<Array<{ _id: string; t: string }>>(`*[_id in $ids]{ _id, "t": title[_key=="en"][0].value }`, { ids: docs.map((d) => d._id) });
  const md: string[] = [];
  const esc = (s: string) => s.replace(/\|/g, '/').replace(/\n+/g, ' ');
  md.push('# Product extraction — batch 01b (EN): route and "Make it your own"');
  md.push('');
  md.push('Supplementary to `batch-01-en.md`. Two new fields for the product page right column (owner spec 2026-11-11), for every Batch 1 product. None of the Batch 1 products had been approved yet, so all their new rows are here, in one place.');
  md.push('');
  md.push('How to review: tick ☐ → ☑ to approve a row. To correct a row, write the corrected wording after the item (e.g. `→ Fly to Aswan instead of the sleeper train`). Rows left unticked and uncorrected are rejected and deleted. Nothing here is on the site until you approve it.');
  md.push('');
  md.push('- **routeLegs** — "Your route" (multi-day only) and the panel\'s Route row. The route renders only when **every** leg of a product is approved; the Route row then lists the stops only (repeats kept), e.g. "Cairo · Aswan · Kom Ombo · Edfu · Luxor · Cairo". A stop sailed past (e.g. Kom Ombo · Edfu) is kept only where the leg\'s own source sentence names it. The leg label is generated from the mode + nights (shown in the "Shows as" column).');
  md.push('- **customisationOptions** — "Make it your own": 1–4 changes the product\'s own text already offers. One genuine option is enough; products whose text offers none get none.');
  md.push('');
  md.push('Every row quotes the exact sentence from the product page it was taken from; rows that could not be quoted were not created. ES and JA rows (same products) are written to Sanity too and follow your EN decisions.');
  md.push('');
  for (const d of docs) {
    const title = titles.find((t) => t._id === d._id)?.t ?? enSlug(d);
    const k = load(d, 'en');
    md.push(`## ${title}`);
    md.push('');
    md.push(`\`${enSlug(d)}\` · https://travel2egypt.org/${enSlug(d)}`);
    md.push('');
    if (!k) {
      md.push('_Not extracted (no English text)._');
      md.push('');
      continue;
    }
    const rows: string[] = [];
    let n = 0;
    if (d.type === 'package') {
      if (k.routeLegs.length) {
        const stops = [k.routeLegs[0].from, ...k.routeLegs.flatMap((g) => [...g.via, g.to])];
        md.push(`**Route row will read:** ${stops.join(' · ')}`);
        md.push('');
        for (const g of k.routeLegs) {
          const lbl = routeModeLabel(g.mode, g.nights, 'en');
          rows.push(`| ${++n} | routeLegs | ${esc(g.from)} → ${esc(g.to)}${g.via.length ? ` (via ${g.via.map(esc).join(' · ')})` : ''} | ${lbl} | "${esc(g.source)}" | ☐ |`);
        }
      } else {
        md.push(`**Route:** not extracted — ${k.routeRejected ?? 'no legs'}. No route block; the panel shows no single-stop Route row.`);
        md.push('');
      }
    }
    for (const o of k.options) rows.push(`| ${++n} | customisationOptions | ${esc(o.text)} | — | "${esc(o.source)}" | ☐ |`);
    if (rows.length) {
      md.push('| # | Field | Extracted item | Shows as | Source sentence (exact quote from the page) | Approve? |');
      md.push('|---|---|---|---|---|---|');
      md.push(...rows);
    } else md.push('_No route or customisation options could be extracted with a quotable source sentence._');
    md.push('');
  }
  fs.writeFileSync('review/product-extraction/batch-01b-en.md', md.join('\n'));
  console.log('wrote review/product-extraction/batch-01b-en.md');
}

// ── Write to Sanity (needsReview: true only) ─────────────────────────────
if (WRITE) {
  const k = () => Math.random().toString(36).slice(2, 12);
  const before = await sanity.fetch(`*[_id in $ids]{ _id, routeLegs, customisationOptions }`, { ids: docs.map((d) => d._id) });
  fs.mkdirSync('backups', { recursive: true });
  fs.writeFileSync(`backups/route-options-before-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(before, null, 2));
  let tx = sanity.transaction();
  const log: string[] = [];
  for (const d of docs) {
    const routeLegs: unknown[] = [];
    const customisationOptions: unknown[] = [];
    for (const l of LANGS) {
      const kept = load(d, l);
      if (!kept) continue;
      for (const g of kept.routeLegs)
        routeLegs.push({ _key: k(), _type: 'routeLeg', lang: l, from: g.from, to: g.to, via: g.via, mode: g.mode, ...(g.nights != null ? { nights: g.nights } : {}), source: g.source, needsReview: true });
      for (const o of kept.options) customisationOptions.push({ _key: k(), _type: 'productFact', lang: l, text: o.text, source: o.source, needsReview: true });
    }
    tx = tx.patch(d._id, (p) => p.set({ routeLegs, customisationOptions }));
    log.push(`${d._id} (${enSlug(d)}): routeLegs ${routeLegs.length}, customisationOptions ${customisationOptions.length}`);
  }
  await tx.commit();
  console.log(`written (all needsReview: true):\n${log.join('\n')}`);
}
