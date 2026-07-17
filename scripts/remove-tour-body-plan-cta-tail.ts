/**
 * Remove the trailing non-functional "→ Plan this with us" tail from tour bodies.
 *
 * The tour views now render a real, functional "Plan this with us →" CTA at the
 * end of the body (→ /plan-your-tour), so the old italic tail in the prose is a
 * duplicate. Pattern (uniform across the corpus): the LAST body block is a
 * normal paragraph whose LAST child is an `em`/italic span (the localized
 * "plan with us" phrase), preceded by a span whose text ends with "→".
 *
 * Removal (per locale, only when the pattern matches): unset the trailing em
 * span and strip the " → " tail from the preceding span. Anything not matching
 * is reported and left untouched.
 *
 * Usage:
 *   npx tsx scripts/remove-tour-body-plan-cta-tail.ts --dry-run
 *   npx tsx scripts/remove-tour-body-plan-cta-tail.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

function die(msg: string): never { process.stderr.write(`error: ${msg}\n`); process.exit(2); }

function parseArgs(argv: string[]): { commit: boolean } {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else die(`Unknown argument: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit };
}

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) die('projectId/dataset must be set in .env');
  if (dataset !== 'production') die(`Refusing to run against "${dataset}". production only.`);
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die('SANITY_PRODUCTION_API_WRITE_TOKEN must be set in .env');
  return createClient({
    projectId, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

interface Span { _key: string; _type?: string; marks?: string[]; text?: string }
interface Block { _key: string; _type?: string; style?: string; listItem?: string; children?: Span[] }
interface LocaleBody { _key: string; value?: Block[] }
interface TourRow { _id: string; slug: string | null; body?: LocaleBody[] }

const LOCALES = ['en', 'es', 'ja'];
const ARROW_TAIL = /\s*→\s*$/;

async function main() {
  const { commit } = parseArgs(process.argv);
  console.log(`\n=== remove trailing "→ plan with us" body tail ===\nmode: ${commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  const rows = await client.fetch<TourRow[]>(`
    *[_type=="tour" && !(_id in path("drafts.**"))]{
      _id, "slug": slug[_key=="en"][0].value.current, body
    } | order(_id asc)
  `);
  const draftIds = new Set<string>(
    await client.fetch<string[]>(`*[_type=="tour" && _id in path("drafts.**")]._id`)
  );
  console.log(`Fetched ${rows.length} published tours.\n`);

  interface Edit { locale: string; blockKey: string; emSpanKey: string; prevSpanKey: string; prevNewText: string }
  interface Plan { _id: string; slug: string | null; edits: Edit[]; hasDraft: boolean; backup: Array<{ locale: string; block: Block }> }
  const plans: Plan[] = [];
  const flagged: Array<{ _id: string; slug: string | null; locale: string; reason: string }> = [];
  const perLocale: Record<string, number> = { en: 0, es: 0, ja: 0 };

  for (const row of rows) {
    const edits: Edit[] = [];
    const backup: Array<{ locale: string; block: Block }> = [];
    for (const locale of LOCALES) {
      const lb = (row.body ?? []).find((b) => b._key === locale);
      const blocks = lb?.value;
      if (!blocks || blocks.length === 0) continue;
      const last = blocks[blocks.length - 1];
      if (last._type !== 'block' || last.listItem) continue;
      const kids = last.children ?? [];
      if (kids.length < 2) continue;
      const em = kids[kids.length - 1];
      const prev = kids[kids.length - 2];
      const emIsItalic = (em.marks ?? []).includes('em');
      if (!emIsItalic) continue;                       // last child not italic → not the CTA tail
      if (!ARROW_TAIL.test(prev.text ?? '')) {         // italic present but no "→" lead-in → review
        flagged.push({ _id: row._id, slug: row.slug, locale, reason: `italic tail "${(em.text ?? '').slice(0,30)}" but prev doesn't end with →` });
        continue;
      }
      edits.push({
        locale, blockKey: last._key, emSpanKey: em._key, prevSpanKey: prev._key,
        prevNewText: (prev.text ?? '').replace(ARROW_TAIL, ''),
      });
      backup.push({ locale, block: last });
      perLocale[locale]++;
    }
    if (edits.length > 0) {
      plans.push({ _id: row._id, slug: row.slug, edits, hasDraft: draftIds.has(`drafts.${row._id}`), backup });
    }
  }

  const totalEdits = plans.reduce((n, p) => n + p.edits.length, 0);
  console.log(`Tours with a CTA tail to strip: ${plans.length}`);
  console.log(`Total tails removed: ${totalEdits}  (en=${perLocale.en} es=${perLocale.es} ja=${perLocale.ja})`);
  console.log(`Tours that also have a draft: ${plans.filter((p) => p.hasDraft).length}`);
  console.log(`\nFlagged (italic last-child but no "→" lead-in — NOT touched): ${flagged.length}`);
  for (const f of flagged.slice(0, 40)) console.log(`   ⚠ ${f.slug} [${f.locale}]: ${f.reason}`);

  // Show one before/after sample.
  if (plans[0]) {
    const e = plans[0].edits[0];
    const b = plans[0].backup.find((x) => x.locale === e.locale)!.block;
    const prev = (b.children ?? []).find((c) => c._key === e.prevSpanKey);
    console.log(`\nSAMPLE (${plans[0].slug} [${e.locale}]):`);
    console.log(`  before: …${JSON.stringify((prev?.text ?? '').slice(-40))} + em ${JSON.stringify((b.children ?? []).slice(-1)[0]?.text)}`);
    console.log(`  after : …${JSON.stringify(e.prevNewText.slice(-40))}  (em span removed)`);
  }

  const planPath = resolve(process.cwd(), 'scripts/.plan-cta-tail-removal-plan.json');
  writeFileSync(planPath, JSON.stringify(plans, null, 2), 'utf8');
  console.log(`\nPlan+backup written: ${planPath}`);

  if (!commit) { console.log(`\nDry-run complete. Re-run with --commit.`); return; }

  console.log(`\nCommitting…`);
  let patched = 0; const errors: Array<{ _id: string; error: string }> = [];
  // IMPORTANT: apply the `set` (trim "→") and the `unset` (drop the em span) as
  // TWO SEPARATE patches. Combining a set-on-a-sibling-child with an unset of
  // another child of the SAME array in one transaction silently dropped the
  // unset (the "→" got trimmed but the em span survived). Sequencing them avoids
  // the interference.
  const applyEdits = async (id: string, edits: Edit[]) => {
    await client.patch(id).unset(
      edits.map((e) => `body[_key=="${e.locale}"].value[_key=="${e.blockKey}"].children[_key=="${e.emSpanKey}"]`)
    ).commit({ visibility: 'async' });
    let stx = client.patch(id);
    for (const e of edits) {
      stx = stx.set({ [`body[_key=="${e.locale}"].value[_key=="${e.blockKey}"].children[_key=="${e.prevSpanKey}"].text`]: e.prevNewText });
    }
    await stx.commit({ visibility: 'async' });
  };
  for (const p of plans) {
    try {
      await applyEdits(p._id, p.edits);
      if (p.hasDraft) await applyEdits(`drafts.${p._id}`, p.edits);
      patched++;
    } catch (e) {
      errors.push({ _id: p._id, error: (e as Error).message });
    }
  }
  console.log(`  patched: ${patched} / errors: ${errors.length}`);
  for (const e of errors.slice(0, 10)) console.log(`    ${e._id}: ${e.error}`);
  if (errors.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
