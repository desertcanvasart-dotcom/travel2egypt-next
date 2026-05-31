/**
 * Sitewide cleanup of two markdown-import artifacts left in localized `body`
 * fields across all content types (article, guideArticle, hotel, nileCruise,
 * tour, travelTip, …):
 *
 *   1. Literal thematic-break blocks rendered as plain text ("· · ·" / "···")
 *      → remove the block entirely.
 *   2. A stray "■ " marker prefixing heading text (e.g. "■ Visiting").
 *      The blocks already carry the correct h2/h3 style — only the leading
 *      "■ " character is wrong → strip it, PRESERVE the existing style.
 *
 * Bodies here are localized arrays: body[]{ _key:"en"|"es"|"ja", value:[blocks] }.
 * A defensive branch also handles a plain Portable Text array body.
 *
 * Raw @sanity/client preserves _key/_type verbatim. Patches each doc id exactly
 * as it exists (published and/or draft, whichever carry the artifact).
 * Dry-run by default; --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

const DOT_RE = /^[·•.\s]+$/;          // whole block is only dots/spaces
const HAS_DOT = /[·•]/;               // …and contains a real separator glyph
const SQUARE_RE = /^\s*■\s*/;         // leading "■ " marker on heading text

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

const blockText = (b: any) =>
  (b?.children || []).map((c: any) => (typeof c.text === 'string' ? c.text : '')).join('');

/** Mutate a Portable Text block array in place. Returns [removed, stripped]. */
function cleanBlocks(blocks: any[]): { kept: any[]; removed: number; stripped: number } {
  let removed = 0;
  let stripped = 0;
  const kept: any[] = [];
  for (const block of blocks) {
    if (block?._type === 'block') {
      const txt = blockText(block);
      // 1. drop dot-only separator blocks
      if (DOT_RE.test(txt) && HAS_DOT.test(txt)) {
        removed++;
        continue;
      }
      // 2. strip leading "■ " marker from the first span (keep style)
      const first = block.children?.[0];
      if (first && typeof first.text === 'string' && SQUARE_RE.test(first.text)) {
        first.text = first.text.replace(SQUARE_RE, '');
        stripped++;
      }
    }
    kept.push(block);
  }
  return { kept, removed, stripped };
}

/** Clean a whole document body (localized-array or plain PT array). Returns counts or null if unchanged. */
function cleanBody(body: any): { body: any; removed: number; stripped: number } | null {
  if (!Array.isArray(body)) return null;
  let removed = 0;
  let stripped = 0;

  const isLocalized = body.length > 0 && body[0] && Array.isArray(body[0].value);
  if (isLocalized) {
    for (const entry of body) {
      if (!entry || !Array.isArray(entry.value)) continue;
      const r = cleanBlocks(entry.value);
      entry.value = r.kept;
      removed += r.removed;
      stripped += r.stripped;
    }
  } else {
    const r = cleanBlocks(body);
    removed += r.removed;
    stripped += r.stripped;
    if (removed || stripped) return { body: r.kept, removed, stripped };
    return null;
  }

  return removed || stripped ? { body, removed, stripped } : null;
}

async function main() {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }

  // Shape-agnostic: page through EVERY document that has a body (localized or
  // plain Portable Text array) and let cleanBody decide. Avoids GROQ filter
  // quirks across the two body shapes.
  const total: number = await client.fetch(`count(*[defined(body)])`);
  console.log(`Documents with a body: ${total}\n`);

  const PAGE = 150;
  let docsChanged = 0;
  let totalRemoved = 0;
  let totalStripped = 0;
  const byType: Record<string, number> = {};
  let tx = client.transaction();
  let pending = 0;

  for (let start = 0; start < total; start += PAGE) {
    const page: Array<{ _id: string; _type: string; body: any }> = await client.fetch(
      `*[defined(body)] | order(_id) [$a...$b]{_id, _type, body}`,
      { a: start, b: start + PAGE }
    );
    for (const doc of page) {
      const res = cleanBody(doc.body);
      if (!res) continue;

      docsChanged++;
      totalRemoved += res.removed;
      totalStripped += res.stripped;
      byType[doc._type] = (byType[doc._type] || 0) + 1;

      if (commit) {
        tx = tx.patch(client.patch(doc._id).set({ body: res.body }));
        pending++;
        if (pending >= 50) {
          await tx.commit({ visibility: 'async' });
          process.stdout.write(`  committed batch (${docsChanged} docs so far)\n`);
          tx = client.transaction();
          pending = 0;
        }
      }
    }
  }

  if (commit && pending > 0) {
    await tx.commit({ visibility: 'async' });
    console.log(`  committed final batch`);
  }

  console.log(`\n${commit ? 'Updated' : 'Would update'} ${docsChanged} document(s):`);
  console.log(`  separators removed: ${totalRemoved}`);
  console.log(`  "■ " markers stripped: ${totalStripped}`);
  console.log(`  by type: ${JSON.stringify(byType)}`);
  if (!commit) console.log('\nDRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
