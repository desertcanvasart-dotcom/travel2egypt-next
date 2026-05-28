import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId } from '../env';

/**
 * Read token. The `migration-staging` dataset is private — anonymous reads
 * only see a subset of docs (the original WP imports). Newly-created docs
 * (the May-2026 MD upload's `guideArticle.<city>.<slug>` IDs) require a
 * token to be visible. The token is read server-side only (this file is
 * imported by Server Components and route handlers), so it never reaches
 * the browser. Falls back to the write token in dev; production should
 * have a dedicated `SANITY_API_READ_TOKEN`.
 */
const readToken =
  process.env.SANITY_API_READ_TOKEN ||
  process.env.SANITY_STAGING_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
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
