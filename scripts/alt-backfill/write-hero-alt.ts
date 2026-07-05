/**
 * Write generated hero alt+captions to PUBLISHED docs — fills ONLY the
 * missing locales recorded in the worklist; existing values untouched.
 * Dry-run by default; APPLY=1 to write. Rollback snapshot saved first.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

loadEnv();
const APPLY = process.env.APPLY === '1';
const S = process.env.ALT_DIR!;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: APPLY ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN : process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
  const worklist = JSON.parse(readFileSync(`${S}/alt-worklist.json`, 'utf8'));
  const gen: Record<string, any> = {};
  for (let i = 0; i < 6; i++) {
    const p = `${S}/alt-gen-${i}.json`;
    if (!existsSync(p)) { console.error(`missing ${p} — agents not done`); process.exit(1); }
    for (const g of JSON.parse(readFileSync(p, 'utf8'))) gen[g.ref] = g;
  }
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — ${Object.keys(gen).length} generated image sets, ${worklist.length} docs`);

  const rollback: any[] = [];
  let patched = 0, noGen = 0, badLen = 0;
  for (const w of worklist) {
    const g = gen[w.ref];
    if (!g) { noGen++; console.log('  NO-GEN', w.id, w.ref); continue; }
    for (const l of ['en', 'es', 'ja']) if ((g['alt_' + l] ?? '').length > 160) badLen++;
    const doc = await client.getDocument(w.id);
    if (!doc?.heroImage) { console.log('  NO-HERO', w.id); continue; }
    const merge = (arr: any[] | undefined, field: 'alt' | 'cap', missing: string[]) => {
      const out = Array.isArray(arr) ? [...arr] : [];
      for (const l of missing) {
        const value = g[`${field}_${l}`];
        if (!value) continue;
        const i = out.findIndex((e) => e._key === l);
        if (i > -1 && out[i]?.value) continue; // never overwrite
        const item = { _key: l, _type: 'object', value };
        if (i > -1) out[i] = item; else out.push(item);
      }
      return out;
    };
    const newAlt = merge(doc.heroImage.alt, 'alt', w.missAlt);
    const newCap = merge(doc.heroImage.caption, 'cap', w.missCap);
    if (APPLY) {
      rollback.push({ id: w.id, prevAlt: doc.heroImage.alt ?? null, prevCaption: doc.heroImage.caption ?? null });
      await client.patch(w.id).set({ 'heroImage.alt': newAlt, 'heroImage.caption': newCap }).commit();
    }
    patched++;
  }
  if (APPLY) writeFileSync('backups/alt-writeback-rollback-2026-07-05.json', JSON.stringify(rollback, null, 1));
  console.log(`${APPLY ? 'patched' : 'would patch'}: ${patched} docs | no generation: ${noGen} | alt >160 chars: ${badLen}`);
  if (APPLY) console.log('rollback: backups/alt-writeback-rollback-2026-07-05.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
