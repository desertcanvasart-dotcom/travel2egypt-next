/**
 * Journey publish-gap classifier (C1).
 *
 * For every DRAFT `tour` doc in `production`, diff it against its published
 * counterpart and bucket it so we only auto-publish the safe ones:
 *
 *   HERO_ONLY   — the ONLY top-level field that differs from published is
 *                 `heroImage` (surfacing a stuck hero). Safe to publish.
 *   IDENTICAL   — draft == published on every non-system field (a stale draft).
 *                 Safe to publish (clears the draft) — a no-op to the live page.
 *   OWNER_EDITED— other content fields differ (title/summary/days/price/…). The
 *                 owner is mid-editing; DO NOT auto-publish. Report for review.
 *   NEW_DRAFT   — no published counterpart exists. Publishing would surface a
 *                 tour that has never been live; NOT auto-published (may be
 *                 deliberately unpublished, e.g. re-titled day-tour drafts).
 *
 * Read-only by default: writes a report to docs/ and a machine-readable JSON of
 * the safe id-set. Pass `--apply` to publish the safe set (HERO_ONLY + IDENTICAL)
 * after backing every affected doc up to backups/.
 *
 * Run (classify):  npx tsx scripts/journey-publish-gap-classify.ts
 * Run (publish):   npx tsx scripts/journey-publish-gap-classify.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync } from 'node:fs';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = 'production'; // C1 targets the LIVE dataset explicitly
const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or a production write token');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
// Discard mode: back up + delete the residual drafts that will never be
// published — NEW_DRAFT (dedup-superseded duplicates) + IDENTICAL (stale). The
// OWNER_EDITED WIP and any HERO_ONLY are NEVER discarded.
const DISCARD = process.argv.includes('--discard');
const STAMP = '2026-07-08';
const client = createClient({ projectId, dataset, apiVersion: '2024-12-01', token, useCdn: false });

// Any top-level key starting with `_` is Sanity system/API metadata
// (_id, _rev, _type, _createdAt, _updatedAt, _system{base:{id,rev}}, …).
// Content fields never start with `_`, so exclude the whole prefix.
const isSystemKey = (k: string) => k.startsWith('_');

/** Recursively sort arrays of {_key} objects by _key so ordering !== a diff. */
function normalize(v: unknown): unknown {
  if (Array.isArray(v)) {
    const mapped = v.map(normalize);
    if (mapped.every((x) => x && typeof x === 'object' && '_key' in (x as object))) {
      return [...mapped].sort((a, b) =>
        String((a as { _key: string })._key).localeCompare(String((b as { _key: string })._key)),
      );
    }
    return mapped;
  }
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) out[k] = normalize((v as Record<string, unknown>)[k]);
    return out;
  }
  return v;
}

function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

/** Top-level content keys that differ between two docs (excluding system keys). */
function diffKeys(draft: Record<string, unknown>, pub: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(draft), ...Object.keys(pub)].filter((k) => !isSystemKey(k)));
  return [...keys].filter((k) => !eq(draft[k], pub[k])).sort();
}

type Bucket = 'HERO_ONLY' | 'IDENTICAL' | 'OWNER_EDITED' | 'NEW_DRAFT';
interface Row {
  pubId: string;
  bucket: Bucket;
  title: string;
  hasDraftHero: boolean;
  hasPubHero: boolean;
  diff: string[];
}

async function main() {
  const drafts: Record<string, unknown>[] = await client.fetch(
    `*[_type=="tour" && _id in path("drafts.**")]`,
  );
  console.log(`Fetched ${drafts.length} draft tours from ${dataset}.`);

  const rows: Row[] = [];
  for (const draft of drafts) {
    const draftId = draft._id as string;
    const pubId = draftId.replace(/^drafts\./, '');
    const pub: Record<string, unknown> | null = await client.fetch(`*[_id == $id][0]`, { id: pubId });
    const title =
      ((draft.title as { _key: string; value: string }[] | undefined)?.find((t) => t._key === 'en')
        ?.value ?? pubId);
    const hasDraftHero = Boolean((draft.heroImage as { asset?: { _ref?: string } } | undefined)?.asset?._ref);
    const hasPubHero = Boolean((pub?.heroImage as { asset?: { _ref?: string } } | undefined)?.asset?._ref);

    let bucket: Bucket;
    let diff: string[] = [];
    if (!pub) {
      bucket = 'NEW_DRAFT';
    } else {
      diff = diffKeys(draft, pub);
      if (diff.length === 0) bucket = 'IDENTICAL';
      else if (diff.length === 1 && diff[0] === 'heroImage') bucket = 'HERO_ONLY';
      else bucket = 'OWNER_EDITED';
    }
    rows.push({ pubId, bucket, title, hasDraftHero, hasPubHero, diff });
  }

  const by = (b: Bucket) => rows.filter((r) => r.bucket === b);
  const safe = [...by('HERO_ONLY'), ...by('IDENTICAL')];

  // ── report ──────────────────────────────────────────────────────────────
  const lines: string[] = [];
  lines.push(`# Journey publish-gap classification (${dataset}, ${STAMP})`);
  lines.push('');
  lines.push(`Total draft tours: **${rows.length}**`);
  lines.push(`- HERO_ONLY (safe): **${by('HERO_ONLY').length}**`);
  lines.push(`- IDENTICAL / stale draft (safe): **${by('IDENTICAL').length}**`);
  lines.push(`- OWNER_EDITED (leave for owner): **${by('OWNER_EDITED').length}**`);
  lines.push(`- NEW_DRAFT (no published counterpart): **${by('NEW_DRAFT').length}**`);
  lines.push('');
  for (const b of ['HERO_ONLY', 'IDENTICAL', 'OWNER_EDITED', 'NEW_DRAFT'] as Bucket[]) {
    const set = by(b);
    if (!set.length) continue;
    lines.push(`## ${b} (${set.length})`);
    lines.push('| pubId | title | draftHero | pubHero | differing fields |');
    lines.push('|---|---|:-:|:-:|---|');
    for (const r of set) {
      lines.push(
        `| ${r.pubId} | ${r.title.replace(/\|/g, '\\|')} | ${r.hasDraftHero ? '✓' : '–'} | ${r.hasPubHero ? '✓' : '–'} | ${r.diff.join(', ') || '—'} |`,
      );
    }
    lines.push('');
  }
  mkdirSync('docs', { recursive: true });
  const reportPath = `docs/journey-publish-gap-${STAMP}.md`;
  writeFileSync(reportPath, lines.join('\n'));
  writeFileSync(
    `docs/journey-publish-gap-${STAMP}.json`,
    JSON.stringify({ safe: safe.map((r) => r.pubId), rows }, null, 2),
  );
  console.log(`\nReport → ${reportPath}`);
  console.log(
    `HERO_ONLY=${by('HERO_ONLY').length} IDENTICAL=${by('IDENTICAL').length} OWNER_EDITED=${by('OWNER_EDITED').length} NEW_DRAFT=${by('NEW_DRAFT').length}`,
  );

  // ── discard: back up, then delete the residual drafts ────────────────────
  if (DISCARD) {
    const toDiscard = [...by('NEW_DRAFT'), ...by('IDENTICAL')];
    // Hard safety: never discard an owner-edited or hero-only draft.
    const forbidden = toDiscard.filter((r) => r.bucket !== 'NEW_DRAFT' && r.bucket !== 'IDENTICAL');
    if (forbidden.length) throw new Error(`refusing: non-residual in discard set: ${forbidden.map((r) => r.pubId).join(', ')}`);
    mkdirSync('backups', { recursive: true });
    const dbackup: Record<string, unknown> = {};
    for (const r of toDiscard) {
      dbackup[r.pubId] = {
        bucket: r.bucket,
        draftBefore: await client.fetch(`*[_id == $id][0]`, { id: `drafts.${r.pubId}` }),
        publishedBefore: await client.fetch(`*[_id == $id][0]`, { id: r.pubId }),
      };
    }
    const dpath = `backups/journey-discard-rollback-${STAMP}.json`;
    writeFileSync(dpath, JSON.stringify(dbackup, null, 2));
    console.log(`Backup → ${dpath} (${toDiscard.length} drafts)`);

    let discarded = 0;
    for (const r of toDiscard) {
      await client.delete(`drafts.${r.pubId}`);
      discarded += 1;
      console.log(`✗ drafts.${r.pubId}: discarded (${r.bucket})`);
    }
    console.log(`\nDiscarded ${discarded}/${toDiscard.length} residual drafts. Rollback: ${dpath}`);
    console.log(`Left untouched: ${by('OWNER_EDITED').length} OWNER_EDITED + ${by('HERO_ONLY').length} HERO_ONLY.`);
    return;
  }

  if (!APPLY) {
    console.log(`\nDry run. --discard to remove ${by('NEW_DRAFT').length + by('IDENTICAL').length} residual drafts; --apply to publish ${safe.length} safe drafts.`);
    return;
  }

  // ── apply: back up, then publish the safe set ─────────────────────────────
  mkdirSync('backups', { recursive: true });
  const backup: Record<string, unknown> = {};
  for (const r of safe) {
    backup[r.pubId] = {
      publishedBefore: await client.fetch(`*[_id == $id][0]`, { id: r.pubId }),
      draftBefore: await client.fetch(`*[_id == $id][0]`, { id: `drafts.${r.pubId}` }),
    };
  }
  const backupPath = `backups/journey-publish-gap-rollback-${STAMP}.json`;
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup → ${backupPath} (${safe.length} docs)`);

  let published = 0;
  for (const r of safe) {
    const draft: Record<string, unknown> = await client.fetch(`*[_id == $id][0]`, {
      id: `drafts.${r.pubId}`,
    });
    if (!draft) {
      console.log(`– ${r.pubId}: draft vanished, skipping`);
      continue;
    }
    const published_doc = { ...draft, _id: r.pubId };
    delete (published_doc as { _rev?: string })._rev;
    await client.createOrReplace(published_doc as { _id: string; _type: string });
    await client.delete(`drafts.${r.pubId}`);
    published += 1;
    console.log(`✓ ${r.pubId}: published (${r.bucket})`);
  }
  console.log(`\nPublished ${published}/${safe.length}. Rollback artifact: ${backupPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
