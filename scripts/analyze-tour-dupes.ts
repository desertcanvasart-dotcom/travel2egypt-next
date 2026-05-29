/**
 * READ-ONLY. Builds the old→new duplicate match map for tour dedup.
 *
 * "Broken" old docs  = published wp-page-* tours with an EN body but NO ES body.
 * "Corpus" new docs  = published tour.* docs (all trilingual from the final import).
 *
 * For each broken doc, scores every corpus doc by EN-slug token overlap +
 * title token overlap, with a same-city boost, and buckets the best match:
 *   high   – one slug's tokens fully contain the other's (a refinement), same city
 *   medium – ≥0.5 token overlap, same city
 *   low    – best < those thresholds  →  treated as UNMATCHED (keep, flag)
 *
 * Prints a review table. Writes nothing. The actual redirect+unpublish step
 * consumes the emitted JSON map after the operator approves it.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  perspective: 'published',
  token: process.env.SANITY_API_READ_TOKEN || process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const STOP = new Set(['the', 'of', 'to', 'and', 'a', 'an', 'from', 'in', 'by', 'day', 'tour', 'tours', 'trip', 'private', 'group', 'full', 'small']);
const toks = (s: string) =>
  new Set(
    (s || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t && !STOP.has(t)),
  );
const overlap = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n / Math.min(a.size, b.size);
};
const subset = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return false;
  const [s, l] = a.size <= b.size ? [a, b] : [b, a];
  for (const t of s) if (!l.has(t)) return false;
  return true;
};

interface Doc { _id: string; enSlug: string; enTitle: string; esSlug: string; city: string | null }

async function main() {
  const broken = await client.fetch<Doc[]>(`*[_type=="tour" && !(_id in path("drafts.**")) && _id match "wp-page-*" &&
    defined(body[_key=="en"][0].value) && !defined(body[_key=="es"][0].value)]{
    _id, "enSlug": slug[_key=="en"][0].value.current, "enTitle": title[_key=="en"][0].value,
    "esSlug": slug[_key=="es"][0].value.current, "city": cities[0]->slug[_key=="en"][0].value.current }`);
  const corpus = await client.fetch<Doc[]>(`*[_type=="tour" && !(_id in path("drafts.**")) && _id match "tour.*"]{
    _id, "enSlug": slug[_key=="en"][0].value.current, "enTitle": title[_key=="en"][0].value,
    "esSlug": slug[_key=="es"][0].value.current, "city": cities[0]->slug[_key=="en"][0].value.current }`);

  console.log(`broken (wp-page, EN-only): ${broken.length}   corpus (tour.*): ${corpus.length}\n`);

  const matched: Array<{ old: Doc; new: Doc; conf: string; score: number }> = [];
  const unmatched: Doc[] = [];
  const usedCorpus = new Map<string, string>(); // corpus _id -> old _id (detect collisions)

  for (const o of broken) {
    const os = toks(o.enSlug);
    const ot = toks(o.enTitle);
    let best: Doc | null = null;
    let bestScore = 0;
    let bestConf = 'low';
    for (const c of corpus) {
      const cs = toks(c.enSlug);
      const sameCity = o.city && c.city ? o.city === c.city : null;
      const slugOv = overlap(os, cs);
      const titleOv = overlap(ot, toks(c.enTitle));
      const score = slugOv * 0.7 + titleOv * 0.3 + (sameCity ? 0.1 : 0);
      let conf = 'low';
      if (subset(os, cs) && sameCity !== false) conf = 'high';
      else if (slugOv >= 0.5 && sameCity !== false) conf = 'medium';
      if (score > bestScore) { bestScore = score; best = c; bestConf = conf; }
    }
    if (best && bestConf !== 'low') {
      matched.push({ old: o, new: best, conf: bestConf, score: +bestScore.toFixed(2) });
      const prev = usedCorpus.get(best._id);
      if (prev) console.log(`  ⚠ corpus ${best._id} matched by multiple olds (${prev} + ${o._id})`);
      usedCorpus.set(best._id, o._id);
    } else {
      unmatched.push(o);
    }
  }

  const byConf = (k: string) => matched.filter((m) => m.conf === k);
  for (const k of ['high', 'medium']) {
    const rows = byConf(k);
    console.log(`\n===== ${k.toUpperCase()} confidence (${rows.length}) =====`);
    for (const m of rows.sort((a, b) => b.score - a.score)) {
      console.log(`[${m.score}] ${m.old.enSlug}\n      → ${m.new.enSlug}  (es:${m.new.esSlug})`);
    }
  }
  console.log(`\n===== UNMATCHED — keep & flag for translation (${unmatched.length}) =====`);
  for (const o of unmatched.sort((a, b) => a.enSlug.localeCompare(b.enSlug)))
    console.log(`  ${o.enSlug}  (es:${o.esSlug})  [${o._id}]`);

  // Emit machine-readable map for the write step.
  const out = {
    matched: matched.map((m) => ({ oldId: m.old._id, oldEsSlug: m.old.esSlug, oldEnSlug: m.old.enSlug, newId: m.new._id, newEsSlug: m.new.esSlug, newEnSlug: m.new.enSlug, conf: m.conf, score: m.score })),
    unmatched: unmatched.map((o) => ({ id: o._id, enSlug: o.enSlug, esSlug: o.esSlug })),
  };
  const fs = await import('node:fs');
  fs.writeFileSync('migration/tour-dupe-map.json', JSON.stringify(out, null, 2));
  console.log(`\nWrote migration/tour-dupe-map.json (matched=${matched.length}, unmatched=${unmatched.length})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
