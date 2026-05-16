/**
 * Sanity environment resolution.
 *
 * Two contexts consume this file:
 *
 *   1. Next.js (server + browser). The framework inlines `NEXT_PUBLIC_*`
 *      env vars at build time.
 *   2. The Sanity Studio bundle (Vite-based). The Studio bundler only
 *      inlines `SANITY_STUDIO_*` env vars — `NEXT_PUBLIC_*` is invisible
 *      to it. The hosted Studio at travel2egypt.sanity.studio loads this
 *      file via `sanity.config.ts`, so anything that throws at module
 *      init here crashes the deployed Studio.
 *
 * Strategy: prefer `SANITY_STUDIO_*` (works in both contexts when set in
 * .env), fall back to `NEXT_PUBLIC_*` (works in Next.js only), fall back
 * to project-known constants so the Studio bundle never crashes on
 * import even if no env vars are inlined at build time.
 *
 * No top-level throws — assertions belong with the consumers (the write
 * client throws on missing token when it actually tries to write).
 */

const SANITY_PROJECT_ID = 'ufallvd2';
const DEFAULT_DATASET = 'production';
const DEFAULT_API_VERSION = '2024-12-01';

export const apiVersion =
  process.env.SANITY_STUDIO_API_VERSION ||
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  DEFAULT_API_VERSION;

export const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  SANITY_PROJECT_ID;

/**
 * Dataset for the Next.js runtime client. The Studio bundle hardcodes
 * its workspaces' datasets in `sanity.config.ts` and does not use this
 * export — it exists only so client.ts can build a single read/write
 * client against whichever dataset Next.js is currently pointed at.
 */
export const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  DEFAULT_DATASET;
