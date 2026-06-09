/**
 * Re-file all "from Australia" tours as GROUP packages under the new
 * "Australia & Oceania" origin region (migration-staging).
 *
 * Context (2026-06-07): operator added an "Australia & Oceania" origin region
 * (enum `australia-oceania`, added to tour.ts + tourLanding.ts). All Egypt
 * tours marketed "from Australia" should be small-group packages filed under
 * it. A group-tours landing already existed but with an orphan region value
 * `australia` — this aligns it to `australia-oceania` too.
 *
 * Actions:
 *   • Landing tourLanding.egypt-group-tours-from-australia → originRegion =
 *     'australia-oceania', title → "… Australia & Oceania" (slug unchanged).
 *   • Each Australia tour (published + draft): type='package',
 *     tourMode='group', originRegion='australia-oceania', unset `theme`
 *     (group packages classify by origin region, not theme).
 *
 * Leaves the `days` itinerary field untouched (separate pending decision).
 *
 * Usage:
 *   tsx scripts/refile-australia-group.ts            # dry-run (default)
 *   tsx scripts/refile-australia-group.ts --commit   # write
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const REQUIRED_DATASET = 'migration-staging';
const REGION = 'australia-oceania';
const LANDING_ID = 'tourLanding.egypt-group-tours-from-australia';
const COMMIT = process.argv.includes('--commit');

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.NEXT_PUBLIC_SANITY_STAGING_DATASET ?? REQUIRED_DATASET;
if (!projectId || !token) { console.error('Missing project id / write token'); process.exit(1); }
if (dataset !== REQUIRED_DATASET) { console.error(`Refusing: dataset=${dataset}`); process.exit(1); }

const client = createClient({ projectId, dataset, token, apiVersion: '2024-10-01', useCdn: false, perspective: 'raw' });

const LANDING_TITLE: Record<string, string> = {
  en: 'Egypt Group Tours from Australia & Oceania',
  es: 'Tours de Egipto en grupo desde Australia y Oceanía',
  ja: 'オーストラリア・オセアニア発 エジプト・グループツアー',
};

async function main() {
  console.log(`Dataset: ${dataset}   Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}\n`);

  // ── 1. Australia tours — explicit base IDs (deterministic), every published + draft instance.
  // Discovered via title/slug match (4 unique tours); pinned here so draft/published
  // instances with differing locale fields are all covered consistently.
  const BASE_IDS = ['wp-page-160182', 'wp-page-160197', 'wp-page-160209', 'wp-page-160357'];
  const allIds = BASE_IDS.flatMap((id) => [id, `drafts.${id}`]);
  const tours: Array<{ _id: string; type?: string; tourMode?: string; originRegion?: string; theme?: { _ref: string }; en?: string }> =
    await client.fetch(`*[_id in $ids]{ _id, type, tourMode, originRegion, theme, "en": slug[_key=='en'][0].value.current }`, { ids: allIds });

  console.log(`Australia tours (incl. drafts): ${tours.length}`);
  for (const t of tours) {
    console.log(`  ${t._id} · /${t.en}`);
    console.log(`     before: tourMode=${t.tourMode || '(none)'} originRegion=${t.originRegion || '(none)'} theme=${t.theme?._ref || '(none)'}`);
    console.log(`     after : tourMode=group originRegion=${REGION} theme=(unset)`);
  }

  // ── 2. Landing instances (published + draft) ──
  const landings: Array<{ _id: string; originRegion?: string }> = await client.fetch(
    `*[_id in [$p, $d]]{ _id, originRegion }`, { p: LANDING_ID, d: `drafts.${LANDING_ID}` }
  );
  console.log(`\nLanding instances: ${landings.length}`);
  for (const l of landings) console.log(`  ${l._id}: originRegion ${l.originRegion} → ${REGION}, title → "Australia & Oceania"`);

  if (!COMMIT) { console.log('\nDRY-RUN — no writes. Re-run with --commit.'); return; }

  const tx = client.transaction();
  for (const t of tours) {
    tx.patch(t._id, (p) =>
      p.set({ type: 'package', tourMode: 'group', originRegion: REGION }).unset(['theme'])
    );
  }
  for (const l of landings) {
    const titleArr = Object.entries(LANDING_TITLE).map(([loc, value]) => ({
      _key: loc, _type: 'internationalizedArrayStringValue', value,
    }));
    tx.patch(l._id, (p) => p.set({ originRegion: REGION, title: titleArr }));
  }
  await tx.commit();
  console.log(`\n✓ Re-filed ${tours.length} tour instance(s) + ${landings.length} landing instance(s) under "${REGION}".`);
}

main().catch((e) => { console.error('\nFAILED:', e); process.exit(1); });
