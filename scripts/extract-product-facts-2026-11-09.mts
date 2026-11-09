/**
 * Product page template (owner spec, 2026-11-09) — extract Included / Not
 * included and the Itinerary at a glance from each product's OWN text.
 *
 * - Claude reads one product in one language and returns items, each with the
 *   sentence it came from. This script then keeps an item ONLY if that
 *   sentence appears word for word in the product's text (whitespace, quotes
 *   and dashes normalised). No quote → no item.
 * - An itinerary is kept only if every day 1..durationDays is covered and
 *   every night except the last is stated in the text; otherwise it is left
 *   empty and reported.
 * - Everything is written with needsReview: true (hidden on the site). The
 *   Nile Dreamer's EN nights are the owner-confirmed values, needsReview:false.
 * - Results are cached in migration/product-extraction/<id>.<lang>.json, so a
 *   re-run only calls the API for products not yet extracted.
 *
 *   npx tsx scripts/extract-product-facts-2026-11-09.mts            # extract (API) + write cache
 *   npx tsx scripts/extract-product-facts-2026-11-09.mts --write    # also write to Sanity (backup first)
 *   … --only <slug,slug>   restrict to EN slugs
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';
import { createClient } from '@sanity/client';

const sanity = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const anthropic = new Anthropic();
const MODEL = 'claude-opus-5-5';
const LANGS = ['en', 'es', 'ja'] as const;
type Lang = (typeof LANGS)[number];
const CACHE = 'migration/product-extraction';
const WRITE = process.argv.includes('--write');
const ONLY = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
fs.mkdirSync(CACHE, { recursive: true });

// ── Product text ─────────────────────────────────────────────────────────
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
  tourMode?: string;
  durationDays?: number | null;
  slug: Loc;
  title: Loc;
  summary: Loc;
  body: Loc;
  days?: Array<{ dayNumber?: number; title?: Loc; accommodation?: Loc; morning?: Loc; afternoon?: Loc }> | null;
  timeline?: Array<{ time?: Loc; description?: Loc }> | null;
  includedItems?: Loc;
  notIncludedItems?: Loc;
  seo?: { metaDescription?: Loc } | null;
  cities?: Array<{ name?: Loc }> | null;
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
  return lines.join('\n');
}

// Quote check: the source must appear word for word (normalised).
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

// ── Extraction ───────────────────────────────────────────────────────────
const Item = z.object({ item: z.string(), source: z.string() });
const Day = z.object({ day: z.number().int(), title: z.string(), overnight: z.string().nullable(), source: z.string() });
const Out = z.object({ inclusions: z.array(Item), exclusions: z.array(Item), itinerary: z.array(Day) });
type OutT = z.infer<typeof Out>;

const SYSTEM = `You extract facts from a travel product page, for a human reviewer. You never add, infer or improve facts.

Return three lists, written in the SAME LANGUAGE as the page:
1. inclusions: what the price includes, ONLY where the page states it (e.g. hotel nights, cruise nights, guide, transfers, entry tickets, meals, flights, train). One short item each (word for word or trimmed from the page). Do not turn descriptions of sights into inclusions unless the page says they are included.
2. exclusions: what the page states is NOT included (e.g. "international flights are not included"). Only explicit statements.
3. itinerary (multi-day products only; empty for day tours): one row per day with day number, a short title (3-8 words, taken from the page's own wording), and overnight = the place the traveller sleeps that night as the page states it (e.g. "Cairo", "Sleeper train", "Nile cruise"), or null on the final departure day. Fill it ONLY if the page lets you map every single day to its text without guessing; otherwise return an empty list.

For EVERY item and row, "source" must be ONE sentence copied EXACTLY, character for character, from the page text (the sentence that states it). Never paraphrase the source. If you cannot quote a source sentence for an item, do not include the item.`;

async function extract(d: Doc, l: Lang): Promise<{ out: OutT; text: string } | null> {
  const text = productText(d, l);
  if (text.replace(/\s/g, '').length < 200) return null;
  const isMulti = d.type === 'package';
  const res = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: `Product type: ${isMulti ? `multi-day package, ${d.durationDays ?? '?'} days as stored` : 'day tour (return an empty itinerary)'}.\nLanguage: ${l}.\n\n<page>\n${text}\n</page>`,
      },
    ],
    output_config: { format: zodOutputFormat(Out) },
  });
  if (res.stop_reason === 'refusal' || !res.parsed_output) return null;
  return { out: res.parsed_output, text };
}

interface Kept {
  inclusions: Array<{ text: string; source: string }>;
  exclusions: Array<{ text: string; source: string }>;
  itinerary: Array<{ day: number; title: string; overnight: string | null; source: string }>;
  dropped: number;
  itineraryRejected?: string;
}

function validate(d: Doc, text: string, out: OutT): Kept {
  let dropped = 0;
  const keep = (xs: Array<{ item: string; source: string }>) =>
    xs.filter((x) => (quoted(text, x.source) ? true : (dropped++, false))).map((x) => ({ text: x.item.trim(), source: x.source.trim() }));
  const inclusions = keep(out.inclusions);
  const exclusions = keep(out.exclusions);
  let itinerary: Kept['itinerary'] = [];
  let itineraryRejected: string | undefined;
  if (d.type === 'package' && out.itinerary.length > 0) {
    const n = d.durationDays ?? 0;
    const rows = [...out.itinerary].sort((a, b) => a.day - b.day);
    const unquoted = rows.filter((r) => !quoted(text, r.source));
    if (!n) itineraryRejected = 'no durationDays stored';
    else if (rows.length !== n || rows.some((r, i) => r.day !== i + 1)) itineraryRejected = `days returned ${rows.length}, stored ${n}`;
    else if (unquoted.length) itineraryRejected = `${unquoted.length} day(s) without an exact source sentence`;
    else if (rows.slice(0, -1).some((r) => !r.overnight)) itineraryRejected = 'a night before the last day is not stated';
    else itinerary = rows.map((r) => ({ day: r.day, title: r.title.trim(), overnight: r.overnight?.trim() || null, source: r.source.trim() }));
  } else if (d.type === 'package') itineraryRejected = 'could not map every day without guessing';
  return { inclusions, exclusions, itinerary, dropped, itineraryRejected };
}

// Owner-confirmed Nile Dreamer nights (spec §0.7) — EN overnight values.
const NILE_DREAMER = '10-days-nile-dreamer-tour-experience';
const NILE_DREAMER_NIGHTS: Record<number, string | null> = {
  1: 'Cairo', 2: 'Cairo', 3: 'Sleeper train', 4: 'Aswan hotel', 5: 'Cruise', 6: 'Cruise', 7: 'Cruise', 8: 'Cairo', 9: 'Cairo', 10: null,
};

// ── Run ──────────────────────────────────────────────────────────────────
const docs = await sanity.fetch<Doc[]>(`*[_type=="tour" && !(_id in path("drafts.**")) && hidden != true]{
  _id, type, tourMode, durationDays, slug, title, summary, body, days, timeline, includedItems, notIncludedItems, seo, "cities": cities[]->{name}
}`);
const enSlug = (d: Doc) => (pick(d.slug, 'en') as { current?: string } | undefined)?.current ?? d._id;
const todo = docs.filter((d) => !ONLY || ONLY.includes(enSlug(d)));
console.log(`${todo.length} products × ${LANGS.length} languages`);

const jobs: Array<{ d: Doc; l: Lang }> = todo.flatMap((d) => LANGS.map((l) => ({ d, l })));
let done = 0;
async function worker() {
  for (;;) {
    const job = jobs.shift();
    if (!job) return;
    const { d, l } = job;
    const file = path.join(CACHE, `${d._id}.${l}.json`);
    if (fs.existsSync(file)) {
      done++;
      continue;
    }
    try {
      const r = await extract(d, l);
      const kept = r ? validate(d, r.text, r.out) : null;
      fs.writeFileSync(file, JSON.stringify({ slug: enSlug(d), lang: l, empty: !r, kept }, null, 2));
    } catch (err) {
      console.error(`✗ ${enSlug(d)} [${l}]`, err instanceof Error ? err.message : err);
    }
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${todo.length * LANGS.length}`);
  }
}
await Promise.all(Array.from({ length: 10 }, worker));

// ── Write to Sanity ──────────────────────────────────────────────────────
if (!WRITE) {
  console.log('extracted (cache only) — pass --write to save to Sanity');
  process.exit(0);
}
const k = () => Math.random().toString(36).slice(2, 12);
const backup: unknown[] = [];
let tx = sanity.transaction();
let n = 0;
for (const d of todo) {
  const inclusions: unknown[] = [];
  const exclusions: unknown[] = [];
  const itineraryDays: unknown[] = [];
  for (const l of LANGS) {
    const file = path.join(CACHE, `${d._id}.${l}.json`);
    if (!fs.existsSync(file)) continue;
    const { kept } = JSON.parse(fs.readFileSync(file, 'utf8')) as { kept: Kept | null };
    if (!kept) continue;
    for (const x of kept.inclusions) inclusions.push({ _key: k(), _type: 'productFact', lang: l, text: x.text, source: x.source, needsReview: true });
    for (const x of kept.exclusions) exclusions.push({ _key: k(), _type: 'productFact', lang: l, text: x.text, source: x.source, needsReview: true });
    const nd = enSlug(d) === NILE_DREAMER && l === 'en';
    for (const r of kept.itinerary)
      itineraryDays.push({
        _key: k(),
        _type: 'itineraryDay',
        lang: l,
        day: r.day,
        title: r.title,
        overnight: nd ? NILE_DREAMER_NIGHTS[r.day] : r.overnight,
        source: r.source,
        needsReview: true,
        overnightNeedsReview: !nd,
      });
  }
  backup.push({ _id: d._id });
  tx = tx.patch(d._id, (p) => p.set({ inclusions, exclusions, itineraryDays }));
  if (++n % 40 === 0) {
    await tx.commit();
    tx = sanity.transaction();
  }
}
await tx.commit();
fs.writeFileSync(`backups/product-extraction-ids-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2));
console.log(`written ${n} products (all items needsReview: true)`);
