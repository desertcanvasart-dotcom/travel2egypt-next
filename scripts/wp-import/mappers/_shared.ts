/**
 * Shared helpers used by every entity mapper.
 */

import type { SanityClient } from '@sanity/client';

import { htmlToPortableText, type PtBlock } from '../../wp-import-html.js';
import type { WpClient } from '../wp-client.js';
import { ensureAssetUploaded } from '../media.js';
import type {
  I18nSlug,
  I18nString,
  Locale,
  LocaleGroup,
  MigrationMetadata,
  RedirectEntry,
  ReviewFlag,
  WpEntityFull,
} from '../types.js';

export const NOW = () => new Date().toISOString();

/** Strip HTML, decode entities, collapse whitespace. */
export function plainText(html: string | undefined | null): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function decodeTitle(html: string | undefined): string {
  return plainText(html ?? '');
}

/** Build a field-level i18n string field. Skips locales with empty values. */
export function i18nString(group: LocaleGroup, pick: (e: WpEntityFull) => string): I18nString {
  const out: I18nString = [];
  if (group.en && pick(group.en)) out.push({ _key: 'en', value: pick(group.en) });
  if (group.es && pick(group.es)) out.push({ _key: 'es', value: pick(group.es) });
  if (group.ja && pick(group.ja)) out.push({ _key: 'ja', value: pick(group.ja) });
  return out;
}

export function i18nSlug(group: LocaleGroup): I18nSlug {
  const out: I18nSlug = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (e?.slug) out.push({ _key: loc, value: { _type: 'slug', current: decodeURIComponent(e.slug) } });
  }
  return out;
}

/** Build per-locale Portable Text (one PT array per locale). */
export function i18nBody(group: LocaleGroup, fieldName = 'body'): Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }> {
  const out: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }> = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e?.content?.rendered) continue;
    const result = htmlToPortableText(e.content.rendered);
    out.push({ _key: loc, _type: 'object', value: result.blocks });
  }
  void fieldName;
  return out;
}

/** Combined HTML→PT stats summed across all locales of a group. */
export function summedHtmlStats(group: LocaleGroup) {
  const stats = { operatorNotes: 0, pullQuotes: 0, sideImages: 0, images: 0, tablesFlattened: 0, pendingInternalLinks: 0 };
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e?.content?.rendered) continue;
    const r = htmlToPortableText(e.content.rendered);
    for (const k of Object.keys(stats) as Array<keyof typeof stats>) stats[k] += r.stats[k];
  }
  return stats;
}

export function buildMigrationMeta(
  group: LocaleGroup,
  reviewFlag?: ReviewFlag
): MigrationMetadata {
  const en = group.en;
  return {
    wpId: en.id,
    wpUrl: en.link,
    wpModifiedAt: en.modified_gmt ?? en.modified,
    wpTemplate: en.template ?? null,
    migratedAt: NOW(),
    source: 'wp-import',
    ...(reviewFlag ? { reviewFlag } : {}),
  };
}

/** Build redirect entries for an entity (one per locale present in the group). */
export function buildRedirects(
  group: LocaleGroup,
  toPathBuilder: (locale: Locale, slug: string) => string,
  priorityScore: number
): RedirectEntry[] {
  const entries: RedirectEntry[] = [];
  for (const loc of ['en', 'es', 'ja'] as const) {
    const e = group[loc];
    if (!e) continue;
    const path = toPathBuilder(loc, e.slug);
    if (!path) continue;
    entries.push({
      from_url: e.link,
      to_path: path,
      locale: loc,
      status_code: 301,
      legacy_wp_id: e.id,
      priority_score: priorityScore,
    });
  }
  return entries;
}

/** Pull featured-media id from EN entity's featured_media field. */
export async function buildHeroImage(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: { dryRun?: boolean } = {}
): Promise<unknown | null> {
  const featured = group.en.featured_media;
  if (!featured) return null;
  const upload = await ensureAssetUploaded(client, wp, featured, opts);
  if (!upload) return null;
  // localizedImage's underlying primitive is 'image' — so the stored _type is image
  // and Sanity hydrates the alt/caption i18n fields via the field's declared type.
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: upload.assetId },
  };
}
