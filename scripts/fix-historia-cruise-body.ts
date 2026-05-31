/**
 * MS Historia cruise body cleanup (import artifacts).
 *
 * The MS Historia import left two markdown artifacts in the body (all locales):
 *   1. Literal "· · ·" thematic-break blocks rendered as plain text → remove.
 *   2. A faux heading "■ Itineraries" / "■ Itinerarios" / "■ 航路" as a normal
 *      block → promote to a real h2 heading and strip the "■ " marker.
 *
 * h2 because "Itineraries" is the top-level body section here (the cruise name
 * is the page h1); sibling cruises use h2 for top-level body sections.
 *
 * Span-level mutation + array filter; raw @sanity/client preserves _key/_type.
 * Patches published + draft. Dry-run by default; --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const SLUG = 'historia-boutique-nile-cruise';
const DOT_RE = /^[·•\.\s]+$/; // "· · ·" (or stray dots/spaces only)
const SQUARE_RE = /^\s*■\s*/;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const blockText = (b: any) =>
  (b?.children || []).map((c: any) => (typeof c.text === 'string' ? c.text : '')).join('');

async function main() {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }

  const base = await client.fetch(
    `*[_type=="nileCruise" && slug[_key=="en"][0].value.current==$s][0]._id`, { s: SLUG });
  if (!base) throw new Error('Historia cruise not found');
  const id = base.replace(/^drafts\./, '');

  for (const target of [id, `drafts.${id}`]) {
    const doc = await client.fetch(`*[_id==$id][0]{_id, body}`, { id: target });
    if (!doc || !Array.isArray(doc.body)) { console.log(`\n## ${target}: (absent)`); continue; }
    console.log(`\n## ${target}`);
    let changed = false;

    for (const entry of doc.body) {
      if (!entry || !Array.isArray(entry.value)) continue;
      const kept: any[] = [];
      for (const block of entry.value) {
        if (block._type === 'block') {
          const txt = blockText(block);
          // 1. drop dot-separator blocks
          if (DOT_RE.test(txt) && /[·•]/.test(txt)) {
            console.log(`   ${entry._key}: remove separator "${txt}"`);
            changed = true;
            continue;
          }
          // 2. promote ■-prefixed faux heading to h2
          if (block.children?.[0] && typeof block.children[0].text === 'string' && SQUARE_RE.test(block.children[0].text)) {
            const before = block.children[0].text;
            block.children[0].text = before.replace(SQUARE_RE, '');
            block.style = 'h2';
            console.log(`   ${entry._key}: heading "${before}" → h2 "${block.children[0].text}"`);
            changed = true;
          }
        }
        kept.push(block);
      }
      entry.value = kept;
    }

    if (changed && commit) {
      await client.patch(target).set({ body: doc.body }).commit({ visibility: 'async' });
      console.log(`     → written`);
    }
  }
  if (!commit) console.log('\nDRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
