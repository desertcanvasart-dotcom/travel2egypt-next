/**
 * Stage ES/JA drafts for the 8 ops/policy FAQ entries (owner decision
 * 2026-08-19: "I draft, you review"). These entries had no counterpart in
 * the FAQ migration set, so their ES/JA renderings were authored fresh from
 * the live EN answers (migration/faq-ops-esja-draft-translations-2026-08-19.json,
 * Canon-gated: same facts and figures, ES impersonal register, JA formal).
 *
 * DRAFTS ONLY: each doc gets drafts.<id> = byte-copy of the published doc
 * with es/ja items appended to question/answer. The live site is untouched
 * until the owner reviews and publishes from the Studio. Skips any doc that
 * already has a draft (clean-draft rule) or already carries `es`.
 *
 *   Dry run (default): npx tsx scripts/stage-faq-ops-esja-drafts.ts
 *   Apply:             npx tsx scripts/stage-faq-ops-esja-drafts.ts --apply
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

function answerBlocks(id: string, locale: string, answer: string) {
  const stem = id.replace('faq-entry-', '').slice(0, 18);
  return answer
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => ({
      _type: 'block',
      _key: `ops${stem}${locale}b${i}`,
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: `ops${stem}${locale}s${i}`, marks: [], text: p }],
    }));
}

async function main() {
  console.log(`\n=== Stage ops-FAQ ES/JA drafts — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const data = JSON.parse(
    readFileSync(
      path.join(process.cwd(), 'migration/faq-ops-esja-draft-translations-2026-08-19.json'),
      'utf8'
    )
  );

  let staged = 0;
  let skipped = 0;
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
        { _key: 'es', value: answerBlocks(id, 'es', tr.es.answer) },
        { _key: 'ja', value: answerBlocks(id, 'ja', tr.ja.answer) },
      ],
    };
    console.log(`  ✓ DRAFT drafts.${id}  (es: "${tr.es.question}" / ja: "${tr.ja.question}")`);
    if (APPLY) await c.createOrReplace(draft as never);
    staged++;
  }
  console.log(`\n${APPLY ? 'Staged' : 'Dry run'}: ${staged} drafts, ${skipped} skipped.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
