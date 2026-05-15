#!/usr/bin/env node
/**
 * Session 23 — Tour entity field population census.
 * Read-only. Counts how many tour docs have each field populated.
 *
 * Output: migration/sessions/session-23/population.json (in worktree)
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
  })
);
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const PUB = `_type=="tour" && !(_id in path("drafts.**"))`;

// Per-kind population predicate.
function predicate(kind, field) {
  switch (kind) {
    case 'string':
    case 'number':
      return `defined(${field})`;
    case 'ref':
      return `defined(${field}._ref)`;
    case 'refArray':
    case 'objArray':
    case 'imageArray':
      return `defined(${field}) && count(${field}) > 0`;
    case 'i18nString':
    case 'i18nText':
      return `length(coalesce(${field}[_key=="en"].value, "")) > 0`;
    case 'i18nPT':
      return `length(coalesce(pt::text(${field}[_key=="en"][0].value), "")) > 0`;
    case 'i18nSlug':
      return `defined(${field}[_key=="en"][0].value.current)`;
    case 'i18nStringArr':
      return `defined(${field}) && count(${field}[value!=null && count(value)>0]) > 0`;
    case 'localizedImage':
      return `defined(${field}.asset) || defined(${field}[_key=="en"][0].value.asset)`;
    case 'obj':
      return `defined(${field})`;
    default:
      throw new Error(`unknown kind: ${kind}`);
  }
}

const fieldSpec = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'migration/sessions/session-23/_field-spec.json'), 'utf8')
);

const total = await client.fetch(`count(*[${PUB}])`);
const dayTours = await client.fetch(`count(*[${PUB} && type=="dayTour"])`);
const packages = await client.fetch(`count(*[${PUB} && type=="package"])`);

console.error(`Total tours: ${total} (dayTour=${dayTours}, package=${packages})`);

const out = {
  generated_at: new Date().toISOString(),
  totals: { all: total, dayTour: dayTours, package: packages },
  topLevel: [],
  tourDay: { tours_with_days: 0, total_days: 0, perField: [] },
};

// Top-level
for (const f of fieldSpec.topLevel) {
  let count;
  if (f.name === 'theme') {
    // package-only required, count over packages only
    count = await client.fetch(`count(*[${PUB} && type=="package" && ${predicate(f.kind, f.name)}])`);
    out.topLevel.push({ ...f, populationCount: count, denominator: packages, populationRate: +(count / packages * 100).toFixed(1), scope: 'package-only' });
  } else if (f.name === 'durationHours') {
    count = await client.fetch(`count(*[${PUB} && type=="dayTour" && ${predicate(f.kind, f.name)}])`);
    out.topLevel.push({ ...f, populationCount: count, denominator: dayTours, populationRate: +(count / dayTours * 100).toFixed(1), scope: 'dayTour-only' });
  } else {
    count = await client.fetch(`count(*[${PUB} && ${predicate(f.kind, f.name)}])`);
    out.topLevel.push({ ...f, populationCount: count, denominator: total, populationRate: +(count / total * 100).toFixed(1), scope: 'all' });
  }
  console.error(`  ${f.name.padEnd(28)} ${count}`);
}

// tourDay (nested in days[])
const dayStats = await client.fetch(
  `*[${PUB} && defined(days) && count(days) > 0]{
    "_id": _id,
    "totalDays": count(days)
  }`
);
out.tourDay.tours_with_days = dayStats.length;
out.tourDay.total_days = dayStats.reduce((s, d) => s + d.totalDays, 0);
console.error(`\nTours with days[]: ${out.tourDay.tours_with_days} (${out.tourDay.total_days} day objects total)`);

// Per sub-field on tourDay: project per-doc day-object count, then sum.
function dayPredicate(kind, sub) {
  switch (kind) {
    case 'number':       return `defined(${sub})`;
    case 'i18nString':   return `length(coalesce(${sub}[_key=="en"].value, "")) > 0`;
    case 'i18nPT':       return `length(coalesce(pt::text(${sub}[_key=="en"][0].value), "")) > 0`;
    case 'refArray':     return `defined(${sub}) && count(${sub}) > 0`;
    case 'i18nStringArr':return `defined(${sub}) && count(${sub}[value!=null && count(value)>0]) > 0`;
    default: throw new Error(`day kind: ${kind}`);
  }
}
for (const f of fieldSpec.tourDay) {
  const q = `*[${PUB} && defined(days)]{ "n": count(days[${dayPredicate(f.kind, f.name)}]) }.n`;
  const arr = await client.fetch(q);
  const count = arr.reduce((s, n) => s + (n || 0), 0);
  out.tourDay.perField.push({ ...f, populationCount: count, denominator: out.tourDay.total_days, populationRate: out.tourDay.total_days ? +(count / out.tourDay.total_days * 100).toFixed(1) : 0 });
  console.error(`  day.${f.name.padEnd(24)} ${count} / ${out.tourDay.total_days}`);
}

const OUT = path.join(ROOT, 'migration/sessions/session-23/population.json');
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.error(`\nWrote ${OUT}`);
