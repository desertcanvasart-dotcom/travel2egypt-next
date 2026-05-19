/**
 * Writer integration tests with a mock Sanity client.
 *
 * The mock client records `fetch` queries, `transaction()` operations, and
 * `assets.upload` calls. Each test asserts on the recorded interactions
 * rather than hitting a real backend.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseFrontMatter } from '../frontmatter.js';
import { clearMemCacheForTests } from '../image-uploader.js';
import type { LocaleTriplet, ParsedFile } from '../types.js';
import { writeTriplet } from '../writer.js';
import { makeAsserter } from './_assert.js';

const FIX = join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__', 'content', 'luxor');

interface PatchOp {
  type: 'patch';
  id: string;
  set: Record<string, unknown>;
}
interface CreateOp {
  type: 'createIfNotExists';
  doc: Record<string, unknown>;
}
type RecordedOp = PatchOp | CreateOp;

function makeMockClient(opts: {
  existingDocsById?: Record<string, Record<string, unknown>>;
  cityFound?: boolean;
} = {}) {
  const docs = { ...(opts.existingDocsById ?? {}) };
  const cityFound = opts.cityFound ?? true;
  const ops: RecordedOp[] = [];
  const uploads: { filename?: string }[] = [];
  let txnCommitted = 0;
  return {
    fetch: async (query: string, params: Record<string, unknown> = {}) => {
      // parentCity lookup
      if (query.includes('_type == "city"')) {
        return cityFound ? { _id: `city-${(params as any).slug}` } : null;
      }
      // existing-doc lookup
      if (query.includes('_id == $id')) {
        return docs[(params as any).id as string] ?? null;
      }
      return null;
    },
    transaction() {
      const inner = {
        _ops: [] as RecordedOp[],
        patch(id: string, fn: (p: any) => any) {
          const setter = {
            set: (data: Record<string, unknown>) => ({ _data: data }),
          };
          const result = fn(setter);
          inner._ops.push({ type: 'patch', id, set: result._data });
          return inner;
        },
        createIfNotExists(doc: Record<string, unknown>) {
          inner._ops.push({ type: 'createIfNotExists', doc });
          return inner;
        },
        async commit() {
          txnCommitted++;
          ops.push(...inner._ops);
          inner._ops = [];
        },
      };
      return inner;
    },
    assets: {
      upload: async (_kind: string, _buf: Buffer, opts: { filename?: string } = {}) => {
        uploads.push(opts);
        return { _id: `image-mock-${uploads.length}` };
      },
    },
    _ops: () => ops,
    _uploads: () => uploads,
    _commitsCount: () => txnCommitted,
  } as any;
}

function readTripletFromFixture(): LocaleTriplet {
  const localeFiles: Partial<Record<'en' | 'es' | 'ja', ParsedFile>> = {};
  for (const loc of ['en', 'es', 'ja'] as const) {
    const path = join(FIX, `valley-of-the-kings.${loc}.md`);
    const parsed = parseFrontMatter(path, readFileSync(path, 'utf8'), {
      city: 'luxor',
      slug: 'valley-of-the-kings',
      locale: loc,
    });
    localeFiles[loc] = { filePath: path, fm: parsed.fm!, body: parsed.body };
  }
  return { city: 'luxor', slug: 'valley-of-the-kings', files: localeFiles };
}

export async function run(): Promise<boolean> {
const { ok, eq, done } = makeAsserter('writer');

// Create path — existing doc absent
{
  clearMemCacheForTests();
  const client = makeMockClient();
  const triplet = readTripletFromFixture();
  const wr = await writeTriplet(triplet, { client, dryRun: false });
  eq(wr.created, true, 'created when no existing doc');
  eq(wr.noop, false, 'create is not a no-op');
  eq(wr._id, 'guideArticle.luxor.valley-of-the-kings', 'deterministic _id');
  eq(wr.section, 'places-to-go', 'section derived from kind=attraction');
  eq(wr.locales.sort(), ['en', 'es', 'ja'], 'all three locales authored');
  const ops = client._ops();
  eq(ops.length, 1, 'one operation: createIfNotExists');
  eq(ops[0].type, 'createIfNotExists', 'op type is createIfNotExists');
}

// Idempotency — second run with no changes is a no-op
{
  clearMemCacheForTests();
  // Seed mock with the doc the first run would have created.
  const seed = makeMockClient();
  const triplet = readTripletFromFixture();
  const firstRun = await writeTriplet(triplet, { client: seed, dryRun: false });

  const client = makeMockClient({
    existingDocsById: { [firstRun._id]: firstRun.resultDoc as Record<string, unknown> },
  });
  const wr = await writeTriplet(triplet, { client, dryRun: false });
  eq(wr.noop, true, 'second run with no changes is noop');
  eq(client._ops().length, 0, 'no transaction committed for noop');
}

// Patch path — existing doc with EN only, importing ES new locale should not destroy EN
{
  clearMemCacheForTests();
  const triplet = readTripletFromFixture();
  // Build a "before" doc with only EN.
  const seedClient = makeMockClient();
  const enOnly: LocaleTriplet = {
    city: triplet.city,
    slug: triplet.slug,
    files: { en: triplet.files.en! },
  };
  const created = await writeTriplet(enOnly, { client: seedClient, dryRun: false });

  // Now run the full trilingual import against a client that has the EN-only doc.
  const client = makeMockClient({
    existingDocsById: { [created._id]: created.resultDoc as Record<string, unknown> },
  });
  const wr = await writeTriplet(triplet, { client, dryRun: false });
  eq(wr.created, false, 'subsequent run does not create');
  eq(wr.noop, false, 'adding ES+JA is not noop');

  const titleEntries = (wr.resultDoc.title as Array<{ _key: string; value: string }>).map((e) => e._key).sort();
  eq(titleEntries, ['en', 'es', 'ja'], 'title array contains all three locales after ES+JA add');
  // The EN entry must be preserved (s44 lesson).
  const enTitle = (wr.resultDoc.title as Array<{ _key: string; value: string }>).find((e) => e._key === 'en');
  eq(enTitle?.value, 'Valley of the Kings', 'EN title preserved when adding ES+JA');

  const ops = client._ops();
  eq(ops.length, 1, 'one patch operation');
  eq(ops[0].type, 'patch', 'op is a patch (existing doc)');
}

// City-not-found path — writer throws
{
  clearMemCacheForTests();
  const client = makeMockClient({ cityFound: false });
  const triplet = readTripletFromFixture();
  let threw = false;
  let msg = '';
  try {
    await writeTriplet(triplet, { client, dryRun: false });
  } catch (e) {
    threw = true;
    msg = (e as Error).message;
  }
  ok(threw, 'writer throws on missing city');
  ok(msg.includes('not found in Sanity'), 'error mentions missing city');
}

// Dry-run path — no transactions, no asset uploads
{
  clearMemCacheForTests();
  const client = makeMockClient();
  const triplet = readTripletFromFixture();
  const wr = await writeTriplet(triplet, { client, dryRun: true });
  eq(wr.created, true, 'dry-run still reports would-create');
  eq(client._commitsCount(), 0, 'dry-run sends no transactions');
  eq(client._uploads().length, 0, 'dry-run uploads no assets');
  ok(wr.uploads.length > 0, 'dry-run still records simulated uploads (for visibility)');
  ok(
    wr.uploads.every((u) => u.assetId.startsWith('image-dryrun-')),
    'dry-run upload entries carry synthetic assetIds'
  );
}

return done();
}
