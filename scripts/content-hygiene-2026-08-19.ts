/**
 * Content-hygiene batch 2026-08-19 (owner: "go do what you can do") — the
 * three surviving items with defined fixes and no pending owner decision:
 *
 * 1. B5 (s47 checklist): the privacy policy's rights-channel line reads
 *    "Web: https://travel2egypt.org/contact-us" ×3 locales — /contact-us is
 *    301-covered site-side, but the stated channel should name the real
 *    URL. Text → ".../contact" (span edit, guarded on exact current text).
 *
 * 2. Sandrose (wp-page-131814) summaries carry WP breadcrumb junk prefixes
 *    ("Home Facts About The Hotel " / "Home Hechos Sobre el Hotel ") —
 *    strip the prefix, keep the rest verbatim. (JA summary was authored
 *    clean this week; this aligns EN/ES structurally.)
 *
 * 3. Cosmetic: the EN cookie-policy "Clear the cookies" bullet is one
 *    all-bold span, unlike its siblings (bold lead + plain rest). Split
 *    into two spans at the sentence boundary — text byte-identical.
 *
 * Verified stale (NO ACTION, ledger to be corrected): Kharga JA slug
 * (already haruga-oashisu-no-kiko), Edfu ES slug (already
 * donde-alojarse-en-edfu + redirect), Beni Suef DOCTYPE junk (already
 * gone), Esna 55/60km contradiction (doc now says 55 everywhere).
 * Still blocked (NO ACTION): wp-page-60426 / wp-page-75799 flagged-link
 * removal — their pre-existing drafts remain.
 *
 *   Dry run (default): npx tsx scripts/content-hygiene-2026-08-19.ts
 *   Apply:             npx tsx scripts/content-hygiene-2026-08-19.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync } from 'node:fs';
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

async function main() {
  console.log(`\n=== Content hygiene — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);
  const ids = ['legal-privacy-policy', 'wp-page-131814', 'legal-cookie-policy'];
  const drafts = await c.fetch<string[]>(`*[_id in $ids]._id`, { ids: ids.map((i) => `drafts.${i}`) });
  if (drafts.length) throw new Error(`drafts exist: ${drafts.join(', ')}`);
  const backup = await c.fetch(`*[_id in $ids]`, { ids });
  mkdirSync('backups', { recursive: true });
  const backupPath = path.join('backups', 'content-hygiene-rollback-2026-08-19.json');
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup of ${backup.length} docs → ${backupPath}\n`);

  // ── 1. privacy policy contact line ×3 ──
  for (const [loc, from, to] of [
    ['en', 'Web: https://travel2egypt.org/contact-us', 'Web: https://travel2egypt.org/contact'],
    ['es', 'Web: https://travel2egypt.org/contact-us', 'Web: https://travel2egypt.org/contact'],
    ['ja', 'ウェブ：https://travel2egypt.org/contact-us', 'ウェブ：https://travel2egypt.org/contact'],
  ] as const) {
    const spans = await c.fetch(
      `*[_id=='legal-privacy-policy'][0].body[_key==$loc][0].value[_key=='44a660f43639'][0].children`,
      { loc }
    );
    const idx = (spans ?? []).findIndex((s: any) => s.text === from);
    if (idx === -1) {
      const already = (spans ?? []).some((s: any) => s.text === to);
      console.log(already ? `  • DONE privacy [${loc}]` : `  ✗ SKIP privacy [${loc}] — text drifted`);
      continue;
    }
    console.log(`  ✓ privacy [${loc}]: "${from}" → "${to}"`);
    if (APPLY) {
      await c
        .patch('legal-privacy-policy')
        .set({ [`body[_key=="${loc}"].value[_key=="44a660f43639"].children[_key=="${spans[idx]._key}"].text`]: to })
        .commit({ autoGenerateArrayKeys: false });
    }
  }

  // ── 2. Sandrose summary prefixes ──
  for (const [loc, prefix] of [
    ['en', 'Home Facts About The Hotel '],
    ['es', 'Home Hechos Sobre el Hotel '],
  ] as const) {
    const cur = await c.fetch(`*[_id=='wp-page-131814'][0].summary[_key==$loc][0].value`, { loc });
    if (typeof cur !== 'string' || !cur.startsWith(prefix)) {
      console.log(`  • DONE/SKIP sandrose summary [${loc}] — no junk prefix`);
      continue;
    }
    console.log(`  ✓ sandrose summary [${loc}]: strip "${prefix}"`);
    if (APPLY) {
      await c
        .patch('wp-page-131814')
        .set({ [`summary[_key=="${loc}"].value`]: cur.slice(prefix.length) })
        .commit({ autoGenerateArrayKeys: false });
    }
  }

  // ── 3. cookie bullet span split (text byte-identical) ──
  const LEAD = 'Clear the cookies.';
  const bullet = await c.fetch(
    `*[_id=='legal-cookie-policy'][0].body[_key=='en'][0].value[_key=='cef0c133a5b0'][0].children`
  );
  if (bullet?.length === 1 && bullet[0].marks?.includes('strong') && bullet[0].text.startsWith(LEAD)) {
    const rest = bullet[0].text.slice(LEAD.length);
    console.log(`  ✓ cookie bullet: split into strong "${LEAD}" + plain "${rest.slice(0, 40)}…"`);
    if (APPLY) {
      await c
        .patch('legal-cookie-policy')
        .set({
          'body[_key=="en"].value[_key=="cef0c133a5b0"].children': [
            { _type: 'span', _key: 'dd0fb3fe30dc', marks: ['strong'], text: LEAD },
            { _type: 'span', _key: 'dd0fb3fe30d2', marks: [], text: rest },
          ],
        })
        .commit({ autoGenerateArrayKeys: false });
    }
  } else {
    console.log('  • DONE/SKIP cookie bullet — not the single-strong-span shape');
  }

  console.log(`\n${APPLY ? 'Applied.' : 'Dry run complete.'}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
