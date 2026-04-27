/**
 * Sanity staging client. Wraps @sanity/client with a hard guard that the
 * dataset is "migration-staging" — refuses to instantiate against any other
 * dataset. This is belt-and-braces on top of env.ts's check.
 */

import { createClient, type SanityClient } from '@sanity/client';

import type { Env } from './env.js';

export function makeSanityClient(env: Env): SanityClient {
  if (env.sanityDataset !== 'migration-staging') {
    throw new Error(
      `Refusing to construct Sanity client for dataset "${env.sanityDataset}". Only "migration-staging" is permitted.`
    );
  }
  return createClient({
    projectId: env.sanityProjectId,
    dataset: env.sanityDataset,
    token: env.sanityToken,
    apiVersion: '2024-10-01',
    useCdn: false,
    perspective: 'raw',
  });
}

/**
 * Look up an existing city Sanity doc by EN slug. Returns null if not found.
 * Used during city import so we update Phase-1 seed cities in place rather
 * than creating duplicates.
 */
export async function findCityByEnSlug(client: SanityClient, slug: string): Promise<{ _id: string } | null> {
  const result = await client.fetch<{ _id: string } | null>(
    `*[_type == "city" && slug[_key=="en"][0].value.current == $slug][0]{_id}`,
    { slug }
  );
  return result ?? null;
}

/**
 * Look up a Sanity doc by migration.wpUrl. Used during the relink phase.
 */
export async function findByLegacyUrl(client: SanityClient, wpUrl: string): Promise<{ _id: string; _type: string } | null> {
  return await client.fetch<{ _id: string; _type: string } | null>(
    `*[migration.wpUrl == $wpUrl][0]{_id, _type}`,
    { wpUrl }
  );
}

/** Look up a Sanity doc by migration.wpId. */
export async function findByLegacyId(client: SanityClient, wpId: number): Promise<{ _id: string; _type: string } | null> {
  return await client.fetch<{ _id: string; _type: string } | null>(
    `*[migration.wpId == $wpId][0]{_id, _type}`,
    { wpId }
  );
}
