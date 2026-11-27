/**
 * Wrong-language slug fallback (GSC, 2026-11-21).
 *
 * Google keeps crawling old discoveries where a real slug sits under the
 * wrong locale prefix — an ES tour slug with no prefix, a JA guide slug
 * under /es, an EN cruise slug under /es … Those 404 today. This helper
 * runs ONLY when a dynamic page is about to call notFound(): it looks the
 * slug up across every locale for that route's content types and, when
 * exactly one document matches, 308s to that document's canonical URL in
 * the requested locale (or, if the doc has no version there, in the slug's
 * own locale).
 *
 * Paths are built with the same helpers the pages use for their hreflang
 * alternates (pathFromDoc + pathByLocaleFrom*, fetchTranslationSlugs for
 * per-language docs), so the target is the exact canonical page.
 *
 * Safety: a miss-only code path; the Sanity read is time-bounded; any error,
 * zero or several matches, or a target equal to the requested path → no
 * redirect, and the caller falls through to its normal notFound().
 */
import { permanentRedirect } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { fetchTranslationSlugs } from '@/sanity/lib/translations';
import { pathFromDoc, type SitemapDocType } from './path-from-doc';
import {
  pathByLocaleFromOwnSlugs,
  pathByLocaleFromParentAndSlug,
  pathByLocaleFromSlugs,
} from './seo';

/** The dynamic routes that use the fallback (one per `[slug]` page). */
export type ForeignSlugRoute =
  | 'root'
  | 'article'
  | 'foodArticle'
  | 'nileCruise'
  | 'city'
  | 'guideArticle'
  | 'hotel'
  | 'travelTip'
  | 'wikiMonument'
  | 'fieldGuide'
  | 'editorialCategory';

/** Field-level i18n types: one doc, locale-keyed `slug[]` array. */
type FieldType =
  | 'tour'
  | 'tourCategory'
  | 'tourLanding'
  | 'wikiMonument'
  | 'nileCruise'
  | 'city'
  | 'guideArticle'
  | 'hotel'
  | 'travelTip'
  | 'fieldGuide'
  | 'editorialCategory';
/** Document-level i18n types: one doc per language + translation.metadata. */
type DocType = 'article' | 'foodArticle';

interface RouteConfig {
  fieldTypes: FieldType[];
  docTypes: DocType[];
  /** Looked up only when the primary types find nothing. */
  secondaryFieldTypes?: FieldType[];
}

const ROUTES: Record<ForeignSlugRoute, RouteConfig> = {
  // Same type set as slugLookupQuery (the catch-all's resolver).
  root: {
    fieldTypes: ['tourCategory', 'tourLanding', 'tour', 'wikiMonument'],
    docTypes: ['article'],
  },
  article: { fieldTypes: [], docTypes: ['article'] },
  foodArticle: { fieldTypes: [], docTypes: ['foodArticle'] },
  // Dahabiya "cruises" are tours (canonical at the root), and GSC has their
  // slugs under /nile-cruises/ — only consulted when no cruise matches.
  nileCruise: { fieldTypes: ['nileCruise'], docTypes: [], secondaryFieldTypes: ['tour'] },
  city: { fieldTypes: ['city'], docTypes: [] },
  guideArticle: { fieldTypes: ['guideArticle'], docTypes: [] },
  hotel: { fieldTypes: ['hotel'], docTypes: [] },
  travelTip: { fieldTypes: ['travelTip'], docTypes: [] },
  wikiMonument: { fieldTypes: ['wikiMonument'], docTypes: [] },
  fieldGuide: { fieldTypes: ['fieldGuide'], docTypes: [] },
  editorialCategory: { fieldTypes: ['editorialCategory'], docTypes: [] },
};

const LOOKUP_TIMEOUT_MS = 3000;
/** More than one match is already ambiguous; never pull a long list. */
const MAX_MATCHES = 5;
const MAX_SLUG_LENGTH = 200;

type Slugs = Array<{ _key: string; current: string }>;

interface FieldHit {
  _id: string;
  _type: FieldType;
  slugs: Slugs | null;
  parentSlugs: Slugs | null;
}
interface DocHit {
  _id: string;
  _type: DocType;
  language: string | null;
  slug: string | null;
}

/** A matched document with every locale path it is canonical at. */
export interface ForeignCandidate {
  id: string;
  /** Locale → locale-relative path (no prefix), as the hreflang alternates. */
  pathByLocale: Partial<Record<Locale, string>>;
  /** Locales whose own slug equals the requested slug (routing order). */
  ownLocales: Locale[];
  /** For guide articles: every locale's parent-city slug (disambiguation). */
  parentSlugs?: string[];
}

export interface ForeignTarget {
  locale: Locale;
  /** Locale-relative path (no prefix). */
  href: string;
}

const fieldQuery = `*[
  _type in $types &&
  !(_id in path("drafts.**")) &&
  $slug in slug[].value.current &&
  (_type != "guideArticle" || (hidden != true && defined(parentCity)))
][0...${MAX_MATCHES}]{
  _id, _type,
  "slugs": slug[]{ _key, "current": value.current },
  "parentSlugs": parentCity->slug[]{ _key, "current": value.current }
}`;

const docQuery = `*[
  _type in $types &&
  !(_id in path("drafts.**")) &&
  slug.current == $slug &&
  language in $locales
][0...${MAX_MATCHES}]{ _id, _type, language, "slug": slug.current }`;

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (routing.locales as readonly string[]).includes(v);
}

function cleanSlugs(slugs: Slugs | null | undefined): Slugs {
  return (slugs ?? []).filter((s) => isLocale(s._key) && !!s.current);
}

/** Canonical paths for a field-level doc — the builders its page uses for hreflang. */
export function fieldCandidate(hit: FieldHit, slug: string): ForeignCandidate | null {
  const slugs = cleanSlugs(hit.slugs);
  const build = (s: string) => pathFromDoc({ type: hit._type as SitemapDocType, slug: s });
  let pathByLocale: Partial<Record<Locale, string>>;
  if (hit._type === 'guideArticle') {
    const parents = cleanSlugs(hit.parentSlugs);
    pathByLocale = pathByLocaleFromParentAndSlug(parents, slugs, (p, c) =>
      pathFromDoc({ type: 'guideArticle', slug: c, parentCitySlug: p }) ?? '',
    );
  } else if (hit._type === 'tourLanding') {
    // Hubs exist only in their own languages (no EN-fallback copy).
    pathByLocale = pathByLocaleFromOwnSlugs(slugs, (s) => build(s) ?? '');
  } else {
    pathByLocale = pathByLocaleFromSlugs(slugs, (s) => build(s) ?? '');
  }
  for (const loc of Object.keys(pathByLocale) as Locale[]) {
    if (!pathByLocale[loc]) delete pathByLocale[loc];
  }
  const ownLocales = routing.locales.filter((l) =>
    slugs.some((s) => s._key === l && s.current === slug),
  ) as Locale[];
  if (ownLocales.length === 0) return null;
  return {
    id: hit._id,
    pathByLocale,
    ownLocales,
    parentSlugs:
      hit._type === 'guideArticle' ? cleanSlugs(hit.parentSlugs).map((s) => s.current) : undefined,
  };
}

/** Canonical paths for a per-language doc: its own slug + its linked translations. */
export function docCandidate(
  hit: DocHit,
  siblings: Partial<Record<Locale, string>>,
): ForeignCandidate | null {
  if (!isLocale(hit.language) || !hit.slug) return null;
  const type: SitemapDocType = hit._type;
  const pathByLocale: Partial<Record<Locale, string>> = {};
  for (const loc of routing.locales as readonly Locale[]) {
    const s = loc === hit.language ? hit.slug : siblings[loc];
    const p = s ? pathFromDoc({ type, slug: s }) : null;
    if (p) pathByLocale[loc] = p;
  }
  return { id: hit._id, pathByLocale, ownLocales: [hit.language] };
}

function normalizePath(p: string): string {
  let out = p;
  try {
    out = decodeURIComponent(p);
  } catch {
    /* keep as is */
  }
  return out.normalize('NFC').replace(/\/+$/, '') || '/';
}

/**
 * Pure decision: exactly one candidate → its path in the requested locale,
 * else in its own locale; never the requested path itself.
 */
export function pickForeignTarget(
  candidates: ForeignCandidate[],
  requested: { locale: Locale; path: string },
): ForeignTarget | null {
  const unique = [...new Map(candidates.map((c) => [c.id, c])).values()];
  if (unique.length !== 1) return null;
  const doc = unique[0];
  let target: ForeignTarget | null = null;
  const inRequested = doc.pathByLocale[requested.locale];
  if (inRequested) {
    target = { locale: requested.locale, href: inRequested };
  } else {
    const own = doc.ownLocales.find((l) => doc.pathByLocale[l]);
    if (own) target = { locale: own, href: doc.pathByLocale[own]! };
  }
  if (!target) return null;
  if (
    target.locale === requested.locale &&
    normalizePath(target.href) === normalizePath(requested.path)
  ) {
    return null;
  }
  return target;
}

/** The path the request was for (locale-relative), built like the canonical ones. */
function requestedPath(route: ForeignSlugRoute, segments: string[]): string | null {
  const [a, b] = segments;
  switch (route) {
    case 'root':
      return `/${a}`;
    case 'guideArticle':
      return pathFromDoc({ type: 'guideArticle', slug: b, parentCitySlug: a });
    default:
      return pathFromDoc({ type: route, slug: a });
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('foreign-slug lookup timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function fetchCandidates(
  types: FieldType[],
  docTypes: DocType[],
  slug: string,
): Promise<ForeignCandidate[]> {
  const signal = AbortSignal.timeout(LOOKUP_TIMEOUT_MS);
  const [fieldHits, docHits] = await Promise.all([
    types.length
      ? client.fetch<FieldHit[]>(fieldQuery, { types, slug }, { signal })
      : Promise.resolve([] as FieldHit[]),
    docTypes.length
      ? client.fetch<DocHit[]>(docQuery, { types: docTypes, slug, locales: [...routing.locales] }, { signal })
      : Promise.resolve([] as DocHit[]),
  ]);
  const out: ForeignCandidate[] = [];
  for (const hit of fieldHits ?? []) {
    const c = fieldCandidate(hit, slug);
    if (c) out.push(c);
  }
  const docs = docHits ?? [];
  // Siblings are only worth fetching when the match is unambiguous.
  if (docs.length === 1 && out.length === 0) {
    const siblings = await withTimeout(fetchTranslationSlugs(docs[0]._id), LOOKUP_TIMEOUT_MS);
    const c = docCandidate(docs[0], siblings);
    if (c) out.push(c);
  } else {
    // Ambiguous either way; the ids are enough to make pickForeignTarget refuse.
    for (const d of docs) out.push({ id: d._id, pathByLocale: {}, ownLocales: [] });
  }
  return out;
}

/**
 * Look a missed slug up across all locales. Returns the redirect target, or
 * null (no match, ambiguous, same path, or any error).
 *
 * `segments` are the route's dynamic params: `[slug]`, or `[citySlug, slug]`
 * for guide articles; for `root`, the catch-all's `rest` (single segment only).
 */
export async function findForeignSlugTarget(
  route: ForeignSlugRoute,
  locale: string,
  segments: string[],
): Promise<ForeignTarget | null> {
  try {
    if (!isLocale(locale)) return null;
    const expected = route === 'guideArticle' ? 2 : 1;
    if (segments.length !== expected || segments.some((s) => !s)) return null;
    const slug = normalizePath(segments[segments.length - 1]).replace(/^\//, '');
    const path = requestedPath(route, segments);
    if (!slug || !path) return null;
    // Cheap bot-noise guard (/wp-login.php, /.env …): no CMS slug contains a
    // dot or runs past ~100 chars (checked 2026-11-21, 4,408 slugs), so these
    // never cost a Sanity request.
    if (slug.includes('.') || slug.length > MAX_SLUG_LENGTH) return null;

    const cfg = ROUTES[route];
    let candidates = await fetchCandidates(cfg.fieldTypes, cfg.docTypes, slug);
    if (candidates.length === 0 && cfg.secondaryFieldTypes?.length) {
      candidates = await fetchCandidates(cfg.secondaryFieldTypes, [], slug);
    }
    // Guide articles: the same leaf can exist under several cities — keep the
    // one whose city matches the requested city segment (in any language).
    if (route === 'guideArticle' && candidates.length > 1) {
      const city = normalizePath(segments[0]).replace(/^\//, '');
      const narrowed = candidates.filter((c) => c.parentSlugs?.includes(city));
      if (narrowed.length > 0) candidates = narrowed;
    }
    return pickForeignTarget(candidates, { locale, path });
  } catch (err) {
    console.error('[foreign-slug] lookup failed:', err);
    return null;
  }
}

/**
 * Call right before notFound() on a slug miss. Redirects (308) when the slug
 * belongs to exactly one document in another language; otherwise returns and
 * the caller 404s as before.
 */
export async function redirectForeignSlug(
  route: ForeignSlugRoute,
  locale: string,
  segments: string[],
): Promise<void> {
  const target = await findForeignSlugTarget(route, locale, segments);
  // Outside any try/catch: permanentRedirect throws Next's redirect signal.
  if (target) permanentRedirect({ href: target.href, locale: target.locale });
}
