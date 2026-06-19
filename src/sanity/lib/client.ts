import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId } from '../env';

/**
 * Read client — server-side only (Server Components + route handlers), so the
 * token never reaches the browser.
 *
 * The live `production` dataset is NOT fully anonymous-readable: a token-less
 * read sees only ~136 of 219 published `tour` docs (and similar gaps in other
 * types) — the `tour.<slug>` docs return null without a token, which 404s
 * those pages. A token is therefore required for the complete published set.
 *
 * (An earlier change dropped this token assuming `aclMode: public`; that hid
 * ~83 tour pages on the live site. Do NOT re-drop it without first confirming,
 * against the live dataset, that anonymous reads see every published doc.)
 *
 * An authenticated read is forced to the API origin (it bypasses `useCdn`), so
 * the CDN-latency win is given up here in exchange for correctness. Prefer a
 * dedicated read token; fall back to the production write token, then generic.
 */
const readToken =
  process.env.SANITY_API_READ_TOKEN ||
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
  token: readToken,
});

/**
 * Write client — only use server-side. Requires SANITY_API_WRITE_TOKEN.
 * Used by seed scripts and any future write operations.
 */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
