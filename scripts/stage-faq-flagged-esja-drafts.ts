/**
 * Stage ES/JA drafts for the 6 fact-check-flagged FAQ entries + the 7
 * original category names (owner report of English on /ja/faq, 2026-08-19).
 *
 * Key decision: these render the LIVE EN answers (approved, on /faq today),
 * NOT the VERIFY-flagged migration rewrites — so localization no longer
 * waits on the fact-check. When the fact-check later lands, corrections
 * apply ×3 locales.
 *
 * Data: migration/faq-flagged-esja-draft-translations-2026-08-19.json
 * (structured blocks — `li: true` becomes listItem "bullet", matching the
 * live EN answers' bullet structure).
 *
 * DRAFTS ONLY, owner reviews + publishes from Studio. Clean-draft rule and
 * es-already-present idempotency as in the ops-entries stage script.
 *
 *   Dry run (default): npx tsx scripts/stage-faq-flagged-esja-drafts.ts
 *   Apply:             npx tsx scripts/stage-faq-flagged-esja-drafts.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');

const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_PRODUCTION_API_WRITE_TOKEN');
  process.exit(1);
}
const c = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

interface TrBlock { li?: boolean; text: string }

function toPT(id: string, locale: string, blocks: TrBlock[]) {
  const stem = id.replace('faq-entry-', '').slice(0, 16);
  return blocks.map((b, i) => ({
    _type: 'block',
    _key: `flg${stem}${locale}b${i}`,
    style: 'normal',
    ...(b.li ? { listItem: 'bullet' } : {}),
    markDefs: [],
    children: [{ _type: 'span', _key: `flg${stem}${locale}s${i}`, marks: [], text: b.text }],
  }));
}

async function main() {
  console.log(`\n=== Stage flagged-FAQ ES/JA drafts + category names — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const data = JSON.parse(
    readFileSync(
      path.join(process.cwd(), 'migration/faq-flagged-esja-draft-translations-2026-08-19.json'),
      'utf8'
    )
  );

  let staged = 0;
  let skipped = 0;

  console.log('— Entries —');
  for (const [id, tr] of Object.entries<any>(data.entries)) {
    const [doc, draftExists] = await Promise.all([
      c.getDocument(id),
      c.fetch<boolean>(`defined(*[_id==$id][0]._id)`, { id: `drafts.${id}` }),
    ]);
    if (!doc) { console.log(`  ✗ SKIP ${id} — published doc not found`); skipped++; continue; }
    if (draftExists) { console.log(`  ✗ SKIP ${id} — draft already exists (clean-draft rule)`); skipped++; continue; }
    if ((doc.answer ?? []).some((a: { _key: string }) => a._key === 'es')) {
      console.log(`  • DONE ${id} — already localized`); skipped++; continue;
    }
    // structure parity guard: same block count and bullet pattern as live EN
    const enBlocks = (doc.answer ?? []).find((a: any) => a._key === 'en')?.value ?? [];
    for (const loc of ['es', 'ja'] as const) {
      const pattern = (arr: any[]) => arr.map((b) => (b.listItem === 'bullet' || b.li ? 'b' : 'p')).join('');
      if (pattern(enBlocks) !== pattern(tr[loc].blocks)) {
        console.log(`  ⚠ ${id} [${loc}] structure differs from EN (${pattern(enBlocks)} vs ${pattern(tr[loc].blocks)})`);
      }
    }
    const draft = {
      ...doc,
      _id: `drafts.${id}`,
      question: [
        ...doc.question,
        { _key: 'es', value: tr.es.question },
        { _key: 'ja', value: tr.ja.question },
      ],
      answer: [
        ...doc.answer,
        { _key: 'es', value: toPT(id, 'es', tr.es.blocks) },
        { _key: 'ja', value: toPT(id, 'ja', tr.ja.blocks) },
      ],
    };
    console.log(`  ✓ DRAFT drafts.${id}`);
    if (APPLY) await c.createOrReplace(draft as never);
    staged++;
  }

  console.log('\n— Category names —');
  for (const [id, names] of Object.entries<any>(data.categories)) {
    const [doc, draftExists] = await Promise.all([
      c.getDocument(id),
      c.fetch<boolean>(`defined(*[_id==$id][0]._id)`, { id: `drafts.${id}` }),
    ]);
    if (!doc) { console.log(`  ✗ SKIP ${id} — not found`); skipped++; continue; }
    if (draftExists) { console.log(`  ✗ SKIP ${id} — draft exists`); skipped++; continue; }
    if ((doc.name ?? []).some((n: { _key: string }) => n._key === 'es')) {
      console.log(`  • DONE ${id} — already localized`); skipped++; continue;
    }
    const draft = {
      ...doc,
      _id: `drafts.${id}`,
      name: [
        ...doc.name,
        { _key: 'es', value: names.es },
        { _key: 'ja', value: names.ja },
      ],
    };
    console.log(`  ✓ DRAFT drafts.${id} — "${names.es}" / "${names.ja}"`);
    if (APPLY) await c.createOrReplace(draft as never);
    staged++;
  }

  console.log(`\n${APPLY ? 'Staged' : 'Dry run'}: ${staged} drafts, ${skipped} skipped.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
