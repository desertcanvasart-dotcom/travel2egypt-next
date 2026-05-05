/**
 * Tests for the upload-error retry classifier and the upload-exhaustion
 * soft-fail behavior in scripts/wp-import/media.ts.
 *
 * Triad per methodology lesson 9:
 *   (a) Unit — `isTransientUploadError` classifier on representative error
 *       message strings (Node socket codes, HTTP 502/503/504, "upstream"
 *       wording, auth/validation, default-fail-closed).
 *   (b) Integration — `ensureAssetUploaded` against a Sanity-client mock that
 *       rejects permanently with the canonical Phase 4 trigger ("An invalid
 *       response was received from the upstream server"). Asserts the function
 *       reaches the 5-attempt retry cap, then soft-fails with `null` (rather
 *       than the pre-fix `throw`), and records an `UPLOAD_EXHAUSTED` registry
 *       entry for editorial triage.
 *   (c) Regression-guard — direct assertion that the verbatim Phase 4 trigger
 *       string classifies as transient (Fix 1) and exhausts to null (Fix 2).
 *
 * Phase 4 history: importer FATAL'd on entity wpId=58650 slug=explore-al-minya-tours
 * after a Sanity asset POST returned `"An invalid response was received from
 * the upstream server"`. The pre-fix classifier matched only Node socket
 * errors, classified the upstream-server message non-transient, exhausted at
 * attempts=1, and threw — bubbling through `handleEntityError` to the
 * importer's outer catch as FATAL. Sub-phase 4r-2 (this file) introduces
 * Fix 1 (widened classifier covering 502/503/504/upstream) and Fix 2 (return
 * null instead of throw on exhaustion). These tests gate both.
 *
 * Run via: `npm run test:media`. Self-running; non-zero exit on first
 * failure, mirroring scripts/wp-import/__tests__/merge-dispatch.test.ts.
 */

import { existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ensureAssetUploaded,
  getUploadExhausted,
  isTransientUploadError,
} from '../media.js';
import type { WpClient } from '../wp-client.js';

let pass = 0;
let fail = 0;

function assert(cond: unknown, msg: string): void {
  if (cond) {
    pass++;
  } else {
    fail++;
    process.stderr.write(`✗ ${msg}\n`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    pass++;
  } else {
    fail++;
    process.stderr.write(`✗ ${msg}\n  actual:   ${a}\n  expected: ${b}\n`);
  }
}

// ─── Group (a): classifier unit tests ───────────────────────────────────

function runClassifierUnit(): void {
  // Existing transient patterns preserved (Node socket / DNS).
  assertEqual(isTransientUploadError(new Error('socket ECONNRESET on PUT')), true,
    'a1: ECONNRESET → transient');
  assertEqual(isTransientUploadError(new Error('connect ETIMEDOUT 1.2.3.4:443')), true,
    'a2: ETIMEDOUT → transient');

  // Phase 4 regression: upstream-server wording must be transient.
  assertEqual(
    isTransientUploadError(new Error('An invalid response was received from the upstream server')),
    true,
    'a3: upstream-server message → transient (Phase 4 trigger)'
  );

  // HTTP gateway/upstream status codes.
  assertEqual(isTransientUploadError(new Error('502 Bad Gateway')), true,
    'a4: 502 Bad Gateway → transient');
  assertEqual(isTransientUploadError(new Error('503 Service Unavailable')), true,
    'a5: 503 → transient');
  assertEqual(isTransientUploadError(new Error('Server returned 504 Gateway Timeout')), true,
    'a6: 504 → transient');

  // Permanent: auth + validation. These must NOT trigger retries.
  assertEqual(isTransientUploadError(new Error('401 Unauthorized: invalid token')), false,
    'a7: 401 auth → permanent');
  assertEqual(isTransientUploadError(new Error('400 Bad Request: invalid file type')), false,
    'a8: 400 validation → permanent');

  // Default fail-closed: unknown error wording stays permanent (loud-failure
  // ethos preserved — only the curated transient list retries).
  assertEqual(isTransientUploadError(new Error('Some completely unrelated thing exploded')), false,
    'a9: unmatched message → permanent (default fail-closed)');

  // Boundary check: 501 / 505 are NOT in the gateway/upstream set; they stay
  // permanent so the regex doesn't over-match (\b50[234]\b matches 502/503/504
  // exactly, not 501 / 505).
  assertEqual(isTransientUploadError(new Error('501 Not Implemented')), false,
    'a10: 501 → permanent (boundary — not 502/503/504)');
}

// ─── Group (b): integration — soft-fail end-to-end ──────────────────────

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CACHE_DIR = join(ROOT, 'migration/.cache/media');

/** wpId range guaranteed not to clash with real WP attachments (max real id
 *  in WP corpus is well under 1M; pick a 9-digit space far above). */
const TEST_WP_ID = 990000042;

function makeMockSanityClient(behavior: 'always-fail-upstream') {
  let attempts = 0;
  return {
    client: {
      assets: {
        upload: async (_kind: string, _buf: Buffer, _opts: unknown) => {
          attempts++;
          if (behavior === 'always-fail-upstream') {
            throw new Error('An invalid response was received from the upstream server');
          }
          return { _id: 'image-mock-success' };
        },
      },
    },
    getAttempts: () => attempts,
  };
}

function makeMockWpClient(): WpClient {
  // Minimal surface — only the methods ensureAssetUploaded touches.
  const wp = {
    getJson: async (_path: string, _opts?: unknown): Promise<unknown> => ({
      id: TEST_WP_ID,
      source_url: `https://example.test/wp-content/uploads/2024/01/test-${TEST_WP_ID}.jpg`,
      media_details: {
        file: `2024/01/test-${TEST_WP_ID}.jpg`,
        sizes: {
          full: {
            source_url: `https://example.test/wp-content/uploads/2024/01/test-${TEST_WP_ID}.jpg`,
          },
        },
      },
    }),
    getBinary: async (_url: string) => ({
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/jpeg',
    }),
  } as unknown as WpClient;
  return wp;
}

async function runIntegrationSoftFail(): Promise<void> {
  // Pre-test cleanup: ensure no stale cache for our test wpId so the function
  // proceeds past the cache short-circuit.
  const cachePath = join(CACHE_DIR, `${TEST_WP_ID}.json`);
  if (existsSync(cachePath)) unlinkSync(cachePath);

  // Override setTimeout to fast-forward exponential backoff (2+4+8+16=30s
  // real-time → ~0ms in the test). We restore on exit.
  const realSetTimeout = globalThis.setTimeout;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).setTimeout = ((cb: () => void, _ms?: number) => {
    return realSetTimeout(cb, 0);
  }) as typeof globalThis.setTimeout;

  const exhaustedBefore = getUploadExhausted().length;

  let result: { assetId: string; filename: string } | null;
  let threw = false;
  const mock = makeMockSanityClient('always-fail-upstream');
  try {
    result = await ensureAssetUploaded(
      // The function calls .assets.upload only — minimal mock surface is fine.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mock.client as any,
      makeMockWpClient(),
      TEST_WP_ID,
      { referrerSlug: 'test-soft-fail-slug', referrerLocale: 'en' },
    );
  } catch (e) {
    threw = true;
    process.stderr.write(`integration threw unexpectedly: ${(e as Error).message}\n`);
    result = null;
  } finally {
    globalThis.setTimeout = realSetTimeout;
  }

  // Fix 2: function must NOT throw, must return null.
  assertEqual(threw, false, 'b1: ensureAssetUploaded did not throw on permanent upstream-server failure');
  assertEqual(result, null, 'b2: ensureAssetUploaded returned null after exhaustion (soft-fail)');

  // Fix 1: classifier widening means 5 attempts (1 initial + 4 retries).
  assertEqual(mock.getAttempts(), 5, 'b3: retry loop reached 5 attempts before exhaustion');

  // Registry: UPLOAD_EXHAUSTED entry recorded for editorial triage.
  const exhausted = getUploadExhausted();
  assertEqual(
    exhausted.length,
    exhaustedBefore + 1,
    'b4: UPLOAD_EXHAUSTED registry got exactly one new entry'
  );
  const entry = exhausted[exhausted.length - 1];
  assertEqual(entry?.wpId, TEST_WP_ID, 'b5: registry entry has correct wpId');
  assertEqual(entry?.referrerSlug, 'test-soft-fail-slug', 'b6: registry entry has referrerSlug');
  assertEqual(entry?.referrerLocale, 'en', 'b7: registry entry has referrerLocale');
  assertEqual(entry?.attempts, 5, 'b8: registry entry records 5 attempts');
  assert(
    entry?.lastError.includes('upstream server'),
    'b9: registry entry preserves last-error message fragment'
  );

  // Cleanup: the function should NOT have written a cache file for the failed
  // upload (cache write only happens on success — preserves idempotent retry
  // semantics: a future re-run should attempt the upload again).
  assert(
    !existsSync(cachePath),
    'b10: no cache file written for failed upload (idempotent retry preserved)'
  );
}

// ─── Group (c): regression-guard ────────────────────────────────────────

function runRegressionGuard(): void {
  // The verbatim Phase 4 FATAL message — guard against silent regression of
  // Fix 1 (someone narrows the regex and breaks the upstream-server case).
  const phase4TriggerMessage = 'An invalid response was received from the upstream server';
  assertEqual(
    isTransientUploadError(new Error(phase4TriggerMessage)),
    true,
    'c1: regression-guard — exact Phase 4 FATAL trigger classifies transient'
  );

  // Guard against silent regression of Fix 2 (someone re-introduces the throw).
  // Confirms ensureAssetUploaded's signature includes null in its return type.
  // Type-level — TypeScript would catch a type-level regression at compile time;
  // this runtime check just gates that the export is reachable.
  assert(typeof ensureAssetUploaded === 'function', 'c2: ensureAssetUploaded export reachable');
  assert(typeof isTransientUploadError === 'function', 'c3: isTransientUploadError export reachable');
  assert(typeof getUploadExhausted === 'function', 'c4: getUploadExhausted export reachable');
}

// ─── Run all ────────────────────────────────────────────────────────────

(async () => {
  runClassifierUnit();
  await runIntegrationSoftFail();
  runRegressionGuard();
  process.stdout.write(`\nmedia tests: pass=${pass} fail=${fail}\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
