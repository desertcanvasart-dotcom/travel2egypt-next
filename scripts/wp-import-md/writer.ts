/**
 * Sanity writer for guideArticle docs sourced from MD.
 *
 * Idempotency strategy (s44 lesson — never lose existing locales):
 *
 *   - _id is deterministic: `guideArticle.<city>.<slug>`.
 *   - For each i18n array field (title, slug, summary, body, seo fields), we
 *     read the current doc, replace entries with matching _key (locale), and
 *     preserve entries with other _key values. So importing ES alone never
 *     touches an existing EN entry.
 *   - parentCity, kind, section are top-level scalars — written unconditionally
 *     from the EN sibling (which is required to be present).
 *   - Fields the import does NOT author (relatedTours, monumentType, gallery,
 *     featured, coordinates, visitorInfo) are never patched.
 *   - Raw @sanity/client transactions — no MCP tools (s44 _key corruption).
 *
 * Dry-run mode records the would-be-transaction payload without committing.
 */

import type { SanityClient } from '@sanity/client';

import type { Locale } from './types.js';
import type { LocaleTriplet, UploadedImage } from './types.js';
import type { PtBlock } from '../wp-import-html.js';
import { sectionForKind } from './kind-to-section.js';
import { mdToPortableText } from './md-to-pt.js';
import { preuploadImages, uploadLocalImage } from './image-uploader.js';
import { dirname, resolve as resolvePath } from 'node:path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface I18nEntry<T> {
  _key: Locale;
  value: T;
}

interface I18nObjectEntry {
  _key: Locale;
  _type: 'object';
  value: PtBlock[];
}

interface I18nSlugEntry {
  _key: Locale;
  value: { _type: 'slug'; current: string };
}

export interface WriteRecord {
  _id: string;
  city: string;
  slug: string;
  kind: string;
  section: string;
  /** Locales authored in this run (informational; the writer surgically updates only these in i18n arrays). */
  locales: Locale[];
  /** Resulting doc as it WILL appear after the writer commits the txn — useful for tests + dry-run inspection. */
  resultDoc: Record<string, unknown>;
  /** True iff the resulting doc is byte-equal to what already exists in Sanity (no transaction sent). */
  noop: boolean;
  /** True iff the doc did NOT previously exist (this run created it). */
  created: boolean;
  /** Asset uploads triggered for this triplet (hero + body images). */
  uploads: UploadedImage[];
}

interface ExistingDoc {
  _id: string;
  title?: I18nEntry<string>[];
  slug?: I18nSlugEntry[];
  summary?: I18nEntry<string>[];
  body?: I18nObjectEntry[];
  heroImage?: Record<string, unknown>;
  seo?: { metaTitle?: I18nEntry<string>[]; metaDescription?: I18nEntry<string>[]; [k: string]: unknown };
  parentCity?: { _ref: string; _type: 'reference' };
  kind?: string;
  section?: string;
  migration?: Record<string, unknown>;
}

// ─── i18n array surgery ───────────────────────────────────────────────────────

function mergeI18n<T extends { _key: Locale }>(existing: T[] | undefined, replacements: T[]): T[] {
  const byKey = new Map<Locale, T>();
  for (const e of existing ?? []) byKey.set(e._key, e);
  for (const r of replacements) byKey.set(r._key, r);
  return [...byKey.values()];
}

// ─── Builders ─────────────────────────────────────────────────────────────────

function buildSlugEntries(triplet: LocaleTriplet, authoredLocales: Locale[]): I18nSlugEntry[] {
  // Slug is identical across locales (cross-locale validation enforces this).
  return authoredLocales.map((loc) => ({
    _key: loc,
    value: { _type: 'slug', current: triplet.files[loc]!.fm.slug },
  }));
}

function buildI18nString(
  triplet: LocaleTriplet,
  authoredLocales: Locale[],
  pick: (file: NonNullable<LocaleTriplet['files'][Locale]>) => string | undefined
): I18nEntry<string>[] {
  return authoredLocales
    .map((loc) => {
      const file = triplet.files[loc];
      if (!file) return null;
      const v = pick(file);
      return v ? { _key: loc, value: v } : null;
    })
    .filter((e): e is I18nEntry<string> => e !== null);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export interface WriteOpts {
  client: SanityClient;
  dryRun: boolean;
}

export async function writeTriplet(triplet: LocaleTriplet, opts: WriteOpts): Promise<WriteRecord> {
  const { client, dryRun } = opts;

  // EN is required (cross-locale validation runs first; this is a guard).
  const enFile = triplet.files.en!;
  const fmEn = enFile.fm;
  const authoredLocales: Locale[] = (['en', 'es', 'ja'] as Locale[]).filter((l) => triplet.files[l]);

  // Resolve parentCity reference (city must exist in Sanity).
  const cityDoc = await client.fetch<{ _id: string } | null>(
    `*[_type == "city" && slug[_key=="en"][0].value.current == $slug][0]{_id}`,
    { slug: fmEn.city }
  );
  if (!cityDoc) {
    throw new Error(`writer: city "${fmEn.city}" not found in Sanity — cannot resolve parentCity ref`);
  }
  const parentCityRef = { _type: 'reference' as const, _ref: cityDoc._id };

  // Upload hero + body images.
  const uploads: UploadedImage[] = [];
  const heroAssetByLocale = new Map<Locale, UploadedImage>();
  for (const loc of authoredLocales) {
    const f = triplet.files[loc]!;
    if (f.fm.heroImage) {
      const heroPath = resolvePath(dirname(f.filePath), f.fm.heroImage);
      const hero = await uploadLocalImage(heroPath, client, { dryRun });
      heroAssetByLocale.set(loc, hero);
      uploads.push(hero);
    }
  }

  // Per-locale body conversion (pre-upload body images first).
  const bodyEntries: I18nObjectEntry[] = [];
  for (const loc of authoredLocales) {
    const f = triplet.files[loc]!;
    const imageMap = await preuploadImages(f.body, dirname(f.filePath), client, { dryRun });
    for (const u of imageMap.values()) uploads.push(u);
    const { blocks } = mdToPortableText(f.body, { locale: loc, pageTitle: f.fm.title, imageMap });
    bodyEntries.push({ _key: loc, _type: 'object', value: blocks });
  }

  // Read existing doc (idempotency — preserve other-locale entries + non-authored fields).
  const _id = `guideArticle.${fmEn.city}.${fmEn.slug}`;
  const existing = await client.fetch<ExistingDoc | null>(`*[_id == $id][0]`, { id: _id });

  // Build the resulting doc.
  const titleEntries = buildI18nString(triplet, authoredLocales, (f) => f.fm.title);
  const slugEntries = buildSlugEntries(triplet, authoredLocales);
  const summaryEntries = buildI18nString(triplet, authoredLocales, (f) => f.fm.excerpt);
  const metaDescriptionEntries = buildI18nString(triplet, authoredLocales, (f) => f.fm.description);
  const metaTitleEntries = buildI18nString(triplet, authoredLocales, (f) => f.fm.title);

  const seoExisting = existing?.seo ?? {};
  const seo: Record<string, unknown> = { ...seoExisting };
  const mergedMetaTitle = mergeI18n(seoExisting.metaTitle, metaTitleEntries);
  if (mergedMetaTitle.length > 0) seo.metaTitle = mergedMetaTitle;
  const mergedMetaDesc = mergeI18n(seoExisting.metaDescription, metaDescriptionEntries);
  if (mergedMetaDesc.length > 0) seo.metaDescription = mergedMetaDesc;

  const heroImageField = buildHeroImage(existing?.heroImage, heroAssetByLocale);

  const migration = {
    ...(existing?.migration ?? {}),
    source: 'wp-import-md',
    migratedAt: new Date().toISOString(),
  };

  const resultDoc: Record<string, unknown> = {
    _id,
    _type: 'guideArticle',
    parentCity: parentCityRef,
    kind: fmEn.kind,
    section: sectionForKind(fmEn.kind),
    title: mergeI18n(existing?.title, titleEntries),
    slug: mergeI18n(existing?.slug, slugEntries),
    summary: mergeI18n(existing?.summary, summaryEntries),
    body: mergeI18n(existing?.body, bodyEntries),
    ...(heroImageField ? { heroImage: heroImageField } : {}),
    ...(Object.keys(seo).length > 0 ? { seo } : {}),
    migration,
  };

  // Idempotency: if existing fingerprint matches, no-op.
  const fingerprintNew = fingerprint(resultDoc);
  const fingerprintOld = existing ? fingerprint(buildExistingMirror(existing, resultDoc)) : null;
  const noop = fingerprintOld !== null && fingerprintOld === fingerprintNew;

  if (!noop && !dryRun) {
    const txn = client.transaction();
    if (existing) {
      txn.patch(_id, (p) =>
        p.set(stripId(resultDoc))
      );
    } else {
      txn.createIfNotExists(resultDoc as unknown as { _id: string; _type: string });
    }
    await txn.commit();
  }

  return {
    _id,
    city: fmEn.city,
    slug: fmEn.slug,
    kind: fmEn.kind,
    section: sectionForKind(fmEn.kind),
    locales: authoredLocales,
    resultDoc,
    noop,
    created: existing === null,
    uploads,
  };
}

function buildHeroImage(
  existing: Record<string, unknown> | undefined,
  authored: Map<Locale, UploadedImage>
): Record<string, unknown> | undefined {
  if (authored.size === 0) return existing;
  // localizedImage has one asset + per-locale alt/caption. If multiple locales
  // ship a hero, they all should reference the same file in practice; we take
  // the EN one for the asset and let alt be added per-locale in Studio.
  const enHero = authored.get('en');
  const anyHero = enHero ?? authored.values().next().value!;
  return {
    ...(existing ?? {}),
    _type: 'image',
    asset: { _type: 'reference', _ref: anyHero.assetId },
  };
}

function stripId(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id: _ignore, _type: _ignore2, ...rest } = doc;
  void _ignore;
  void _ignore2;
  return rest;
}

/**
 * Stable JSON fingerprint over the fields we author. Used to detect no-ops.
 * The migration.migratedAt timestamp is intentionally excluded — it changes
 * on every run and would defeat the no-op detector.
 */
function fingerprint(doc: Record<string, unknown>): string {
  const clone = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
  if (clone.migration && typeof clone.migration === 'object') {
    delete (clone.migration as Record<string, unknown>).migratedAt;
  }
  return stableStringify(clone);
}

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return (
    '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k])).join(',') + '}'
  );
}

/** Project the parts of the existing doc onto the same shape as resultDoc so fingerprints compare. */
function buildExistingMirror(existing: ExistingDoc, resultDoc: Record<string, unknown>): Record<string, unknown> {
  const mirror: Record<string, unknown> = { ...resultDoc };
  // Replace every i18n array + scalar with the existing one (no field-by-field merge — we want a faithful
  // before-state to fingerprint against).
  mirror._id = existing._id;
  if (existing.parentCity) mirror.parentCity = existing.parentCity;
  if (existing.kind !== undefined) mirror.kind = existing.kind;
  if (existing.section !== undefined) mirror.section = existing.section;
  if (existing.title) mirror.title = existing.title;
  if (existing.slug) mirror.slug = existing.slug;
  if (existing.summary) mirror.summary = existing.summary;
  if (existing.body) mirror.body = existing.body;
  if (existing.heroImage) mirror.heroImage = existing.heroImage;
  if (existing.seo) mirror.seo = existing.seo;
  if (existing.migration) mirror.migration = existing.migration;
  return mirror;
}
