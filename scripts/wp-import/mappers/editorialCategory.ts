/**
 * WP `category` → Sanity `editorialCategory`.
 *
 * Categories are non-localized in our schema (per [README §1] and Phase B
 * decision — WP categories have no translations either).
 */

import type { SanityClient } from '@sanity/client';

import { NOW, plainText } from './_shared.js';
import type { MapperResult, SanityDoc } from '../types.js';

interface WpCategory {
  id: number;
  slug: string;
  name: string;
  description?: string;
  count?: number;
}

export function mapEditorialCategory(_client: SanityClient, wpCat: WpCategory): MapperResult {
  // Skip empty categories (count = 0) — caller handles this filter.
  const doc: SanityDoc = {
    _id: `wp-category-${wpCat.id}`,
    _type: 'editorialCategory',
    name: [{ _key: 'en', value: wpCat.name }],
    slug: [{ _key: 'en', value: { _type: 'slug', current: wpCat.slug } }],
    ...(wpCat.description
      ? { description: [{ _key: 'en', value: plainText(wpCat.description) }] }
      : {}),
    migration: {
      wpId: wpCat.id,
      wpUrl: `https://travel2egypt.org/category/${wpCat.slug}/`,
      migratedAt: NOW(),
      source: 'wp-import' as const,
    },
  };
  return { docs: [doc], redirects: [] };
}
