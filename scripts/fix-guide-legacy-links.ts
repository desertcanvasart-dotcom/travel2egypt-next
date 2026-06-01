/**
 * Workstream #6 — fix leaked legacy artefacts on LIVE guide pages
 * (migration-staging). Two concrete things:
 *
 *  1. Remove the raw "<!DOCTYPE html>" body block on the Beni Suef ticket page.
 *  2. Rewrite legacy travel2egypt.org cross-reference/"Explore Other Cities"
 *     hrefs (in externalLink markDefs) to internal /guide paths, so live pages
 *     stop linking out to the dead old site. Pure href string rewrite — span
 *     marks and _keys are untouched.
 *
 * Only touches PUBLISHED, NON-HIDDEN guideArticle + city docs (the visible
 * surface). Hidden legacy duplicates and tour/package pages are out of scope.
 * Idempotent. Usage: --dry-run | --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

// Legacy href substring → internal replacement. Order matters (first match wins).
const HREF_REWRITES: Array<{ match: string; to: string }> = [
  // Qena Dendera sibling cross-references (old top-level slugs → new /guide/qena).
  { match: 'travel2egypt.org/hypostyle-ceiling', to: '/guide/qena/hypostyle-hall-and-ceiling' },
  { match: 'travel2egypt.org/dendera-zodiac-osiris-chapels', to: '/guide/qena/dendera-zodiac-and-the-osiris-chapels' },
  // Ticket-page "Explore Other Cities" → internal where a new page exists,
  // else the /guide landing (old regional groupings have no 1:1 new page).
  { match: 'ticket-prices-for-attractions-in-alexandria', to: '/guide/alexandria/ticket-prices-for-attractions-in-alexandria' },
  { match: 'ticket-prices-for-attractions-in-al-minya', to: '/guide/al-minya/ticket-prices-for-attractions-in-al-minya-asyut' },
  { match: 'ticket-prices-for-attractions-in-al-sharqia', to: '/guide' },
  { match: 'ticket-prices-for-attractions-in-western-desert', to: '/guide' },
  { match: 'ticket-prices-for-attractions-in-red-sea-sinai', to: '/guide' },
];

interface MarkDef { _key: string; _type: string; href?: string }
interface Block { _key: string; _type: string; style?: string; children?: Array<{ _type: string; text?: string }>; markDefs?: MarkDef[] }
interface LE<T> { _key: string; value: T }

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) { if (a === '--commit') commit = true; else if (a === '--dry-run') dryRun = true; else { process.stderr.write(`Unknown arg: ${a}\n`); process.exit(2); } }
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }
  return { commit, dryRun };
}
function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against ${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

function rewriteHref(href: string): string | null {
  for (const r of HREF_REWRITES) if (href.includes(r.match)) return r.to;
  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Legacy-link + DOCTYPE cleanup ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const docs: Array<{ _id: string; _type: string; field: 'body' | 'overview'; val: LE<Block[]>[] }> = [];
  for (const t of ['guideArticle', 'city'] as const) {
    const field = t === 'city' ? 'overview' : 'body';
    const rows = await client.fetch<Array<{ _id: string; val?: LE<Block[]>[] }>>(
      `*[_type==$t && !(_id in path("drafts.**")) && hidden != true]{ _id, "val": ${field} }`, { t });
    for (const r of rows) if (Array.isArray(r.val)) docs.push({ _id: r._id, _type: t, field, val: r.val });
  }
  console.log(`Scanning ${docs.length} live docs…\n`);

  let rewrites = 0, doctypeRemoved = 0, docsChanged = 0;
  let tx = client.transaction();
  let ops = 0;

  for (const d of docs) {
    let changed = false;
    for (const entry of d.val) {
      if (!Array.isArray(entry.value)) continue;
      // a) rewrite legacy hrefs in markDefs
      for (const block of entry.value) {
        for (const md of block.markDefs ?? []) {
          if (md._type === 'externalLink' && typeof md.href === 'string' && md.href.includes('travel2egypt.org')) {
            const to = rewriteHref(md.href);
            if (to && md.href !== to) { md.href = to; rewrites++; changed = true; }
          }
        }
      }
      // b) remove raw DOCTYPE blocks
      const before = entry.value.length;
      entry.value = entry.value.filter((b) => {
        const txt = b._type === 'block' ? (b.children ?? []).map((c) => c.text ?? '').join('') : '';
        return !txt.trim().toLowerCase().startsWith('<!doctype');
      });
      if (entry.value.length !== before) { doctypeRemoved += before - entry.value.length; changed = true; }
    }
    if (changed) {
      docsChanged++;
      console.log(`  ✓ ${d._id} (${d.field})`);
      if (args.commit) { tx = tx.patch(d._id, (p) => p.set({ [d.field]: d.val })); ops++; }
    }
  }

  if (args.commit && ops > 0) { await tx.commit({ visibility: 'sync' }); console.log(`\n✓ Committed ${ops} doc patches.`); }
  console.log(`\n=== Summary ===\ndocs changed: ${docsChanged}   href rewrites: ${rewrites}   DOCTYPE blocks removed: ${doctypeRemoved}`);
  if (!args.commit) console.log('\nDry-run — no writes.');
}

main().catch((e) => { console.error(e); process.exit(1); });
