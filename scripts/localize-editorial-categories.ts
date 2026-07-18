/**
 * Add ES + JA `name` translations to the 19 legacy WordPress-imported
 * editorialCategory leaves (they only ever had an English name, so the JA/ES
 * journal showed English category chips). Names only — leaf category slugs stay
 * shared-English by design, so no slug/redirect changes. Founder-approved
 * 2026-07-19. Sets the whole `name` array (en+es+ja) to avoid array-merge
 * pitfalls; backs up the prior names first.
 *
 *   npx tsx scripts/localize-editorial-categories.ts --dry-run
 *   npx tsx scripts/localize-editorial-categories.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
function die(m: string): never { process.stderr.write(`error: ${m}\n`); process.exit(2); }
const commit = process.argv.includes('--commit');
if (!commit && !process.argv.includes('--dry-run')) die('pass --dry-run or --commit');

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'production') die('production only');
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) die('missing projectId/token');
  return createClient({ projectId, dataset, apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

// id → [en (existing, for verification), es, ja]
const T: Record<string, [string, string, string]> = {
  'wp-category-381': ['Adventure', 'Aventura', 'アドベンチャー'],
  'wp-category-355': ['Coptic Monuments', 'Monumentos coptos', 'コプトの史跡'],
  'wp-category-19': ['Creative', 'Creatividad', 'クリエイティブ'],
  'wp-category-77': ['Culture', 'Cultura', '文化'],
  'wp-category-693': ['Food', 'Gastronomía', 'グルメ'],
  'wp-category-72': ['History', 'Historia', '歴史'],
  'wp-category-1': ['Hotels', 'Hoteles', 'ホテル'],
  'wp-category-354': ['Islamic Monuments', 'Monumentos islámicos', 'イスラムの史跡'],
  'wp-category-20': ['Lifestyle', 'Estilo de vida', 'ライフスタイル'],
  'wp-category-76': ['Luxury Stay', 'Estancias de lujo', 'ラグジュアリーステイ'],
  'wp-category-360': ['Nile Cruise', 'Cruceros por el Nilo', 'ナイルクルーズ'],
  'wp-category-356': ['Pharaoh Monuments', 'Monumentos faraónicos', 'ファラオの史跡'],
  'wp-category-73': ['Places in Egypt', 'Lugares de Egipto', 'エジプトの見どころ'],
  'wp-category-75': ['Things to Do', 'Qué hacer', 'アクティビティ'],
  'wp-category-74': ['Tours', 'Circuitos', 'ツアー'],
  'wp-category-647': ['Wellness', 'Bienestar', 'ウェルネス'],
  'wp-category-94': ['Egypt Travel Guide', 'Guía de viaje a Egipto', 'エジプト旅行ガイド'],
  'wp-category-78': ['Safety', 'Seguridad', '安全'],
  'wp-category-21': ['Tips & Tricks', 'Consejos y trucos', '旅のコツ'],
};

async function main() {
  const client = getClient();
  const ids = Object.keys(T);
  const current = await client.fetch<Array<{ _id: string; name: any[] }>>(
    `*[_type=="editorialCategory" && _id in $ids]{_id, name}`, { ids }
  );
  const byId = new Map(current.map((c) => [c._id, c]));

  // Verify each target exists and its EN name matches what we translated from.
  const problems: string[] = [];
  for (const [id, [en]] of Object.entries(T)) {
    const doc = byId.get(id);
    if (!doc) { problems.push(`${id}: NOT FOUND`); continue; }
    const enNow = doc.name?.find((n: any) => n._key === 'en')?.value;
    if (enNow !== en) problems.push(`${id}: EN mismatch — expected "${en}", got "${enNow}"`);
  }
  console.log(`\n=== localize editorial categories ===  mode: ${commit ? 'COMMIT' : 'dry-run'}`);
  console.log(`targets: ${ids.length} | found: ${current.length}`);
  if (problems.length) { console.log('\n⚠ PROBLEMS:'); problems.forEach((p) => console.log('   ' + p)); die('aborting — resolve mismatches first'); }
  for (const [id, [en, es, ja]] of Object.entries(T)) console.log(`   ${en}  →  ${es}  /  ${ja}`);

  writeFileSync(resolve(process.cwd(), 'migration/editorial-category-i18n-backup.json'),
    JSON.stringify({ appliedAt: '2026-07-19', priorNames: current }, null, 2), 'utf8');

  if (!commit) { console.log(`\nDry-run complete. Backup of prior names written. --commit sets es+ja names.`); return; }

  let tx = client.transaction();
  for (const [id, [en, es, ja]] of Object.entries(T)) {
    tx = tx.patch(id, (p) => p.set({ name: [
      { _key: 'en', value: en }, { _key: 'es', value: es }, { _key: 'ja', value: ja },
    ] }));
  }
  await tx.commit({ visibility: 'async' });
  console.log(`\nApplied es+ja names to ${ids.length} categories.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
