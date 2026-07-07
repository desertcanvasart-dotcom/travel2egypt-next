/**
 * Guide editorial audit — partial-overlap lede cleanup (the 370-row residue
 * the 2026-06-01 exact-match pass could not touch).
 *
 * Input: migration/guide-lede-partial-overlap.csv (doc_id, locale, …) — rows
 * where summary[locale] is a TRUNCATED machine excerpt of the body (title +
 * opening prose chopped at ~240 chars, often mid-word), so the page opens by
 * stuttering: italic lede, then the body repeating it.
 *
 * Rule: after normalization (letters/digits only, casefolded — whitespace and
 * punctuation drift from the excerpt generator ignored), if the summary is a
 * PREFIX of the concatenated body text, it contains nothing the body doesn't —
 * clearing it loses zero information.
 *
 * Fix per (doc, locale), published doc + draft sibling when the draft carries
 * the same debris:
 *   - unset summary[_key==locale]
 *   - if seo.metaDescription[locale] is empty, set it to the body's first
 *     complete sentence (first style=='normal' block; ≤160 chars, 。boundary
 *     for JA) so the meta description doesn't fall to the site tagline. This
 *     is extraction from the page's own text, not authored copy.
 *
 * Bodies are NEVER touched (they carry the mention-link spans).
 * Non-prefix rows are written to docs/guide-partial-lede-review-<date>.csv
 * for owner review instead of being forced.
 *
 *   Dry run: npx tsx scripts/fix-guide-partial-lede.ts
 *   Apply:   npx tsx scripts/fix-guide-partial-lede.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const TOKEN =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;
const APPLY = process.argv.includes('--apply');
if (!TOKEN) {
  console.error('Missing SANITY_PRODUCTION_API_WRITE_TOKEN / SANITY_API_WRITE_TOKEN.');
  process.exit(1);
}

const client = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-10-01',
  token: TOKEN,
  useCdn: false,
});

/** Letters/digits only (unicode), casefolded — tolerant of the excerpt
 * generator's whitespace/punctuation drift ("Here s" vs "Here's"). */
const norm = (s: string) =>
  (s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

interface Block {
  _type: string;
  style?: string;
  children?: Array<{ _type: string; text?: string }>;
}
const blockText = (b: Block) =>
  (b.children ?? []).map((c) => c.text ?? '').join('');

/** First complete sentence of the first normal block, capped for meta use. */
function firstSentence(blocks: Block[], locale: string): string | null {
  const para = blocks.find(
    (b) => b._type === 'block' && (b.style ?? 'normal') === 'normal' && blockText(b).trim(),
  );
  if (!para) return null;
  const text = blockText(para).trim();
  if (locale === 'ja') {
    const idx = text.indexOf('。');
    const s = idx >= 0 ? text.slice(0, idx + 1) : text;
    return s.length <= 120 ? s : s.slice(0, 110);
  }
  const m = text.match(/^.*?[.!?](?=\s|$)/);
  const s = (m ? m[0] : text).trim();
  if (s.length <= 160) return s;
  const cut = s.slice(0, 155);
  return cut.slice(0, cut.lastIndexOf(' '));
}

interface Row { doc_id: string; locale: string }

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'} · dataset: production\n`);
  const rows: Row[] = readFileSync('migration/guide-lede-partial-overlap.csv', 'utf8')
    .trim().split('\n').slice(1)
    .map((l) => {
      const [doc_id, locale] = l.split(',');
      return { doc_id, locale };
    });

  // Group rows per doc so we fetch once and patch once.
  const byDoc = new Map<string, string[]>();
  for (const r of rows) {
    byDoc.set(r.doc_id, [...(byDoc.get(r.doc_id) ?? []), r.locale]);
  }
  console.log(`rows: ${rows.length} across ${byDoc.size} docs\n`);

  const review: string[] = ['doc_id,locale,reason,summary'];
  const rollback: Array<{
    docId: string; draftId: string | null; locale: string;
    oldSummaryItem: unknown; oldMetaDescItem: unknown; setMetaDesc: string | null;
  }> = [];
  let cleared = 0, metaSet = 0, reviewed = 0, missing = 0;

  for (const [docId, locales] of byDoc) {
    const ids = [docId, `drafts.${docId}`];
    const docs: Array<{
      _id: string;
      summary?: Array<{ _key: string; value?: string }>;
      body?: Array<{ _key: string; value?: Block[] }>;
      metaDesc?: Array<{ _key: string; value?: string }>;
    }> = await client.fetch(
      `*[_id in $ids]{ _id, summary, body, "metaDesc": seo.metaDescription }`,
      { ids },
    );
    const pub = docs.find((d) => !d._id.startsWith('drafts.'));
    const draft = docs.find((d) => d._id.startsWith('drafts.'));
    if (!pub) { missing++; review.push(`${docId},-,published doc missing,`); continue; }

    for (const locale of locales) {
      const sum = pub.summary?.find((s) => s._key === locale)?.value ?? '';
      const blocks = pub.body?.find((b) => b._key === locale)?.value ?? [];
      const bodyNorm = norm(blocks.map(blockText).join(' '));
      const sumNorm = norm(sum);

      if (!sumNorm) { review.push(`${docId},${locale},summary already empty,`); reviewed++; continue; }
      if (sumNorm.length < 20 || !bodyNorm.startsWith(sumNorm)) {
        review.push(`${docId},${locale},not a body prefix,"${sum.replace(/"/g, '""')}"`);
        reviewed++;
        continue;
      }

      // Debris confirmed. Build patches.
      const metaCur = pub.metaDesc?.find((m) => m._key === locale)?.value ?? '';
      const sentence = metaCur.trim() ? null : firstSentence(blocks, locale);

      if (APPLY) {
        const applyTo = async (id: string, hasSameDebris: boolean) => {
          if (!hasSameDebris) return;
          let p = client.patch(id).unset([`summary[_key=="${locale}"]`]);
          if (sentence) {
            p = p.setIfMissing({ 'seo.metaDescription': [] }).insert(
              'after', 'seo.metaDescription[-1]',
              [{ _key: locale, _type: 'internationalizedArrayTextValue', value: sentence }],
            );
          }
          await p.commit();
        };
        await applyTo(pub._id, true);
        if (draft) {
          const dSum = draft.summary?.find((s) => s._key === locale)?.value ?? '';
          await applyTo(draft._id, norm(dSum) === sumNorm);
        }
      }
      rollback.push({
        docId: pub._id,
        draftId: draft?._id ?? null,
        locale,
        oldSummaryItem: pub.summary?.find((s) => s._key === locale) ?? null,
        oldMetaDescItem: pub.metaDesc?.find((m) => m._key === locale) ?? null,
        setMetaDesc: sentence,
      });
      cleared++;
      if (sentence) metaSet++;
    }
  }

  console.log(`clear-summary: ${cleared} (meta-desc backfilled: ${metaSet})`);
  console.log(`review (untouched): ${reviewed}, docs missing: ${missing}`);

  const reviewPath = 'docs/guide-partial-lede-review-2026-07-06.csv';
  writeFileSync(reviewPath, review.join('\n'));
  console.log(`review CSV: ${reviewPath} (${review.length - 1} rows)`);

  if (APPLY) {
    const dir = path.join(process.cwd(), 'backups', 'guide-partial-lede-2026-07-06');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'rollback.json'), JSON.stringify(rollback, null, 2));
    console.log(`rollback: ${dir}/rollback.json`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
