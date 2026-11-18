/**
 * Undo retire-alexandria-in-a-day-2026-11-18.mjs (owner, 18 Nov: "Yes, undo it"). The
 * owner's copy for /private-tour-2-day-trip-to-alexandria-from-cairo turned out to be a
 * real 2-day trip that keeps its URL, so the page is not a duplicate after all:
 *   - wp-page-87976 shown again: hidden and the migration superseded-* flags removed
 *     (they were unset before the retire, per its rollback file)
 *   - the 10 in-text links moved to wp-page-88427 point at wp-page-87976 again (same
 *     paths, from the retire's rollback files)
 * The redirect-map rows are undone in the same commit.
 *
 *   node --env-file=<.env> scripts/day-tour-format/undo-alexandria-in-a-day-retire-2026-11-18.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/undo-alexandria-in-a-day-retire-2026-11-18.mjs --apply
 */
import { createClient } from '@sanity/client';
import { readFileSync, readdirSync } from 'node:fs';
import { writeRollback } from '../lib/content-gates.mjs';

const PAGE = 'wp-page-87976';
const KEEPER = 'wp-page-88427';
const STAMP = 'before-retire-alexandria-in-a-day.2026-11-18T14-20-17-049Z';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const dir = new URL('../../migration/rollback/', import.meta.url);

const before = JSON.parse(readFileSync(new URL(`${PAGE}.${STAMP}.json`, dir), 'utf8'));
if (before.hidden || before.migration?.supersededBy) throw new Error('the page was already hidden before the retire: stop');
const page = await client.getDocument(PAGE);
if (page.migration?.supersededBy !== KEEPER) throw new Error(`${PAGE} is not superseded by ${KEEPER}: nothing to undo`);

// The links: every reference to the old page in the rollback copies, by path.
const walk = (o, path, out) => {
  if (!o || typeof o !== 'object') return out;
  if (o._ref === PAGE) out.push(path);
  for (const [k, v] of Object.entries(o)) walk(v, path + (Array.isArray(o) ? (v?._key ? `[_key=="${v._key}"]` : `[${k}]`) : (path ? `.${k}` : k)), out);
  return out;
};
const plan = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith(`.${STAMP}.json`) && !x.startsWith(`${PAGE}.`))) {
  const id = f.slice(0, -(`.${STAMP}.json`.length));
  const old = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
  const now = await client.getDocument(id);
  for (const p of walk(old, '', [])) {
    const cur = p.split(/\.(?![^\[]*\])/).reduce((o, seg) => {
      if (!o) return o;
      const m = seg.match(/^([^\[]+)?((\[_key=="[^"]+"\])*)$/);
      let x = m[1] ? o[m[1]] : o;
      for (const k of [...(m[2] ?? '').matchAll(/_key=="([^"]+)"/g)].map((y) => y[1])) x = Array.isArray(x) ? x.find((e) => e._key === k) : undefined;
      return x;
    }, now);
    if (cur?._ref !== KEEPER) throw new Error(`${id} ${p}: expected a link to ${KEEPER}, found ${cur?._ref}`);
    plan.push({ id, path: p });
  }
}
console.log(`${PAGE}: hidden ${page.hidden} → unset; migration.reviewFlag/supersededBy/supersededAt → unset`);
for (const x of plan) console.log(`  link ${x.id} ${x.path}: ${KEEPER} → ${PAGE}`);
if (plan.length !== 10) throw new Error(`expected 10 links, found ${plan.length}`);

if (apply) {
  await writeRollback(client, [PAGE, ...new Set(plan.map((x) => x.id))], 'before-undo-alexandria-in-a-day');
  const tx = client.transaction();
  tx.patch(PAGE, (q) => q.unset(['hidden', 'migration.reviewFlag', 'migration.supersededBy', 'migration.supersededAt']));
  for (const x of plan) tx.patch(x.id, (q) => q.set({ [`${x.path}._ref`]: PAGE }));
  await tx.commit();
  console.log(`APPLIED: ${PAGE} shown again; ${plan.length} links restored`);
} else console.log('dry run (pass --apply to write production)');
