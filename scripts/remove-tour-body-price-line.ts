/**
 * Remove the "From · Around €… per person" price line from tour bodies.
 *
 * Owner decision 2026-07-18: price lives ONLY on the sidebar card (priceFrom),
 * not duplicated in the body prose. Strip the single price bullet from every
 * tour that has it, in ALL locales (en/es/ja). See memory
 * [[tour-price-from-sidebar-and-backfill]].
 *
 * A block is a PRICE line if it contains "€" AND a per-person / price-lead
 * signal (per person · por persona · 一人 · 目安 · From/Desde lead · €X). Any
 * "€" block that does NOT match is reported as OTHER and left untouched
 * (protects legitimate ticket/entrance-fee mentions). The dry run must show
 * zero OTHER blocks before committing.
 *
 * Patches the PUBLISHED doc directly (the site serves published). Docs that
 * also have a divergent draft are flagged (not auto-touched).
 *
 * Usage:
 *   npx tsx scripts/remove-tour-body-price-line.ts --dry-run
 *   npx tsx scripts/remove-tour-body-price-line.ts --commit
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
  // Production dataset needs the production-scoped write token; the generic
  // SANITY_API_WRITE_TOKEN lacks "update" permission here.
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die('SANITY_PRODUCTION_API_WRITE_TOKEN must be set in .env');
  return createClient({
    projectId, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

interface Span { _type?: string; text?: string }
interface Block { _key: string; _type?: string; listItem?: string; children?: Span[] }
interface LocaleBody { _key: string; value?: Block[] }
interface TourRow { _id: string; slug: string | null; body?: LocaleBody[] }

const LOCALES = ['en', 'es', 'ja'];

function blockText(b: Block): string {
  return (b.children ?? []).map((c) => c.text ?? '').join('');
}

/** True if the block's text is the "from" price line (contains € + a price signal). */
function isPriceLine(text: string): boolean {
  if (!text.includes('€')) return false;
  const t = text.toLowerCase();
  return (
    t.includes('per person') ||
    t.includes('por persona') ||
    t.includes('per vehicle') ||   // airport/point-to-point transfers
    t.includes('por vehículo') || t.includes('por vehiculo') ||
    text.includes('一人') ||       // お一人様 / 一人あたり
    text.includes('目安') ||        // JA "estimate" price lead
    text.includes('車') ||          // JA per-vehicle transfers (…車あたり)
    /(^|\s)(from|desde)\s+(around|about|unos|approx)/i.test(text) ||
    /(^|\s)(from|desde)\s*[·—-]/i.test(text) ||
    /€\s*x/i.test(text)            // "€X" placeholder
  );
}

async function main() {
  const { commit } = parseArgs(process.argv);
  console.log(`\n=== remove tour body price line ===\nmode: ${commit ? 'COMMIT' : 'dry-run'}\n`);
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

  interface Plan { _id: string; slug: string | null; paths: string[]; hasDraft: boolean; removed: Array<{ locale: string; block: Block }> }
  const plans: Plan[] = [];
  const otherBlocks: Array<{ _id: string; slug: string | null; locale: string; key: string; text: string }> = [];
  const perLocale: Record<string, number> = { en: 0, es: 0, ja: 0 };

  for (const row of rows) {
    const paths: string[] = [];
    const removed: Array<{ locale: string; block: Block }> = [];
    for (const locale of LOCALES) {
      const lb = (row.body ?? []).find((b) => b._key === locale);
      if (!lb?.value) continue;
      for (const block of lb.value) {
        if (block._type !== 'block') continue;
        const text = blockText(block);
        if (!text.includes('€')) continue;
        if (isPriceLine(text)) {
          paths.push(`body[_key=="${locale}"].value[_key=="${block._key}"]`);
          removed.push({ locale, block });
          perLocale[locale]++;
        } else {
          otherBlocks.push({ _id: row._id, slug: row.slug, locale, key: block._key, text: text.slice(0, 100) });
        }
      }
    }
    if (paths.length > 0) {
      plans.push({ _id: row._id, slug: row.slug, paths, hasDraft: draftIds.has(`drafts.${row._id}`), removed });
    }
  }

  const totalBlocks = plans.reduce((n, p) => n + p.paths.length, 0);
  console.log(`Tours with a price line to remove: ${plans.length}`);
  console.log(`Total price blocks to remove: ${totalBlocks}  (en=${perLocale.en} es=${perLocale.es} ja=${perLocale.ja})`);
  const withDraft = plans.filter((p) => p.hasDraft);
  console.log(`Tours that also have a draft (flagged, still patched-published): ${withDraft.length}`);
  if (withDraft.length) for (const p of withDraft) console.log(`   ⚠ draft exists: ${p.slug} (${p._id})`);
  console.log(`\nOTHER "€" blocks NOT matching the price pattern (left untouched): ${otherBlocks.length}`);
  for (const o of otherBlocks) console.log(`   ⚠ ${o.slug} [${o.locale}] ${o.key}: ${JSON.stringify(o.text)}`);

  const planPath = resolve(process.cwd(), 'scripts/.price-line-removal-plan.json');
  writeFileSync(planPath, JSON.stringify(plans, null, 2), 'utf8');
  console.log(`\nPlan written: ${planPath}`);

  if (!commit) {
    console.log(`\nDry-run complete. Re-run with --commit to remove the ${totalBlocks} blocks.`);
    return;
  }

  console.log(`\nCommitting…`);
  let patched = 0; const errors: Array<{ _id: string; error: string }> = [];
  for (const p of plans) {
    try {
      await client.patch(p._id).unset(p.paths).commit({ visibility: 'async' });
      // Mirror the removal into any existing draft so it can't resurface on
      // a later publish. unset on a missing path is a safe no-op.
      if (p.hasDraft) {
        await client.patch(`drafts.${p._id}`).unset(p.paths).commit({ visibility: 'async' });
      }
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
