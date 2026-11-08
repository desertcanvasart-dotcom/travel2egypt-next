/**
 * FAQ migration import — legacy /egypt-travel-faqs/ → faqEntry DRAFTS (s48, 2026-08-19).
 *
 * Source: migration/faq-migration-source-2026-08-19.json (owner-supplied,
 * extracted+audited from the legacy WP page; 71 rewritten Q&As in 2 waves).
 * Companion notes: migration/faq-migration-notes-2026-08-19.md.
 *
 * What it does:
 *  - Skips the 16 questions that OVERLAP an existing published faqEntry
 *    (live answers are owner-approved; upgrades are an owner call — see the
 *    generated report).
 *  - Creates the remaining 55 as DRAFT faqEntry docs (EN, matching the
 *    existing corpus, which is EN-only). Nothing goes live: the /faq page
 *    reads the published perspective, so the site is untouched until the
 *    owner publishes from the Studio.
 *  - Wave-1 categories map onto the four existing site categories; the five
 *    axes with no live equivalent (Getting Around + the four Wave-2 ones)
 *    are created as DRAFT faqCategory docs, orderRank 8–12.
 *  - Answers import as plain paragraphs (split on blank lines) with NO
 *    embedded links — matching every existing entry, and leaving linking to
 *    the site's idempotent mention-linker weave. The source's per-question
 *    internalLink hints are preserved in the report for that session.
 *  - The 15 needsReview ("VERIFY") items import as drafts like the rest but
 *    are listed prominently in the report: they need a fact-check BEFORE
 *    publishing (the source doc's own instruction).
 *
 * Idempotent: a doc whose draft or published ID already exists is skipped.
 * Rollback: delete the IDs listed in migration/faq-import-created-<date>.json.
 *
 *   Dry run (default): npx tsx scripts/import-faq-migration.ts
 *   Apply:             npx tsx scripts/import-faq-migration.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const STAMP = '2026-08-19';

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

// ── Overlaps: migration _key → live published faqEntry id (skip; report) ──
const OVERLAP: Record<string, string> = {
  'when-is-the-best-time-to-visit-egypt': 'faq-entry-when-is-the-best-time-to-visit-egypt',
  'do-i-need-a-visa-to-travel-to-egypt': 'faq-entry-do-i-need-a-visa-for-egypt',
  'how-much-should-i-budget-per-day': 'faq-entry-how-much-should-i-budget-per-day',
  'what-currency-is-used-in-egypt': 'faq-entry-what-currency-does-egypt-use',
  'can-i-use-credit-cards-throughout-egypt': 'faq-entry-are-credit-cards-accepted-everywhere',
  'how-does-tipping-work-in-egypt': 'faq-entry-how-does-tipping-work-in-egypt',
  'can-i-get-a-local-sim-card-easily': 'faq-entry-can-i-get-a-sim-card-in-egypt',
  'what-time-zone-is-egypt-in': 'faq-entry-what-time-zone-is-egypt',
  'is-it-safe-to-travel-to-egypt-right-now': 'faq-entry-is-egypt-safe-to-travel-right-now',
  'what-vaccinations-do-i-need-for-egypt': 'faq-entry-what-vaccinations-do-i-need-for-egypt',
  'can-i-drink-the-tap-water-in-egypt': 'faq-entry-can-i-drink-the-tap-water-in-egypt',
  'how-do-i-avoid-tourist-scams-in-egypt': 'faq-entry-how-do-i-avoid-tourist-scams',
  'are-there-restrictions-on-photography': 'faq-entry-are-there-restrictions-on-photography',
  'whats-the-dress-code-for-mosques-and-religious-sites': 'faq-entry-whats-the-dress-code',
  'is-english-widely-spoken-in-egypt': 'faq-entry-how-widely-is-english-spoken',
  'what-arabic-phrases-are-worth-knowing': 'faq-entry-what-are-some-useful-arabic-phrases',
};

// ── Category mapping: migration slug → live category id (existing or new) ──
const CATEGORY_MAP: Record<string, { id: string; isNew?: boolean; name?: string; rank?: number }> = {
  'planning-and-entry': { id: 'faq-category-planning-your-visit' },
  'money-connectivity-and-practicalities': { id: 'faq-category-money-and-payments' },
  'safety-and-health': { id: 'faq-category-health-and-safety' },
  'culture-and-etiquette': { id: 'faq-category-culture-and-language' },
  'getting-around': { id: 'faq-category-getting-around', isNew: true, name: 'Getting Around', rank: 8 },
  museums: { id: 'faq-category-museums', isNew: true, name: 'Museums', rank: 9 },
  'ancient-sites': { id: 'faq-category-ancient-sites', isNew: true, name: 'Ancient Sites', rank: 10 },
  'red-sea-and-outdoors': { id: 'faq-category-red-sea-and-outdoors', isNew: true, name: 'Red Sea & Outdoors', rank: 11 },
  'food-markets-and-living-culture': { id: 'faq-category-food-markets-and-living-culture', isNew: true, name: 'Food, Markets & Living Culture', rank: 12 },
};

interface MigFaq {
  _key: string;
  question: string;
  answer: string;
  internalLink?: string;
  status?: string;
  needsReview?: boolean;
}

function answerBlocks(key: string, answer: string) {
  return answer
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => ({
      _type: 'block',
      _key: `${key.slice(0, 24)}b${i}`,
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: `${key.slice(0, 24)}s${i}`, marks: [], text: p }],
    }));
}

async function main() {
  console.log(`\n=== FAQ migration import — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const src = JSON.parse(
    readFileSync(path.join(process.cwd(), 'migration/faq-migration-source-2026-08-19.json'), 'utf8')
  );

  const existingIds = new Set<string>(
    await c.fetch(`*[_type in ["faqEntry","faqCategory"]]._id`)
  );
  const existingDrafts = new Set<string>(
    await c.fetch(`*[_id in path("drafts.**") && _type in ["faqEntry","faqCategory"]]._id`)
  );
  const has = (id: string) => existingIds.has(id) || existingDrafts.has(`drafts.${id}`);

  const created: string[] = [];
  const skippedOverlap: Array<{ key: string; liveId: string; question: string }> = [];
  const needsReview: Array<{ id: string; question: string; status: string }> = [];
  const linkHints: Array<{ id: string; question: string; hint: string }> = [];
  let already = 0;

  // 1. New draft categories.
  console.log('— Categories —');
  for (const conf of Object.values(CATEGORY_MAP)) {
    if (!conf.isNew) continue;
    if (has(conf.id)) { console.log(`  • DONE  ${conf.id} already exists`); already++; continue; }
    const slug = conf.id.replace('faq-category-', '');
    console.log(`  ✓ DRAFT ${conf.id} — "${conf.name}" (rank ${conf.rank})`);
    if (APPLY) {
      await c.create({
        _id: `drafts.${conf.id}`,
        _type: 'faqCategory',
        name: [{ _key: 'en', value: conf.name! }],
        slug: [{ _key: 'en', value: { _type: 'slug', current: slug } }],
        orderRank: conf.rank,
      });
    }
    created.push(`drafts.${conf.id}`);
  }

  // 2. Entries.
  console.log('\n— Entries —');
  for (const wave of src.waves) {
    for (const cat of wave.categories) {
      const catConf = CATEGORY_MAP[cat.slug];
      if (!catConf) { console.log(`  ✗ SKIP category ${cat.slug} — no mapping`); continue; }
      let rank = 100;
      for (const f of cat.faqs as MigFaq[]) {
        const id = `faq-entry-${f._key}`;
        if (OVERLAP[f._key]) {
          skippedOverlap.push({ key: f._key, liveId: OVERLAP[f._key], question: f.question });
          continue;
        }
        if (has(id)) { console.log(`  • DONE  ${id} already exists`); already++; continue; }
        console.log(`  ✓ DRAFT ${id}${f.needsReview ? '  ⚠ needsReview' : ''}`);
        if (APPLY) {
          await c.create({
            _id: `drafts.${id}`,
            _type: 'faqEntry',
            question: [{ _key: 'en', value: f.question }],
            answer: [{ _key: 'en', value: answerBlocks(f._key, f.answer) }],
            // Weak ref when the target category itself is still a draft —
            // a strong ref fails referential validation until the category
            // publishes (same ordering problem the food-section import hit).
            category: { _type: 'reference', _ref: catConf.id, ...(catConf.isNew ? { _weak: true } : {}) },
            orderRank: rank,
          });
        }
        created.push(`drafts.${id}`);
        rank += 10;
        if (f.needsReview) needsReview.push({ id, question: f.question, status: f.status ?? '' });
        if (f.internalLink) linkHints.push({ id, question: f.question, hint: f.internalLink });
      }
    }
  }

  // 3. Rollback ledger — recomputed from the dataset so it covers docs
  //    created by EARLIER partial runs too, not just this invocation.
  if (APPLY) {
    const allPlanned = [
      ...Object.values(CATEGORY_MAP).filter((x) => x.isNew).map((x) => `drafts.${x.id}`),
      ...src.waves.flatMap((w: any) => w.categories.flatMap((cat: any) =>
        (cat.faqs as MigFaq[]).filter((f) => !OVERLAP[f._key]).map((f) => `drafts.faq-entry-${f._key}`))),
    ];
    const present: string[] = await c.fetch(`*[_id in $ids]._id`, { ids: allPlanned });
    const ledgerPath = path.join(process.cwd(), `migration/faq-import-created-${STAMP}.json`);
    writeFileSync(ledgerPath, JSON.stringify({ created: present, skippedOverlap, needsReview, linkHints }, null, 2));
    console.log(`\nLedger (${present.length} import-created drafts) → ${path.relative(process.cwd(), ledgerPath)}`);
  }

  console.log(`\n${APPLY ? 'Applied' : 'Dry run'}: ${created.length} drafts to create, ${skippedOverlap.length} overlaps skipped, ${already} already present.`);
  console.log(`needsReview (fact-check before publishing): ${needsReview.length}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
