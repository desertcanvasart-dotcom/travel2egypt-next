import 'dotenv/config';
import { createClient } from '@sanity/client';
import { randomBytes } from 'node:crypto';

/**
 * Session 58 — Phase 3e: merge nuweiba + safaga "events" sub-pages into
 * their parent city.overview (per-locale append).
 *
 * Step A (one-shot): discard stale `drafts.wp-page-58892` (nuweiba draft
 *   that predates s57's placesToGo rebuild — publishing would silently
 *   revert that work).
 *
 * Step B/C: for each source doc, append a per-locale h2 heading block
 *   followed by the source body blocks to the parent city's `overview`
 *   array. The heading text doubles as the idempotency marker — if the
 *   EN heading is already present in the EN overview, skip the city.
 *
 * Run: node scripts/session-58-merge-events-content.mjs [--dry-run]
 */

const DRY_RUN = process.argv.includes('--dry-run');

const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_STAGING_API_WRITE_TOKEN');
  process.exit(1);
}

const client = createClient({
  projectId: 'ufallvd2',
  dataset: 'migration-staging',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

const STALE_DRAFT_ID = 'drafts.wp-page-58892';

const MERGES = [
  {
    sourceId: 'wp-page-60303',
    cityId: 'wp-page-58892',
    citySlug: 'nuweiba',
    headings: {
      en: 'Cultural Events In Nuweiba',
      es: 'Fiestas en Nuweiba',
      ja: 'ヌウェイバのお祭り',
    },
  },
  {
    sourceId: 'wp-page-75692',
    cityId: 'wp-page-58920',
    citySlug: 'safaga',
    headings: {
      en: 'Annual Events In Safaga',
      es: 'Celebracion en Safaga',
      ja: 'サファガのお祝い',
    },
  },
];

const LOCALES = ['en', 'es', 'ja'];

function key(prefix) {
  return `${prefix}-${randomBytes(6).toString('hex')}`;
}

function newKeysDeep(value) {
  // Walk the PT array, regenerate _key on every block + nested children/markDefs
  // to prevent collisions with the city.overview array's existing keys.
  if (Array.isArray(value)) return value.map(newKeysDeep);
  if (value && typeof value === 'object') {
    const out = { ...value };
    if (out._key) out._key = key('m58');
    for (const k of Object.keys(out)) {
      if (k === '_key') continue;
      out[k] = newKeysDeep(out[k]);
    }
    return out;
  }
  return value;
}

function buildHeading(locale, text) {
  return {
    _key: key('m58h'),
    _type: 'block',
    style: 'h2',
    markDefs: [],
    children: [
      {
        _key: key('s58'),
        _type: 'span',
        marks: [],
        text,
      },
    ],
  };
}

function hasHeadingMarker(overviewLocaleValue, headingText) {
  if (!Array.isArray(overviewLocaleValue)) return false;
  for (const block of overviewLocaleValue) {
    if (block?._type !== 'block') continue;
    if (block.style !== 'h2') continue;
    const text = (block.children ?? [])
      .filter((c) => c?._type === 'span' && typeof c.text === 'string')
      .map((c) => c.text)
      .join('');
    if (text.trim() === headingText.trim()) return true;
  }
  return false;
}

async function discardStaleDraft() {
  const draft = await client.fetch(`*[_id == $id][0]{_id, _updatedAt}`, { id: STALE_DRAFT_ID });
  if (!draft) {
    console.log(`[s58-merge] step A: no stale draft at ${STALE_DRAFT_ID} (already discarded or never existed)`);
    return;
  }
  console.log(`[s58-merge] step A: stale draft found at ${STALE_DRAFT_ID} (_updatedAt=${draft._updatedAt})`);
  if (DRY_RUN) {
    console.log(`[dry] would delete ${STALE_DRAFT_ID}`);
    return;
  }
  await client.delete(STALE_DRAFT_ID);
  console.log(`[s58-merge] step A: deleted ${STALE_DRAFT_ID}`);
}

async function mergeOne(plan) {
  const { sourceId, cityId, citySlug, headings } = plan;
  console.log(`\n[s58-merge] ${citySlug}: source=${sourceId} → city=${cityId}`);

  const source = await client.fetch(
    `*[_id == $id][0]{
       _id,
       body
     }`,
    { id: sourceId }
  );
  if (!source) {
    console.error(`  source ${sourceId} not found — abort`);
    process.exit(1);
  }

  const city = await client.fetch(
    `*[_id == $id][0]{_id, overview}`,
    { id: cityId }
  );
  if (!city) {
    console.error(`  city ${cityId} not found — abort`);
    process.exit(1);
  }

  // Build the next overview array per locale.
  const sourceByLocale = new Map();
  for (const entry of source.body ?? []) {
    if (!entry?._key) continue;
    sourceByLocale.set(entry._key, entry.value ?? []);
  }

  const currentByLocale = new Map();
  for (const entry of city.overview ?? []) {
    if (!entry?._key) continue;
    currentByLocale.set(entry._key, entry);
  }

  // Idempotency: if EN heading already in EN overview, skip the whole merge.
  const currentEnValue = currentByLocale.get('en')?.value ?? [];
  if (hasHeadingMarker(currentEnValue, headings.en)) {
    console.log(`  EN heading already present — skipping (idempotent no-op)`);
    return { changed: false };
  }

  const nextOverview = [];
  const localesTouched = [];
  for (const loc of LOCALES) {
    const currentEntry = currentByLocale.get(loc);
    const sourceBlocks = sourceByLocale.get(loc);
    if (!sourceBlocks || sourceBlocks.length === 0) {
      console.log(`  ${loc}: source has no body for this locale — keeping current overview as-is`);
      if (currentEntry) nextOverview.push(currentEntry);
      continue;
    }
    const headingBlock = buildHeading(loc, headings[loc]);
    const appendedBlocks = newKeysDeep(sourceBlocks);
    const baseBlocks = currentEntry?.value ?? [];
    const merged = [...baseBlocks, headingBlock, ...appendedBlocks];
    nextOverview.push({
      _key: loc,
      _type: 'object',
      value: merged,
    });
    localesTouched.push(loc);
  }

  // Preserve locales that exist in current but have no source body (loop above keeps them).
  // Also append any locales that exist in current but aren't in LOCALES (none expected; defensive).
  for (const [lk, entry] of currentByLocale) {
    if (!LOCALES.includes(lk) && !nextOverview.find((e) => e._key === lk)) {
      nextOverview.push(entry);
    }
  }

  console.log(`  appending locales: [${localesTouched.join(',')}]`);
  if (DRY_RUN) {
    console.log(`[dry] would patch ${cityId} overview (${nextOverview.length} locale entries)`);
    return { changed: true };
  }

  await client.patch(cityId).set({ overview: nextOverview }).commit();
  console.log(`  patched ${cityId}`);
  return { changed: true };
}

async function main() {
  await discardStaleDraft();
  let changed = 0;
  let skipped = 0;
  for (const plan of MERGES) {
    const r = await mergeOne(plan);
    if (r.changed) changed++;
    else skipped++;
  }
  console.log(`\n[s58-merge] summary${DRY_RUN ? ' (DRY-RUN)' : ''}: merged=${changed} skipped=${skipped}`);
}

main().catch((e) => {
  console.error(`[s58-merge] FATAL: ${e.message}`);
  process.exit(1);
});
