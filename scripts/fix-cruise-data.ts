/**
 * Apply the Nile-cruise content corrections from
 * "All 3 langs/Nile Cruises/Nile Cruises - Edits".
 *
 * PHASE 1 — structured leaf fields only (capacity / tier / type).
 * These drive the "Type · Tier · N cabins" label and the side info box.
 * Body/title/SEO text edits are handled by fix-cruise-body.ts.
 *
 * Leaf .set() is safe vs the MCP _key-regeneration pitfall. For each target
 * we patch the published doc AND its draft (if one exists) so the fix is not
 * reverted when an outstanding draft is later published.
 *
 * migration-staging only. Dry-run by default; pass --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

type Leaf = { capacity?: number; tier?: string; type?: string; note?: string };

// Keyed by published _id. Numbers/tiers/types are the verified values from the
// edit specs (tiers inferred from vessel class per the agreed policy).
const EDITS: Record<string, Leaf> = {
  // ── definitive capacity corrections ───────────────────────────
  'wp-page-83686': { capacity: 10 }, // Agatha (12→10)
  'wp-page-64216': { capacity: 65 }, // Kasr Ibrim (44→65)
  'wp-page-64341': { capacity: 74 }, // Steigenberger Legacy (45→74)
  'wp-page-64268': { capacity: 77 }, // Steigenberger Minerva (45→77)
  'wp-page-64259': { capacity: 80 }, // Omar El Khayam (46→80)
  'wp-page-64312': { capacity: 52 }, // Darakum (50→52)
  'wp-page-64295': { capacity: 72 }, // Hamees (45→72)
  'wp-page-64322': { capacity: 62 }, // Royal Lotus (44→62)
  'wp-page-64228': { capacity: 65 }, // Prince Abbas (42→65)
  'wp-page-64450': { capacity: 4 },  // SB Feddya (10→4 suites)
  'wp-page-64250': { capacity: 27 }, // Oberoi Zahra (38→27)
  'wp-page-64426': { capacity: 33 }, // Sonesta Star Goddess (34→33 suites)
  'wp-page-64278': { capacity: 70 }, // Al-Jamila (48→70) + body
  'wp-page-64459': { capacity: 70 }, // Al Kahila (32→70) + body
  'wp-page-64104': { capacity: 62 }, // Amwaj Livingstone (49→62) + body
  'wp-page-64441': { capacity: 73 }, // Nubian Sea — KEPT page (48→73)

  // ── Alexander the Great: motor yacht, 30 suites ───────────────
  'wp-page-64354': { capacity: 30, type: 'yacht' }, // (28→30, cruise-ship→yacht)

  // ── "confirm" group — best-estimate per agreed policy ─────────
  'nileCruise.amawaterways-amadahlia-nile-cruise': { capacity: 34, tier: 'luxury' }, // databases 34/68 + body
  'wp-page-65210': { capacity: 74 }, // Mayfair (~74 operator deck plan)
  'wp-page-65203': { capacity: 54 }, // MayFlower (~54-56 → 54)
  'wp-page-64331': { capacity: 64 }, // Sun Ray (62-66 → 64) + body
  'wp-page-64294': { capacity: 67 }, // Esplanade (67-90+ → 67, conservative)
  'wp-page-65273': { capacity: 8, note: 'operator 8 rooms; article still says 3 rooms — needs reconciliation' }, // Assouan
  'wp-page-64053': { capacity: 72 }, // Swiss Inn Radamis II (operator 72) + body
  'wp-page-64176': { capacity: 7 },  // Sonesta Amirat (original boat = 7)

  // ── capacity fills (null → value) + inferred tier ─────────────
  'nileCruise.amawaterways-amalilia-nile-cruise': { capacity: 41, tier: 'luxury' },
  'nileCruise.eyaru-dahabiya': { capacity: 8, tier: 'luxury' },
  'nileCruise.la-flaneuse-du-nil-dahabiya': { capacity: 7, tier: 'luxury' },
  'nileCruise.lazuli-dahabiya': { capacity: 10, tier: 'luxury' },
  'wp-page-64289': { capacity: 57, tier: 'deluxe' }, // Sonesta St. George
  'wp-page-64203': { capacity: 10, tier: 'luxury' }, // Malouka (Nour El Nil)
  'nileCruise.ms-eugenie-lake-nasser-cruise': { capacity: 54, tier: 'luxury' },
  'nileCruise.nour-el-nil-dahabiya': { capacity: 10, tier: 'luxury' }, // El Nil
  'wp-page-64190': { capacity: 10, tier: 'luxury' }, // Meroe (Nour El Nil)
  'nileCruise.oberoi-philae-nile-cruise': { capacity: 22, tier: 'luxury' },
  'nileCruise.sanctuary-nile-adventurer': { capacity: 32, tier: 'luxury' },
  'nileCruise.sanctuary-nile-seray': { capacity: 32, tier: 'luxury' },
  'nileCruise.sanctuary-sun-boat-iii': { capacity: 18, tier: 'luxury' },
  'nileCruise.sanctuary-sun-boat-iv': { capacity: 40, tier: 'luxury' },
  'nileCruise.sanctuary-zein-nile-chateau': { capacity: 6, tier: 'luxury', type: 'dahabiya' },
  'nileCruise.steam-ship-sudan-nile-cruise': { capacity: 24, tier: 'luxury' },
  'nileCruise.uniworld-river-tosca-nile-cruise': { capacity: 41, tier: 'luxury' },
  'wp-page-64129': { capacity: 53, tier: 'deluxe' }, // Nile Goddess (Sonesta)
  'nileCruise.viking-aton-nile-cruise': { capacity: 41, tier: 'luxury' }, // + body typo
  'nileCruise.viking-osiris-nile-cruise': { capacity: 41, tier: 'luxury' },
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

async function main() {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }

  const ids = Object.keys(EDITS);
  const draftIds = ids.map((id) => `drafts.${id}`);
  // Which drafts actually exist?
  const existingDrafts: string[] = await client.fetch(
    `*[_id in $d]._id`,
    { d: draftIds }
  );
  // Current values for reporting.
  const current: Record<string, any> = {};
  for (const row of await client.fetch(
    `*[_id in $ids]{_id, "en": name[_key=="en"].value, type, tier, capacity}`,
    { ids }
  )) current[row._id] = row;

  let writes = 0;
  for (const id of ids) {
    const edit = EDITS[id];
    const cur = current[id] || {};
    const name = Array.isArray(cur.en) ? cur.en[0] : cur.en;
    const set: Leaf = {};
    if (edit.capacity !== undefined) set.capacity = edit.capacity;
    if (edit.tier !== undefined) set.tier = edit.tier;
    if (edit.type !== undefined) set.type = edit.type;

    const parts: string[] = [];
    if (edit.capacity !== undefined) parts.push(`capacity ${cur.capacity ?? '∅'}→${edit.capacity}`);
    if (edit.tier !== undefined) parts.push(`tier ${cur.tier ?? '∅'}→${edit.tier}`);
    if (edit.type !== undefined) parts.push(`type ${cur.type ?? '∅'}→${edit.type}`);
    const targets = [id, ...(existingDrafts.includes(`drafts.${id}`) ? [`drafts.${id}`] : [])];
    console.log(`• ${name || id}\n    ${parts.join(', ')}${targets.length > 1 ? '  [+draft]' : ''}${edit.note ? `\n    ⚠ ${edit.note}` : ''}`);

    if (commit) {
      for (const t of targets) {
        await client.patch(t).set(set).commit({ visibility: 'async' });
        writes++;
      }
    }
  }

  console.log(`\n${ids.length} docs, ${existingDrafts.length} with drafts.`);
  if (commit) console.log(`  WRITTEN (${writes} patches).`);
  else console.log('  DRY RUN. Re-run with --commit to apply.');
}

main().catch((e) => { console.error(e); process.exit(1); });
