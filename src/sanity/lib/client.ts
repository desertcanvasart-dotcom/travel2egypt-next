import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId } from '../env';

/**
 * Public read client. The live `production` dataset is public (aclMode:
 * public), so anonymous reads already see every published document — no
 * token is required. Omitting the token is deliberate: an authenticated
 * read is forced to the API origin and silently bypasses `useCdn`, so every
 * ISR regeneration would pay full origin latency. Token-less + `useCdn`
 * routes production reads through the Sanity CDN instead.
 *
 * (Historical note: an earlier private `migration-staging` dataset did need
 * a read token to surface newly-imported docs; that constraint went away at
 * the production cutover.)
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
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
