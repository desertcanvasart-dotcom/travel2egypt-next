/**
 * WP tour-or-package `page` → Sanity `tour`.
 *
 * Reads `meta._elementor_data` JSON and extracts:
 *   - top-level `body` from the Overview tab (modern) / Overview heading +
 *     following text-editor (older) / single-tab accordion content for
 *     `*-private-car-and-guide` slugs.
 *     ⚠ NOTE: the `body` field is NOT declared on the tour schema as of
 *     Phase 2a-i. Output here is forward-looking; surfaced for follow-up.
 *   - `days[]` from the itinerary accordion (empty for private-car-and-guide)
 *   - `priceIndication` from Dates & Prices tab (modern) / "Tour Pricing
 *     Options" html widget (private-car-and-guide) / empty (other older)
 *   - `gallery` placeholder entries from image-carousel + image widgets
 *     (older only). Stored as `{ _type: 'localizedImage', sourceUrl, alt }`
 *     stubs — real Sanity asset upload happens in a follow-up phase.
 *
 * Type discriminator: `package` if slug matches `package|vacation|itinerary|
 * cruise-vacation` OR `\d+-day` where N > 7; `dayTour` otherwise. `tourMode`
 * defaults: `private` for `*-private-car-and-guide` slugs, `group` for other
 * dayTours, unset for packages.
 *
 * Strip rules (LQ5–LQ7) are encoded structurally rather than as explicit
 * filters: the extractors only pull `text-editor`, `accordion`, `image`, and
 * `image-carousel` widgets. `html` widgets (Bokun, Forminator, generic) are
 * never collected. The single deliberate exception is the "Tour Pricing
 * Options" html widget in `extractPrivateCarAndGuide`, which is pulled by
 * content match BEFORE the structural strip applies.
 */

import type { SanityClient } from '@sanity/client';

import { TOKEN_TO_CITY_SLUG } from '../../wp-classifier.js';
import type { WpClient } from '../wp-client.js';
import {
  buildHeroImage,
  buildMigrationMeta,
  buildRedirects,
  decodeTitle,
  i18nSlug,
  i18nString,
  plainText,
} from './_shared.js';
import { htmlToPortableText, type PtBlock } from '../../wp-import-html.js';
import type { LocaleGroup, Locale, MapperResult, SanityDoc, WpEntityFull } from '../types.js';
import { LOCALES } from '../types.js';

// -- Elementor source shapes (narrow ad-hoc types; the upstream blob is loose) -

interface ElementorBlock {
  id?: string;
  elType?: string;
  widgetType?: string;
  settings?: Record<string, any>;
  elements?: ElementorBlock[];
}

interface AccordionTab {
  tab_title?: string;
  tab_content?: string;
  _id?: string;
  tab_id?: string;
}

// -- Per-locale extraction intermediate shape -----------------------------------

interface PerLocaleContent {
  body?: string;
  days: Array<{ num: number; title: string; content: string }>;
  priceText?: string;
  gallery: Array<{ id?: number; url: string; alt?: string }>;
}

interface ExtractedContent {
  body: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }>;
  days: TourDayDoc[];
  priceIndication: Array<{ _key: Locale; value: string }>;
  gallery: Array<{ _type: 'localizedImage'; _key: string; sourceUrl: string; alt?: string }>;
}

interface TourDayDoc {
  _type: 'tourDay';
  _key: string;
  dayNumber: number;
  title?: Array<{ _key: Locale; value: string }>;
  cities?: Array<{ _type: 'reference'; _ref: string; _key: string }>;
  morning?: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }>;
}

// -- Mapper options & entry -----------------------------------------------------

interface TourMapperOpts {
  dryRun?: boolean;
  priorityScore?: number;
  /** Pre-fetched city slug → _id map. If omitted, the mapper fetches once per call. */
  cityRefsBySlug?: Map<string, string>;
}

export async function mapTour(
  client: SanityClient,
  wp: WpClient,
  group: LocaleGroup,
  opts: TourMapperOpts = {}
): Promise<MapperResult> {
  const en = group.en;
  const slug = en.slug.toLowerCase();

  // Type discriminator (preserved from prior mapper).
  const isPackage =
    /-package(-|$)|-vacation(-|$)|-itinerary(-|$)|cruise-vacation/.test(slug) ||
    daysFromSlug(slug) > 7;
  const tourType: 'dayTour' | 'package' = isPackage ? 'package' : 'dayTour';

  const isPrivateCarAndGuide = /-private-car-and-guide$/.test(slug);
  const tourMode: 'private' | 'group' | undefined =
    tourType === 'package' ? undefined : isPrivateCarAndGuide ? 'private' : 'group';

  // City refs (full-slug token-boundary scan; Cairo last resort).
  const cityRefsBySlug = opts.cityRefsBySlug ?? (await fetchCityRefsBySlug(client));
  const { cities, resolution: cityResolution } = resolveTopLevelCities(slug, cityRefsBySlug);

  // Per-locale Elementor extraction.
  const extracted = extractContent(group, isPrivateCarAndGuide);

  // Hero image (preserved).
  const hero = await buildHeroImage(client, wp, group, opts);

  const durationDays = daysFromSlug(slug);

  const doc: SanityDoc = {
    _id: `wp-page-${en.id}`,
    _type: 'tour',
    type: tourType,
    ...(tourMode ? { tourMode } : {}),
    title: i18nString(group, (e) => decodeTitle(e.title?.rendered)),
    slug: i18nSlug(group),
    summary: buildSummaryFromExtractedBody(extracted.body),
    // `body` is forward-looking — not currently declared on tour schema (see header note).
    ...(extracted.body.length > 0 ? { body: extracted.body } : {}),
    ...(extracted.days.length > 0 ? { days: extracted.days } : {}),
    ...(extracted.priceIndication.length > 0 ? { priceIndication: extracted.priceIndication } : {}),
    // gallery emission disabled — Phase 2b.e or later will wire asset upload via ensureAssetUploaded
    cities,
    ...(durationDays > 0 ? { durationDays } : {}),
    ...(hero ? { heroImage: hero } : {}),
    migration: buildMigrationMeta(group, undefined, { cityResolution }),
  };

  const redirects = buildRedirects(
    group,
    (locale, slugIn) => {
      const decoded = decodeURIComponent(slugIn);
      const base = tourType === 'package' ? 'packages' : 'tours';
      return locale === 'en' ? `/${base}/${decoded}` : `/${locale}/${base}/${decoded}`;
    },
    opts.priorityScore ?? 0
  );

  return { docs: [doc], redirects };
}

function daysFromSlug(slug: string): number {
  const m = /^(\d+)-?days?-/.exec(slug) ?? /(\d+)-day-/.exec(slug);
  return m ? Number(m[1]) : 0;
}

/**
 * Tour-slug → city-slug overrides for cases where slug-prefix matching gives the
 * wrong city (typically water-based or named-attraction tours whose slug doesn't
 * mention the geographic city). Consulted before slug-prefix scan; Cairo
 * last-resort still applies if neither this map nor prefix match yields a city.
 */
const SLUG_CITY_OVERRIDES: Record<string, string> = {
  'snorkeling-adventure-on-the-nefertari-submarine': 'marsa-alam',
};

// -- City resolution ------------------------------------------------------------

async function fetchCityRefsBySlug(client: SanityClient): Promise<Map<string, string>> {
  const cities: Array<{
    _id: string;
    slug?: Array<{ _key: string; value?: { current?: string } }>;
  }> = await client.fetch(`*[_type=="city" && defined(slug)]{ _id, slug }`);
  const map = new Map<string, string>();
  for (const c of cities) {
    const enSlug = c.slug?.find((s) => s._key === 'en')?.value?.current;
    if (enSlug) map.set(enSlug.toLowerCase(), c._id);
  }
  return map;
}

export type CityResolution = 'override' | 'full-slug-scan' | 'default-cairo';

/**
 * Full-slug token-boundary scan against the 41-city Sanity inventory.
 *
 * For each city slug (longest-first), find token-aligned occurrences in the
 * tour slug, consuming matched character positions so an `abu-simbel` match
 * isn't double-counted as a separate `abu` or `simbel` if those were also
 * in inventory. Multiple distinct cities can match — returned in match order.
 *
 * `SLUG_CITY_OVERRIDES` wins absolutely. Falls back to Cairo if nothing matches.
 */
export function resolveTopLevelCities(
  slug: string,
  cityRefsBySlug: Map<string, string>
): { cities: Array<{ _type: 'reference'; _ref: string; _key: string }>; resolution: CityResolution } {
  // Explicit override first.
  const overrideCitySlug = SLUG_CITY_OVERRIDES[slug];
  if (overrideCitySlug) {
    const id = cityRefsBySlug.get(overrideCitySlug);
    if (id) {
      return {
        cities: [{ _type: 'reference', _ref: id, _key: id }],
        resolution: 'override',
      };
    }
    // Override pointed to a slug not in inventory — fall through to scan.
  }

  // Sort longest-first so multi-word cities (abu-simbel, marsa-alam, siwa-oasis)
  // are matched before any bare token that overlaps.
  const sortedCitySlugs = [...cityRefsBySlug.keys()].sort((a, b) => b.length - a.length);

  // Character-position mask. A position consumed by a longer match is unavailable
  // for any subsequent (shorter) match.
  const consumed = new Array<boolean>(slug.length).fill(false);
  const matched: Array<{ slug: string; id: string; at: number }> = [];

  for (const citySlug of sortedCitySlugs) {
    const escaped = citySlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|-)(${escaped})(?:-|$)`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(slug)) !== null) {
      const tokenStart = m.index + (m[0].startsWith('-') ? 1 : 0);
      const tokenEnd = tokenStart + m[1].length;
      let overlap = false;
      for (let i = tokenStart; i < tokenEnd; i++) {
        if (consumed[i]) { overlap = true; break; }
      }
      if (overlap) continue;
      for (let i = tokenStart; i < tokenEnd; i++) consumed[i] = true;
      const id = cityRefsBySlug.get(citySlug)!;
      matched.push({ slug: citySlug, id, at: tokenStart });
      break; // one match per city slug
    }
  }

  // Alias pass — handles operator-domain Egyptian-geography variants where
  // slugs use bare tokens (siwa, fayoum, dakhla, …) but Sanity inventory uses
  // multi-word canonical forms (siwa-oasis, al-fayoum, …). Source of truth is
  // TOKEN_TO_CITY_SLUG in the classifier; we import it to stay in sync.
  for (const [aliasToken, canonicalSlug] of Object.entries(TOKEN_TO_CITY_SLUG)) {
    if (matched.some((m) => m.slug === canonicalSlug)) continue;
    const canonicalId = cityRefsBySlug.get(canonicalSlug);
    if (!canonicalId) continue;
    const escaped = aliasToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|-)(${escaped})(?:-|$)`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(slug)) !== null) {
      const tokenStart = m.index + (m[0].startsWith('-') ? 1 : 0);
      const tokenEnd = tokenStart + m[1].length;
      let overlap = false;
      for (let i = tokenStart; i < tokenEnd; i++) {
        if (consumed[i]) { overlap = true; break; }
      }
      if (overlap) continue;
      for (let i = tokenStart; i < tokenEnd; i++) consumed[i] = true;
      matched.push({ slug: canonicalSlug, id: canonicalId, at: tokenStart });
      break;
    }
  }

  if (matched.length === 0) {
    const cairoId = cityRefsBySlug.get('cairo');
    if (cairoId) {
      return {
        cities: [{ _type: 'reference', _ref: cairoId, _key: cairoId }],
        resolution: 'default-cairo',
      };
    }
    return { cities: [], resolution: 'default-cairo' };
  }

  // Return cities in left-to-right slug order for deterministic, readable output.
  matched.sort((a, b) => a.at - b.at);
  return {
    cities: matched.map((m) => ({ _type: 'reference' as const, _ref: m.id, _key: m.id })),
    resolution: 'full-slug-scan',
  };
}

// -- Locale entry accessor (LocaleGroup uses discrete keys, not index) ----------

function localeEntry(group: LocaleGroup, locale: Locale): WpEntityFull | undefined {
  if (locale === 'en') return group.en;
  if (locale === 'es') return group.es;
  return group.ja;
}

// -- Top-level extraction orchestrator ------------------------------------------

function extractContent(group: LocaleGroup, isPrivateCarAndGuide: boolean): ExtractedContent {
  const perLocale: Record<Locale, PerLocaleContent> = {
    en: { days: [], gallery: [] },
    es: { days: [], gallery: [] },
    ja: { days: [], gallery: [] },
  };

  for (const locale of LOCALES) {
    const entry = localeEntry(group, locale);
    if (!entry) continue;
    const raw = entry.meta?.['_elementor_data'];
    if (typeof raw !== 'string' || raw.length === 0) continue;
    let parsed: ElementorBlock[];
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;

    if (isPrivateCarAndGuide) {
      perLocale[locale] = extractPrivateCarAndGuide(parsed);
    } else if (detectLayout(parsed) === 'modern') {
      perLocale[locale] = extractModern(parsed);
    } else {
      perLocale[locale] = extractOlder(parsed);
    }
  }

  const result: ExtractedContent = { body: [], days: [], priceIndication: [], gallery: [] };

  // body (i18n PT)
  for (const locale of LOCALES) {
    const lc = perLocale[locale];
    if (lc.body) {
      const blocks = htmlToPortableText(lc.body, { locale }).blocks;
      if (blocks.length > 0) result.body.push({ _key: locale, _type: 'object', value: blocks });
    }
  }

  // priceIndication (i18n string)
  for (const locale of LOCALES) {
    const lc = perLocale[locale];
    if (lc.priceText) result.priceIndication.push({ _key: locale, value: lc.priceText });
  }

  // days[] — aligned by EN index; ES/JA filled where same index exists.
  const enDays = perLocale.en.days;
  for (let i = 0; i < enDays.length; i++) {
    const enDay = enDays[i];
    const titles: Array<{ _key: Locale; value: string }> = [];
    const mornings: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }> = [];
    for (const locale of LOCALES) {
      const localeDay = perLocale[locale].days[i];
      if (!localeDay) continue;
      if (localeDay.title) titles.push({ _key: locale, value: localeDay.title });
      if (localeDay.content) {
        const blocks = htmlToPortableText(localeDay.content, { locale }).blocks;
        if (blocks.length > 0) mornings.push({ _key: locale, _type: 'object', value: blocks });
      }
    }
    const day: TourDayDoc = {
      _type: 'tourDay',
      _key: `day-${enDay.num}`,
      dayNumber: enDay.num,
    };
    if (titles.length > 0) day.title = titles;
    if (mornings.length > 0) day.morning = mornings;
    result.days.push(day);
  }

  // gallery: EN-only. WP image data is locale-invariant; per-locale alt could
  // be revisited if/when ES/JA gallery captions diverge.
  result.gallery = perLocale.en.gallery.map((g, i) => ({
    _type: 'localizedImage' as const,
    _key: `gallery-${g.id ?? i}`,
    sourceUrl: g.url,
    ...(g.alt ? { alt: g.alt } : {}),
  }));

  return result;
}

// -- Layout detection -----------------------------------------------------------

function detectLayout(blocks: ElementorBlock[]): 'modern' | 'older' {
  function hasNestedTabs(arr: ElementorBlock[]): boolean {
    for (const el of arr) {
      if (el.widgetType === 'nested-tabs') return true;
      if (el.elements && hasNestedTabs(el.elements)) return true;
    }
    return false;
  }
  return hasNestedTabs(blocks) ? 'modern' : 'older';
}

// -- Tree walkers ---------------------------------------------------------------

function findFirst(
  arr: ElementorBlock[],
  predicate: (el: ElementorBlock) => boolean
): ElementorBlock | null {
  for (const el of arr) {
    if (predicate(el)) return el;
    if (el.elements) {
      const inner = findFirst(el.elements, predicate);
      if (inner) return inner;
    }
  }
  return null;
}

function findAll(
  arr: ElementorBlock[],
  predicate: (el: ElementorBlock) => boolean
): ElementorBlock[] {
  const out: ElementorBlock[] = [];
  function rec(items: ElementorBlock[]) {
    for (const el of items) {
      if (predicate(el)) out.push(el);
      if (el.elements) rec(el.elements);
    }
  }
  rec(arr);
  return out;
}

function collectTextEditorHtml(blocks: ElementorBlock[]): string {
  const editors = findAll(blocks, (el) => el.widgetType === 'text-editor');
  return editors.map((e) => String(e.settings?.editor ?? '')).join('\n\n');
}

// -- Accordion helpers ----------------------------------------------------------

function extractAccordionDays(
  accordion: ElementorBlock | null
): Array<{ num: number; title: string; content: string }> {
  if (!accordion) return [];
  const tabs: AccordionTab[] = (accordion.settings?.tabs ?? []) as AccordionTab[];
  const out: Array<{ num: number; title: string; content: string }> = [];
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const parsed = parseTabTitle(tab.tab_title ?? '', i);
    if (!parsed) continue;
    out.push({ num: parsed.num, title: parsed.title, content: tab.tab_content ?? '' });
  }
  return out;
}

function parseTabTitle(html: string, fallbackIndex?: number): { num: number; title: string } | null {
  // Canonical: <span class="bold">…Day N </span> <Day Title>
  const primary = /<span[^>]*class="[^"]*\bbold\b[^"]*"[^>]*>[\s\S]*?Day\s+(\d+)\s*<\/span>\s*(.*)/is.exec(html);
  if (primary) {
    return { num: Number(primary[1]), title: cleanDayTitle(primary[2]) };
  }
  // Secondary: any "Day N" with a trailing title.
  const fallback = /Day\s+(\d+)\b[^<]*(?:<\/[^>]+>)?\s*([\s\S]*)/is.exec(html);
  if (fallback) {
    return { num: Number(fallback[1]), title: cleanDayTitle(fallback[2]) };
  }
  // Tertiary: malformed source — use positional index, extract whatever plaintext survives.
  if (fallbackIndex !== undefined) {
    const plain = cleanDayTitle(html);
    if (plain) {
      return { num: fallbackIndex + 1, title: plain };
    }
  }
  return null;
}

/** Strip inline HTML then leading punctuation/whitespace that sat outside the bold span. */
function cleanDayTitle(rawHtml: string): string {
  return stripInlineTagsToPlain(rawHtml).trim().replace(/^[\s:;\-–—]+/, '').trim();
}

/**
 * Build per-locale summary from the first substantive PT block of body. Replaces
 * the prior WP-excerpt-based summary which leaked Elementor nav labels ("Overview
 * Itinerary Dates & Prices …", "Gallery Video Customizable Itinerary …") because
 * those labels live in the rendered page HTML that excerpt sampled.
 */
function buildSummaryFromExtractedBody(
  bodyByLocale: Array<{ _key: Locale; _type: 'object'; value: PtBlock[] }>
): Array<{ _key: Locale; value: string }> {
  const out: Array<{ _key: Locale; value: string }> = [];
  for (const entry of bodyByLocale) {
    const text = summaryFromBody(entry.value);
    if (text) out.push({ _key: entry._key, value: text });
  }
  return out;
}

function summaryFromBody(bodyPt: PtBlock[] | undefined): string | undefined {
  if (!bodyPt?.length) return undefined;
  let text = '';
  for (const block of bodyPt) {
    if ((block as any)._type !== 'block') continue;
    const blockText = ((block as any).children ?? [])
      .filter((c: any) => c._type === 'span')
      .map((c: any) => c.text ?? '')
      .join('')
      .trim();
    if (blockText) {
      text = blockText;
      if (text.length >= 50) break;
    }
  }
  if (!text) return undefined;
  text = text.replace(/^[\s:;\-–—]+/, '').trim();
  if (text.length <= 240) return text;
  const truncated = text.slice(0, 240);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 200 ? truncated.slice(0, lastSpace) : truncated).trim();
}

function stripInlineTagsToPlain(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// -- Per-layout extractors ------------------------------------------------------

function extractModern(blocks: ElementorBlock[]): PerLocaleContent {
  const nestedTabs = findFirst(blocks, (el) => el.widgetType === 'nested-tabs');
  if (!nestedTabs || !nestedTabs.elements) {
    return { days: [], gallery: [] };
  }

  // Convention: nested-tabs content lives in widget.elements[N], indexed
  // positionally by settings.tabs[]. Tabs are: 0=Overview, 1=Itinerary,
  // 2=Dates & Prices, 3=FAQs (FAQs intentionally not consumed).
  const overviewContainer = nestedTabs.elements[0];
  const itineraryContainer = nestedTabs.elements[1];
  const datesContainer = nestedTabs.elements[2];

  const body = overviewContainer
    ? collectTextEditorHtml(overviewContainer.elements ?? []) || undefined
    : undefined;

  const accordion = itineraryContainer
    ? findFirst(itineraryContainer.elements ?? [], (el) => el.widgetType === 'accordion')
    : null;
  const days = extractAccordionDays(accordion);

  // Dates & Prices: only text-editor prose. html widgets (all Bokun here)
  // are skipped structurally.
  // Dates & Prices tab is transactional pricing-schedule content (per-departure
  // dates, EUR amounts, "X Left" availability). Per Phase 2b.d.4 operator review,
  // this is not editorial content and should not migrate. Operator authors
  // priceIndication manually during editorial if desired.
  void datesContainer;
  const priceText: string | undefined = undefined;

  return { body, days, priceText, gallery: [] };
}

function extractOlder(blocks: ElementorBlock[]): PerLocaleContent {
  // Older layout is flat. Body is the first text-editor following an
  // "Overview" heading.
  const flat = findAll(blocks, (el) => !!el.widgetType);
  let body: string | undefined;
  for (let i = 0; i < flat.length; i++) {
    const el = flat[i];
    if (
      el.widgetType === 'heading' &&
      /^overview\s*$/i.test(stripInlineTagsToPlain(String(el.settings?.title ?? '')))
    ) {
      const next = flat[i + 1];
      if (next?.widgetType === 'text-editor') {
        body = String(next.settings?.editor ?? '') || undefined;
        break;
      }
    }
  }

  const accordion = findFirst(blocks, (el) => el.widgetType === 'accordion');
  const days = extractAccordionDays(accordion);

  // Gallery: image-carousel + image widgets.
  const carousels = findAll(blocks, (el) => el.widgetType === 'image-carousel');
  const singleImages = findAll(blocks, (el) => el.widgetType === 'image');
  const gallery: Array<{ id?: number; url: string; alt?: string }> = [];
  for (const c of carousels) {
    const imgs = (c.settings?.carousel ?? []) as Array<{ id?: number; url?: string; alt?: string }>;
    for (const img of imgs) {
      if (img.url) gallery.push({ id: img.id, url: img.url, alt: img.alt });
    }
  }
  for (const s of singleImages) {
    const img = s.settings?.image as { id?: number; url?: string; alt?: string } | undefined;
    if (img?.url) gallery.push({ id: img.id, url: img.url, alt: img.alt });
  }

  return { body, days, priceText: undefined, gallery };
}

function extractPrivateCarAndGuide(blocks: ElementorBlock[]): PerLocaleContent {
  // Single-tab "Suggested Itinerary Ideas" accordion → top-level body, not days[].
  const accordion = findFirst(blocks, (el) => el.widgetType === 'accordion');
  const tabs: AccordionTab[] = (accordion?.settings?.tabs ?? []) as AccordionTab[];
  const body = tabs.length > 0 ? (tabs[0].tab_content ?? undefined) : undefined;

  // Pricing: extract from "Tour Pricing Options" html widget BEFORE strip rules
  // would discard it. This is the only `html` widget the extractors pull.
  const pricingWidget = findFirst(
    blocks,
    (el) =>
      el.widgetType === 'html' &&
      typeof el.settings?.html === 'string' &&
      /Tour Pricing Options|tour-options-module|tour-booking-section|Choose Your (Package|Experience)/i.test(el.settings.html as string)
  );
  // Keep the package descriptions ("Tour Pricing Options Choose Your Package…",
  // "Choose Your Experience Select Package…") but drop the per-pax pricing matrix
  // ("Group Size 1 2 3 … Price (€) …"). The "Group Size" header reliably marks the
  // transactional boundary across all three private-car tours.
  let priceText: string | undefined;
  if (pricingWidget) {
    const fullText = plainText(pricingWidget.settings!.html as string);
    const groupSizeIdx = fullText.search(/\bGroup Size\b/i);
    priceText = (groupSizeIdx > 50 ? fullText.slice(0, groupSizeIdx) : fullText.slice(0, 500)).trim();
  }

  return { body, days: [], priceText, gallery: [] };
}
