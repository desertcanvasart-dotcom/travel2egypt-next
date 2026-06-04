/**
 * APPLY pass for related[] population (migration-staging).
 *
 * Writes ONLY the render-eligible fields confirmed in Step 1:
 *   tour.relatedTours, hotel.relatedTours
 * SAFETY:
 *   - patches PUBLISHED docs only, whose target field is currently EMPTY
 *     (re-verified against Sanity at apply time — never overwrites existing refs);
 *   - raw @sanity/client transactions, batched; unique _key per ref;
 *   - flags any write-target that ALSO has a draft (publish-divergence risk).
 *
 * Reads the proposal from reports/related-links-proposal.json.
 * Dry-run by default; pass --commit to write. Emits reports/related-links-apply-report.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();
const COMMIT = process.argv.includes('--commit');
const BATCH = 40;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'published',
  useCdn: false,
});

const proposal = JSON.parse(readFileSync('reports/related-links-proposal.json', 'utf8'));
const ELIGIBLE = [
  { type: 'tour', field: 'relatedTours', key: 'tour_relatedTours' },
  { type: 'hotel', field: 'relatedTours', key: 'hotel_relatedTours' },
] as const;

const refKey = (targetId: string) => 'rel_' + targetId.replace(/[^A-Za-z0-9]/g, '_');

async function main() {
  console.log(`apply-related-links — ${COMMIT ? 'COMMIT' : 'DRY RUN'} — dataset=${client.config().dataset}\n`);
  const apply: any = { mode: COMMIT ? 'COMMIT' : 'DRY-RUN', backup: 'backups/migration-staging-20260605-012336.tar.gz', fields: {} };

  for (const { type, field, key } of ELIGIBLE) {
    // Re-verify emptiness against the live dataset (published perspective).
    // NB: count(undefined) is null (not 0), so an ABSENT field must be treated
    // as empty via coalesce — otherwise field-absent docs are missed.
    const emptyIds = new Set<string>(await client.fetch(`*[_type==$t && coalesce(count(${field}), 0)==0]._id`, { t: type }));
    const populatedIds = new Set<string>(await client.fetch(`*[_type==$t && count(${field})>0]._id`, { t: type }));
    const draftBaseIds = new Set<string>(
      (await client.fetch(`*[_id in path("drafts.**") && _type==$t]._id`, { t: type })).map((id: string) => id.replace(/^drafts\./, ''))
    );

    const toWrite: Array<{ id: string; title: string; refs: any[]; drafted: boolean; droppedIncidental: number }> = [];
    const skippedNonEmpty: Array<{ id: string; title: string }> = [];
    const skippedMissingDoc: string[] = [];

    for (const p of proposal.types[key].proposals) {
      const id: string = p.docId;
      if (populatedIds.has(id)) { skippedNonEmpty.push({ id, title: p.title }); continue; }
      if (!emptyIds.has(id)) { skippedMissingDoc.push(id); continue; } // not published / vanished
      const refs = p.refs.map((r: any) => ({ _type: 'reference', _ref: r.targetId, _key: refKey(r.targetId) }));
      toWrite.push({ id, title: p.title, refs, drafted: draftBaseIds.has(id), droppedIncidental: p.refs.filter((r: any) => r.droppedDest).length });
    }

    // Write in batches.
    let written = 0;
    if (COMMIT) {
      for (let i = 0; i < toWrite.length; i += BATCH) {
        const slice = toWrite.slice(i, i + BATCH);
        let tx = client.transaction();
        for (const w of slice) tx = tx.patch(w.id, (patch) => patch.set({ [field]: w.refs }));
        await tx.commit({ autoGenerateArrayKeys: false });
        written += slice.length;
        console.log(`  ${type}.${field}: wrote ${written}/${toWrite.length}`);
      }
    }

    apply.fields[key] = {
      eligible: proposal.renderEligibility[key],
      proposalCount: proposal.types[key].proposals.length,
      emptyPublishedDocs: emptyIds.size,
      wouldWrite: toWrite.length,
      written: COMMIT ? written : 0,
      skippedNonEmpty: skippedNonEmpty.length,
      skippedNonEmptyList: skippedNonEmpty,
      skippedMissingOrUnpublished: skippedMissingDoc.length,
      draftedTargets: toWrite.filter((w) => w.drafted).map((w) => ({ id: w.id, title: w.title })),
      incidentalDroppedRefs: toWrite.reduce((a, w) => a + w.droppedIncidental, 0),
      sample: toWrite.slice(0, 5).map((w) => ({ id: w.id, title: w.title, refs: w.refs.map((r: any) => r._ref) })),
    };
    console.log(`  ${type}.${field}: ${COMMIT ? 'wrote' : 'would write'} ${toWrite.length}, skipped(non-empty) ${skippedNonEmpty.length}, drafted-targets ${apply.fields[key].draftedTargets.length}`);
  }

  apply.cutoverAudit_incidentalDroppedTours = proposal.droppedPolicy?.incidentalFlags ?? [];

  // ── Apply report ──
  const md: string[] = [];
  md.push('# Related-links — APPLY report\n');
  md.push(`_Mode: **${apply.mode}**. Backup: \`${apply.backup}\`. Eligible fields only (tour.relatedTours, hotel.relatedTours). Published docs with an EMPTY field, re-verified live; existing refs never overwritten._\n`);
  for (const { key, type, field } of ELIGIBLE) {
    const f = apply.fields[key];
    md.push(`## ${type}.${field}`);
    md.push(`- render: ${f.eligible}`);
    md.push(`- empty published docs: **${f.emptyPublishedDocs}** | proposed: ${f.proposalCount} | **${COMMIT ? 'written' : 'would write'}: ${f.wouldWrite}**`);
    md.push(`- skipped (already populated — NOT overwritten): **${f.skippedNonEmpty}**`);
    md.push(`- skipped (not published / vanished): ${f.skippedMissingOrUnpublished}`);
    md.push(`- write-targets that ALSO have a draft (divergence risk): **${f.draftedTargets.length}**` + (f.draftedTargets.length ? '\n' + f.draftedTargets.map((d: any) => `  - ${d.title} (\`${d.id}\`)`).join('\n') : ''));
    md.push(`- incidental dropped-destination refs included (flagged, kept per policy): ${f.incidentalDroppedRefs}`);
    if (f.skippedNonEmptyList.length) md.push(`- already-populated (skipped): ` + f.skippedNonEmptyList.map((s: any) => `${s.title} (\`${s.id}\`)`).join('; '));
    md.push(`- sample written:\n` + f.sample.map((s: any) => `  - **${s.title}** (\`${s.id}\`) → ${s.refs.join(', ')}`).join('\n'));
    md.push('');
  }
  md.push('## Cutover audit — incidental dropped-destination tours (kept as targets)\n');
  md.push('These tours include a dropped stop (Siwa/Bahariya/Fayoum/Wadi-Natrun/Wadi-al-Gadid) as a MINORITY among otherwise-live cities, so they were kept in the target pool and flagged here for the cutover review:\n');
  for (const f of apply.cutoverAudit_incidentalDroppedTours) md.push(`- **${f.title}** (\`${f.slug}\`) — dropped stops: ${f.droppedStops.join(', ')} of ${f.totalCities} cities`);
  md.push('\n> NB: Bahariya & Fayoum are treated as dropped per this session\'s policy list, which differs from the homepage "Desert & quiet" (kept them live). Reconcile before cutover.');

  writeFileSync('reports/related-links-apply-report.md', md.join('\n'));
  writeFileSync('reports/related-links-apply-report.json', JSON.stringify(apply, null, 2));
  console.log('\nwrote reports/related-links-apply-report.{md,json}');
  if (!COMMIT) console.log('DRY RUN — re-run with --commit to write.');
}
main().catch((e) => { console.error(e); process.exit(1); });
