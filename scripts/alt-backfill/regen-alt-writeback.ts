/**
 * Write regenerated EN/ES/JA alt + caption onto blog (article) hero images.
 * article heroImage.alt / heroImage.caption are PLAIN strings on the
 * language-specific doc. Fans one gen-set across the EN/ES/JA group.
 *
 *   npx tsx scripts/alt-backfill/regen-alt-writeback.ts <map.json> <gen.json>          # dry-run
 *   npx tsx scripts/alt-backfill/regen-alt-writeback.ts <map.json> <gen.json> --apply  # patch published docs
 *
 * gen.json: array of { file, alt_en, cap_en, alt_es, cap_es, alt_ja, cap_ja }.
 * Patches the PUBLISHED doc of each group member with its language's alt+caption.
 * Rollback snapshot written to backups/blog-hero-alt-regen-rollback.json.
 */
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';

const env: Record<string, string> = {};
for (const line of readFileSync('/Users/islamhussein/t2e/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: env.SANITY_PRODUCTION_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const mapPath = process.argv[2];
const genPath = process.argv[3];
const APPLY = process.argv.includes('--apply');
if (!mapPath || !genPath) { console.error('usage: regen-alt-writeback.ts <map.json> <gen.json> [--apply]'); process.exit(1); }

type Doc = { id: string; language: string; slug: string };
type MapEntry = { file: string; enSlug: string; docs: Doc[] };
type Gen = { file: string; alt_en: string; cap_en: string; alt_es: string; cap_es: string; alt_ja: string; cap_ja: string };

const map: MapEntry[] = JSON.parse(readFileSync(mapPath, 'utf8'));
const gen: Gen[] = JSON.parse(readFileSync(genPath, 'utf8'));
const byFile = new Map(map.map((m) => [m.file, m]));

const altOf = (g: Gen, lang: string) => (lang === 'es' ? g.alt_es : lang === 'ja' ? g.alt_ja : g.alt_en);
const capOf = (g: Gen, lang: string) => (lang === 'es' ? g.cap_es : lang === 'ja' ? g.cap_ja : g.cap_en);

async function main() {
  const missing = gen.filter((g) => !byFile.has(g.file));
  if (missing.length) { console.log('WARN: gen files not in map:', missing.map((m) => m.file)); }
  const targets: { id: string; alt: string; cap: string }[] = [];
  for (const g of gen) {
    const m = byFile.get(g.file);
    if (!m) continue;
    for (const d of m.docs) {
      const alt = altOf(g, d.language);
      const cap = capOf(g, d.language);
      if (!alt) { console.log(`WARN: no ${d.language} alt for ${g.file}`); continue; }
      targets.push({ id: d.id, alt, cap });
    }
  }
  console.log(`gen entries: ${gen.length} | doc patches queued: ${targets.length}`);
  if (!APPLY) { console.log('DRY RUN — pass --apply to write. No changes made.'); console.log('sample:', JSON.stringify(targets.slice(0, 3), null, 2)); return; }

  const ids = targets.map((t) => t.id);
  const snap = await client.fetch(`*[_id in $ids]{_id, "alt":heroImage.alt, "caption":heroImage.caption}`, { ids });
  writeFileSync('/Users/islamhussein/t2e/backups/blog-hero-alt-regen-rollback.json', JSON.stringify(snap, null, 2));
  console.log(`rollback snapshot for ${snap.length} docs written.`);

  let ok = 0, err = 0; const errors: string[] = [];
  for (const t of targets) {
    try {
      const p = client.patch(t.id).set({ 'heroImage.alt': t.alt });
      if (t.cap && t.cap.trim()) p.set({ 'heroImage.caption': t.cap });
      await p.commit();
      ok++;
    } catch (e: any) { err++; errors.push(`${t.id}: ${e.message}`); }
  }
  console.log(`APPLIED. patches ok: ${ok}, errored: ${err}`);
  for (const e of errors.slice(0, 15)) console.log('  ERR', e);
}
main().catch((e) => { console.error(e); process.exit(1); });
