#!/usr/bin/env node
/**
 * Localization completeness audit (READ-ONLY).
 *
 * For every document type, introspects which top-level fields are
 * internationalized-array fields (arrays of { _key, value } with locale keys),
 * then reports es/ja population vs en across published docs. Also flags
 * portable-text body localized arrays.
 *
 * Output: reports/localization-gaps.data.json  (machine-readable inventory)
 * No mutations.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// load .env
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: env.SANITY_STAGING_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: 'published',
});

const LOCALES = ['en', 'es', 'ja'];

const isIntlArray = (v) =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every(
    (e) => e && typeof e === 'object' && typeof e._key === 'string' && 'value' in e
  ) &&
  v.some((e) => LOCALES.includes(e._key));

// detect a localized field's populated locales (non-empty value)
const populatedLocales = (v) => {
  const out = new Set();
  for (const e of v) {
    if (!LOCALES.includes(e._key)) continue;
    const val = e.value;
    const nonEmpty =
      (typeof val === 'string' && val.trim().length > 0) ||
      (Array.isArray(val) && val.length > 0) ||
      (val && typeof val === 'object' && val.current); // slug
    if (nonEmpty) out.add(e._key);
  }
  return out;
};

async function main() {
  // all published doc types + counts
  const types = await client.fetch(
    `*[!(_id in path("drafts.**")) && _type != "sanity.imageAsset" && _type != "sanity.fileAsset"]{_type} | {"t": _type}`
  );
  const typeCounts = {};
  for (const { t } of types) typeCounts[t] = (typeCounts[t] || 0) + 1;

  const report = {};

  for (const type of Object.keys(typeCounts).sort()) {
    // pull all docs of type (published only)
    const docs = await client.fetch(
      `*[_type==$type && !(_id in path("drafts.**"))]`,
      { type }
    );
    if (!docs.length) continue;

    // discover intl-array fields across the sample
    const fieldStats = {}; // field -> {en,es,ja, enOnly:[ids]}
    for (const doc of docs) {
      for (const [k, v] of Object.entries(doc)) {
        if (!isIntlArray(v)) continue;
        const pop = populatedLocales(v);
        if (!fieldStats[k])
          fieldStats[k] = { en: 0, es: 0, ja: 0, enButNoEs: [], enButNoJa: [] };
        for (const loc of pop) fieldStats[k][loc]++;
        if (pop.has('en') && !pop.has('es'))
          fieldStats[k].enButNoEs.push(doc.slug?.current || doc._id);
        if (pop.has('en') && !pop.has('ja'))
          fieldStats[k].enButNoJa.push(doc.slug?.current || doc._id);
      }
    }
    // only report fields that exist as intl arrays
    const fields = Object.keys(fieldStats);
    if (!fields.length) continue;
    report[type] = { count: docs.length, fields: fieldStats };
  }

  const outPath = path.join(ROOT, 'reports/localization-gaps.data.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  // console summary
  for (const [type, { count, fields }] of Object.entries(report)) {
    console.log(`\n### ${type}  (${count} docs)`);
    for (const [f, s] of Object.entries(fields)) {
      const gapEs = s.en - s.es;
      const gapJa = s.en - s.ja;
      if (gapEs === 0 && gapJa === 0 && s.es === count && s.ja === count) continue;
      console.log(
        `  ${f}: en=${s.en} es=${s.es} ja=${s.ja}  | gapES=${gapEs} gapJA=${gapJa}`
      );
    }
  }
  console.log(`\n[written] ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
