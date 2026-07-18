/**
 * Migrate the trailing "…is built around your party…" concierge paragraph from
 * the body prose into the structured `conciergeNote` field, so it renders as
 * the gold-ruled note box (like the tours that already have the field set)
 * instead of plain prose.
 *
 * A tour qualifies when: structured conciergeNote is EMPTY (all locales) AND its
 * EN last body block is a normal paragraph matching the concierge template. For
 * each locale, the LAST body block is moved to conciergeNote[locale] and removed
 * from the body — but only if that locale's last block is a normal paragraph AND
 * matches the locale's concierge signal; otherwise that locale is FLAGGED and
 * left untouched (reported, never guessed).
 *
 * Usage:
 *   npx tsx scripts/migrate-concierge-note-from-body.ts --dry-run
 *   npx tsx scripts/migrate-concierge-note-from-body.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
function die(m: string): never { process.stderr.write(`error: ${m}\n`); process.exit(2); }
function parseArgs(argv: string[]): { commit: boolean } {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) { if (a === '--commit') commit = true; else if (a === '--dry-run') dryRun = true; else die(`Unknown arg: ${a}`); }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit };
}
function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'production') die('production only');
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) die('missing projectId/token');
  return createClient({ projectId, dataset, apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

interface Span { text?: string }
interface Block { _key: string; _type?: string; style?: string; listItem?: string; children?: Span[] }
interface LocaleBody { _key: string; value?: Block[] }
interface NoteItem { _key: string; value?: string }
interface TourRow { _id: string; slug: string | null; type?: string; body?: LocaleBody[]; conciergeNote?: NoteItem[] }

const LOCALES = ['en', 'es', 'ja'];
// Distinctive signals for the "…built around your party, not the other way
// around. Tell our team how you'd want to shape it…" closing paragraph.
const SIGNAL: Record<string, RegExp> = {
  en: /not the other way around|(built|shaped) around your (party|group)/i,
  es: /no al rev[eé]s|(en torno a|alrededor de)l?\s+\S*\s*grupo/i,
  ja: /ご一行|組み立て|組み直|形を作|形を整/,
};
const blockText = (b: Block) => (b.children ?? []).map((c) => c.text ?? '').join('');
const isNormalPara = (b: Block) => b._type === 'block' && !b.listItem && (b.style === 'normal' || b.style === undefined);

async function main() {
  const { commit } = parseArgs(process.argv);
  console.log(`\n=== migrate concierge note: body → structured field ===\nmode: ${commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();
  const rows = await client.fetch<TourRow[]>(`
    *[_type=="tour" && !(_id in path("drafts.**"))]{ _id, "slug": slug[_key=="en"][0].value.current, type, body, conciergeNote } | order(_id asc)
  `);
  const draftIds = new Set<string>(await client.fetch<string[]>(`*[_type=="tour" && _id in path("drafts.**")]._id`));
  console.log(`Fetched ${rows.length} published tours.\n`);

  interface LocalePlan { locale: string; blockKey: string; text: string; block?: Block }
  interface Plan { _id: string; slug: string | null; type?: string; hasDraft: boolean; locales: LocalePlan[] }
  const plans: Plan[] = [];
  const flags: string[] = [];
  const perLocale: Record<string, number> = { en: 0, es: 0, ja: 0 };
  let skippedHasField = 0, skippedNoMatch = 0;

  // The concierge paragraph is the LAST body block on these package tours.
  const lastNote = (body: Block[] | undefined, locale: string): Block | 'none' | 'notpara' | 'nomatch' => {
    if (!body || body.length === 0) return 'none';
    const last = body[body.length - 1];
    if (!isNormalPara(last)) return 'notpara';
    if (!SIGNAL[locale].test(blockText(last))) return 'nomatch';
    return last;
  };

  for (const row of rows) {
    const noteSet = (row.conciergeNote ?? []).some((n) => n.value && n.value.trim());
    const enBody = (row.body ?? []).find((b) => b._key === 'en')?.value;
    const enRes = lastNote(enBody, 'en');
    if (typeof enRes === 'string') { skippedNoMatch++; continue; }   // EN last block isn't the concierge para
    if (noteSet) { skippedHasField++; flags.push(`SKIP (field already set): ${row.slug}`); continue; }

    const locales: LocalePlan[] = [];
    for (const locale of LOCALES) {
      const body = (row.body ?? []).find((b) => b._key === locale)?.value;
      const res = lastNote(body, locale);
      if (typeof res === 'string') { flags.push(`${row.slug} [${locale}]: last block ${res} — skipped locale`); continue; }
      locales.push({ locale, blockKey: res._key, text: blockText(res), block: res });
      perLocale[locale]++;
    }
    if (locales.length > 0) plans.push({ _id: row._id, slug: row.slug, type: row.type, hasDraft: draftIds.has(`drafts.${row._id}`), locales });
  }

  console.log(`Tours to migrate: ${plans.length}  (packages=${plans.filter(p=>p.type==='package').length} dayTours=${plans.filter(p=>p.type==='dayTour').length})`);
  console.log(`Locale paragraphs moved: en=${perLocale.en} es=${perLocale.es} ja=${perLocale.ja}`);
  console.log(`Tours skipped — no matching EN closing paragraph: ${skippedNoMatch}`);
  console.log(`Tours skipped — structured field already set: ${skippedHasField}`);
  console.log(`Tours that also have a draft: ${plans.filter(p=>p.hasDraft).length}`);
  console.log(`\nPer-locale skip/flag notes: ${flags.length}`);
  for (const f of flags.slice(0, 60)) console.log(`   ⚠ ${f}`);
  if (plans[0]) {
    const p = plans[0];
    console.log(`\nSAMPLE (${p.slug}):`);
    for (const l of p.locales) console.log(`   ${l.locale}: → conciergeNote = ${JSON.stringify(l.text.slice(0, 90))}…  (removed from body)`);
  }

  writeFileSync(resolve(process.cwd(), 'scripts/.concierge-migrate-plan.json'), JSON.stringify(plans, null, 2), 'utf8');
  if (!commit) { console.log(`\nDry-run complete. Re-run with --commit.`); return; }

  console.log(`\nCommitting…`);
  let ok = 0; const errors: Array<{ id: string; e: string }> = [];
  const apply = async (id: string, p: Plan) => {
    // 1) set the whole conciergeNote field (raw client preserves explicit _keys).
    const noteArr = p.locales.map((l) => ({ _key: l.locale, _type: 'internationalizedArrayTextValue', value: l.text }));
    await client.patch(id).set({ conciergeNote: noteArr }).commit({ visibility: 'async' });
    // 2) remove the migrated paragraphs from the body (pure unset, separate patch).
    await client.patch(id).unset(p.locales.map((l) => `body[_key=="${l.locale}"].value[_key=="${l.blockKey}"]`)).commit({ visibility: 'async' });
  };
  for (const p of plans) {
    try { await apply(p._id, p); if (p.hasDraft) await apply(`drafts.${p._id}`, p); ok++; }
    catch (e) { errors.push({ id: p._id, e: (e as Error).message }); }
  }
  console.log(`  migrated: ${ok} / errors: ${errors.length}`);
  for (const e of errors.slice(0, 10)) console.log(`    ${e.id}: ${e.e}`);
  if (errors.length) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
