/**
 * image-uploader tests — content-hash cache, in-memory dedup, ref extraction.
 *
 * Uses dryRun so no real Sanity upload happens; the stub client never has
 * its assets.upload called.
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { clearMemCacheForTests, extractImageRefs, preuploadImages, uploadLocalImage } from '../image-uploader.js';
import { makeAsserter } from './_assert.js';

const FIX = join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__');
const HERO = resolve(FIX, 'content/luxor/images/valley-of-the-kings-hero.jpg');

// Stub client — assertion: never called in dry-run.
const stubClient = {
  assets: {
    upload: async (): Promise<never> => {
      throw new Error('image-uploader: should not call assets.upload in dry-run');
    },
  },
} as any;

export async function run(): Promise<boolean> {
  const { ok, eq, done } = makeAsserter('image-uploader');
  clearMemCacheForTests();

  // extractImageRefs
  {
    const md = `Body text.\n\n![alt](./images/foo.jpg)\n\n![](./images/bar.png "title")\n\n![](https://example.com/skip.jpg)\n`;
    const refs = extractImageRefs(md);
    eq(
      refs.sort(),
      ['./images/bar.png', './images/foo.jpg'],
      'refs extracted, absolute URL skipped, title segment ignored'
    );
  }

  // Dry-run upload — synthetic assetId, content-hash-stable
  {
    const a = await uploadLocalImage(HERO, stubClient, { dryRun: true });
    ok(a.assetId.startsWith('image-dryrun-'), 'dry-run assetId is synthetic');
    ok(a.filename === 'valley-of-the-kings-hero.jpg', 'filename preserved');

    const b = await uploadLocalImage(HERO, stubClient, { dryRun: true });
    eq(b.assetId, a.assetId, 'second call returns cached assetId');
  }

  // preuploadImages — happy path
  {
    clearMemCacheForTests();
    const md = `# Title\n\n![hero](./images/valley-of-the-kings-hero.jpg)\n`;
    const baseDir = resolve(FIX, 'content/luxor');
    const map = await preuploadImages(md, baseDir, stubClient, { dryRun: true });
    eq(map.size, 1, 'one image preuploaded');
    ok(map.has('./images/valley-of-the-kings-hero.jpg'), 'map keyed by relative path');
  }

  return done();
}
