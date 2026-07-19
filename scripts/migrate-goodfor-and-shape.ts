/**
 * Consistency migration for tour "Good for" + "shape of the journey":
 *   1. GOOD FOR — move the body "Good for" line into the structured `audienceNote`
 *      field (so every tour renders the identical kicker) and remove it from the
 *      body. Skips tours that already have audienceNote set.
 *   2. SHAPE — remove the body "shape of the journey" section (heading + Where/
 *      Duration/Character/From rows) from the ~2 tours that carry one; the sidebar
 *      rail already shows this on every tour. (Also clears my Australia tour's
 *      leaked JA "目安 — €X〜" row.)
 *
 * Both mutate the localized `body`, so they run together. Per-language, matched
 * by localized labels. Dry-run reports coverage + anomalies + samples and writes
 * a full per-tour plan; --commit applies (audienceNote set + body blocks removed)
 * with a backup of prior bodies/audienceNote.
 *
 *   npx tsx scripts/migrate-goodfor-and-shape.ts --dry-run
 *   npx tsx scripts/migrate-goodfor-and-shape.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
function die(m: string): never { process.stderr.write(`error: ${m}\n`); process.exit(2); }
const commit = process.argv.includes('--commit');
if (!commit && !process.argv.includes('--dry-run')) die('pass --dry-run or --commit');

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'production') die('production only');
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) die('missing projectId/token');
  return createClient({ projectId, dataset, apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

type Lang = 'en' | 'es' | 'ja';
const LANGS: Lang[] = ['en', 'es', 'ja'];
const SEP = '[·••—–\\-:：]';

const GOODFOR: Record<Lang, string[]> = {
  en: ['Good for'],
  es: ['Bueno para', 'Ideal para', 'Perfecto para', 'Recomendado para'],
  ja: ['向いている方', 'おすすめ', 'こんな方に', '向いています'],
};
const SHAPE_HEADING: Record<Lang, string[]> = {
  en: ['The shape of the journey', 'The shape of the day'],
  es: ['La forma del viaje', 'La forma del día'],
  ja: ['旅の輪郭', '旅の形', '一日の輪郭'],
};
const SHAPE_ROW: Record<Lang, string[]> = {
  en: ['Where', 'Duration', 'Character', 'From', 'Good for'],
  es: ['Dónde', 'Duración', 'Carácter', 'Desde', 'Bueno para', 'Ideal para'],
  ja: ['ルート', '日数', '性格', '目安', '向いている方'],
};

interface Span { text?: string; marks?: string[] }
interface Block { _key: string; _type: string; style?: string; children?: Span[] }
const fullText = (b: Block) => (b.children ?? []).map((c) => c.text ?? '').join('');
const startsWithLabel = (text: string, labels: string[]) =>
  labels.find((l) => new RegExp(`^\\s*${l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:${SEP}|$)`).test(text));

function extractAudience(text: string, label: string): string {
  return text.replace(new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${SEP}?\\s*`), '').trim();
}

interface Tour { _id: string; slug: string | null; hasAudience: boolean; body: Record<Lang, Block[] | null> }

async function main() {
  const client = getClient();
  const tours = await client.fetch<Tour[]>(`*[_type=="tour"]{
    "_id": _id,
    "slug": slug[_key=="en"][0].value.current,
    "hasAudience": defined(audienceNote),
    "body": { "en": body[_key=="en"][0].value, "es": body[_key=="es"][0].value, "ja": body[_key=="ja"][0].value }
  }`);

  const plan: any[] = [];
  const stats = { total: tours.length, skippedHasAudience: 0, goodforAll3: 0, goodforPartial: 0, goodforNone: 0, shapeTours: 0 };
  const anomalies: string[] = [];

  for (const t of tours) {
    if (t.hasAudience) { stats.skippedHasAudience++; continue; }
    const audience: Partial<Record<Lang, string>> = {};
    const removeKeys: Record<Lang, Set<string>> = { en: new Set(), es: new Set(), ja: new Set() };
    let shapeFound = false;

    for (const lang of LANGS) {
      const body = t.body[lang];
      if (!Array.isArray(body)) continue;

      // GOOD FOR — first normal block whose text starts with a good-for label
      for (const b of body) {
        if (b._type !== 'block' || (b.style && b.style !== 'normal')) continue;
        const lab = startsWithLabel(fullText(b), GOODFOR[lang]);
        if (lab) { audience[lang] = extractAudience(fullText(b), lab); removeKeys[lang].add(b._key); break; }
      }

      // SHAPE — heading + the label rows following it
      const hi = body.findIndex((b) => (b.style === 'h2' || b.style === 'h3') && startsWithLabel(fullText(b), SHAPE_HEADING[lang]));
      if (hi !== -1) {
        shapeFound = true;
        removeKeys[lang].add(body[hi]._key);
        for (let i = hi + 1; i < body.length; i++) {
          const b = body[i];
          if (b._type === 'block' && (!b.style || b.style === 'normal') && startsWithLabel(fullText(b), SHAPE_ROW[lang])) removeKeys[lang].add(b._key);
          else break; // stop at first non-row block
        }
      }
    }

    const found = LANGS.filter((l) => audience[l]).length;
    const hasBodyGoodfor = LANGS.some((l) => Array.isArray(t.body[l]) && t.body[l]!.some((b) => startsWithLabel(fullText(b), GOODFOR[l])));
    if (!hasBodyGoodfor && !shapeFound) continue; // nothing to do

    if (found === 3) stats.goodforAll3++; else if (found > 0) stats.goodforPartial++; else stats.goodforNone++;
    if (shapeFound) stats.shapeTours++;
    if (hasBodyGoodfor && found < 3) anomalies.push(`${t.slug}: good-for found in ${found}/3 langs (${LANGS.filter((l) => audience[l]).join(',') || 'none'})`);

    plan.push({ id: t._id, slug: t.slug, found, shapeFound, audience, removeCounts: LANGS.map((l) => `${l}:${removeKeys[l].size}`).join(' '), removeKeys: { en: [...removeKeys.en], es: [...removeKeys.es], ja: [...removeKeys.ja] } });
  }

  console.log(`\n=== good-for + shape migration ===  mode: ${commit ? 'COMMIT' : 'dry-run'}`);
  console.log(`tours: ${stats.total} | skipped (already have audienceNote): ${stats.skippedHasAudience}`);
  console.log(`good-for migrated — all 3 langs: ${stats.goodforAll3} | partial: ${stats.goodforPartial} | none-extracted: ${stats.goodforNone}`);
  console.log(`shape sections removed: ${stats.shapeTours} | tours in plan: ${plan.length}`);
  if (anomalies.length) { console.log(`\n⚠ anomalies (${anomalies.length}):`); anomalies.slice(0, 20).forEach((a) => console.log('   ' + a)); }
  console.log(`\nsamples (first 3):`);
  for (const p of plan.slice(0, 3)) { console.log(`  ${p.slug} [remove ${p.removeCounts}]${p.shapeFound ? ' +shape' : ''}`); LANGS.forEach((l) => p.audience[l] && console.log(`     ${l}: ${p.audience[l].slice(0, 90)}`)); }

  writeFileSync(resolve(process.cwd(), 'scripts/.goodfor-shape-plan.json'), JSON.stringify(plan, null, 2), 'utf8');

  if (!commit) { console.log(`\nDry-run complete. Full plan → scripts/.goodfor-shape-plan.json`); return; }

  // Backup prior state, then apply.
  const backup = tours.filter((t) => plan.some((p) => p.id === t._id)).map((t) => ({ _id: t._id, body: t.body }));
  writeFileSync(resolve(process.cwd(), 'migration/goodfor-shape-backup.json'), JSON.stringify(backup, null, 2), 'utf8');

  let ok = 0;
  for (const p of plan) {
    const patch = client.patch(p.id);
    const aud = LANGS.filter((l) => p.audience[l]).map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: p.audience[l] }));
    if (aud.length) patch.set({ audienceNote: aud });
    const unsets = LANGS.flatMap((l) => (p.removeKeys[l] as string[]).map((k) => `body[_key=="${l}"].value[_key=="${k}"]`));
    if (unsets.length) patch.unset(unsets);
    await patch.commit({ visibility: 'async' });
    ok++;
  }
  console.log(`\nApplied to ${ok} tours (audienceNote set + body good-for/shape removed).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
