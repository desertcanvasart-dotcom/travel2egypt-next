#!/usr/bin/env node
/**
 * Strip the legacy day-by-day itinerary (`days[]`) from PRIVATE packages, to match
 * the methodology (private packages describe the days in prose, no structured grid).
 * Only touches type=="package" && tourMode=="private" with a populated days[].
 * Group packages (which keep their day grid by methodology) are NOT touched.
 *
 * Plan-only by default. Pass --commit to write (unset days). Additive-safe otherwise:
 * removes ONLY the days field; title/summary/body/everything else untouched.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
const COMMIT = process.argv.includes('--commit');
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const c = createClient({ projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2024-12-01', token: env.SANITY_STAGING_API_WRITE_TOKEN, useCdn: false });

// Require an EN body — stripping days[] from a body-less doc would empty the page.
const docs = await c.fetch(`*[_type=="tour" && type=="package" && tourMode=="private" && !(_id in path("drafts.**")) && count(days)>0 && defined(body[_key=="en"][0].value)]{
  _id, "slug":slug[_key=="en"][0].value.current, "en":title[_key=="en"][0].value, "nDays":count(days)
} | order(slug)`);

console.log(`PRIVATE packages with a days[] grid to strip: ${docs.length}\n`);
docs.forEach((d) => console.log(`  ${String(d.nDays).padStart(2)}d  ${d.slug}  —  ${(d.en || '').slice(0, 50)}`));

// safety: confirm we are NOT touching group packages
const groupWithDays = await c.fetch(`count(*[_type=="tour" && type=="package" && tourMode=="group" && !(_id in path("drafts.**")) && count(days)>0])`);
console.log(`\n(group packages with days[] — left untouched: ${groupWithDays})`);

if (!COMMIT) { console.log('\n[PLAN ONLY] no writes. Re-run with --commit to unset days[] on the above.'); process.exit(0); }

const BATCH = 25; let done = 0;
for (let i = 0; i < docs.length; i += BATCH) {
  let tx = c.transaction();
  for (const d of docs.slice(i, i + BATCH)) tx = tx.patch(d._id, (p) => p.unset(['days']));
  await tx.commit({ visibility: 'sync' });
  done += docs.slice(i, i + BATCH).length;
  console.log(`  committed ${done}/${docs.length}`);
}
console.log(`\n[DONE] stripped days[] from ${done} private packages.`);
