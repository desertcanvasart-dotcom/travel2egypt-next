/**
 * Replace the operating-entity name on the 4 legal pages (migration-staging).
 *
 * Per request: remove "Travel2Egypt Limited HK" (keep the brand "Travel2Egypt")
 * and name the owner/operator as "International San Tours", with address
 * 92 Ahmed Orabe St., Mohandeseen, Giza, Egypt. The old Cairo/Moqattam address
 * in Terms is replaced too.
 *
 * Legal bodies are English-only (body[_key=="en"]). All affected blocks are
 * single plain spans (verified), so edits are precise and mark-safe.
 *
 * Usage: --dry-run | --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const ENTITY = 'Travel2Egypt Limited HK';
const COMPANY = 'International San Tours';
const ADDRESS = 'International San Tours, 92 Ahmed Orabe St., Mohandeseen, Giza, Egypt';

// Blocks whose ENTIRE text becomes the company+address (standalone contact /
// registered-address lines), keyed by doc id → set of block _keys.
const ADDRESS_BLOCKS: Record<string, Set<string>> = {
  'legal-cookie-policy': new Set(['a2a84dcf2883']),
  'legal-terms': new Set(['e44bf3e12642']),
};

const LEGAL_IDS = ['legal-cookie-policy', 'legal-disclaimer', 'legal-privacy-policy', 'legal-terms'];

interface Span { _type: string; text?: string; marks?: string[] }
interface Block { _key: string; _type: string; style?: string; children?: Span[] }
interface LE<T> { _key: string; value: T }

function parseArgs(argv: string[]) {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) { if (a === '--commit') commit = true; else if (a === '--dry-run') dryRun = true; else { process.stderr.write(`Unknown arg: ${a}\n`); process.exit(2); } }
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }
  return { commit };
}
function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against ${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

async function main() {
  const { commit } = parseArgs(process.argv);
  console.log(`\n=== Legal entity rename ===\nmode: ${commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();
  let tx = client.transaction();
  let ops = 0, changedBlocks = 0;

  for (const id of LEGAL_IDS) {
    const doc = await client.fetch<{ body?: LE<Block[]>[] } | null>(`*[_id==$id][0]{ body }`, { id });
    const en = doc?.body?.find((e) => e._key === 'en');
    if (!en || !Array.isArray(en.value)) { console.log(`  ✗ ${id}: no en body`); continue; }
    const addrKeys = ADDRESS_BLOCKS[id];
    let docChanged = false;

    for (const block of en.value) {
      if (block._type !== 'block' || !Array.isArray(block.children)) continue;
      if (addrKeys?.has(block._key)) {
        const before = block.children.map((s) => s.text ?? '').join('');
        block.children = [{ _type: 'span', text: ADDRESS, marks: [] }];
        console.log(`  ✓ ${id} [${block._key}] address →\n      "${before}"\n      "${ADDRESS}"`);
        docChanged = true; changedBlocks++;
        continue;
      }
      for (const sp of block.children) {
        if (typeof sp.text === 'string' && sp.text.includes(ENTITY)) {
          const before = sp.text;
          sp.text = sp.text.split(ENTITY).join(COMPANY);
          console.log(`  ✓ ${id} [${block._key}] "${ENTITY}" → "${COMPANY}"`);
          console.log(`      ${before.slice(0, 110)}…`);
          docChanged = true; changedBlocks++;
        }
      }
    }

    if (docChanged && commit) { tx = tx.patch(id, (p) => p.set({ body: doc!.body })); ops++; }
  }

  if (commit && ops > 0) { await tx.commit({ visibility: 'sync' }); console.log(`\n✓ Committed ${ops} doc patches (${changedBlocks} blocks).`); }
  else console.log(`\n${commit ? 'Nothing to do.' : `Dry-run — ${changedBlocks} blocks would change.`}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
