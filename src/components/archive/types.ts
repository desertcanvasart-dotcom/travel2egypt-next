/**
 * Generic archive model. The ArchiveTemplate renders these types and nothing
 * type-specific — a new archive (tours, cruises, tips) supplies its own mapping
 * from raw docs to ArchiveItem plus a facet config, and reuses the template
 * unchanged. See ./README.md.
 */

/** How a facet renders on cards and index rows. */
export type FacetRender = 'badge' | 'stars' | 'text';

export interface ItemFacet {
  /** Stable key matching a FacetFilterGroup, e.g. 'grade' | 'stars' | 'city'. */
  key: string;
  /** Canonical value used for exact-match filtering, or a pre-bucketed key for a range facet. */
  value: string;
  /** Human-readable display (e.g. "Luxury", "Cairo", "★★★★★", "Full day"). */
  label: string;
  /** Visual treatment; defaults to 'text'. */
  render?: FacetRender;
  /**
   * Numeric value for a `range` facet (e.g. durationHours, nights). When set,
   * the index buckets it via the group's `buckets`; when absent, the index
   * falls back to exact-matching `value` against the bucket key.
   */
  numericValue?: number;
}

export interface ArchiveItem {
  _id: string;
  title: string;
  /** Locale-relative href to the item's detail page. */
  href: string;
  summary?: string;
  image?: { asset?: unknown; alt?: string } | null;
  /** Ordered facets rendered generically on cards and rows. */
  facets: ItemFacet[];
}

export interface FacetFilterOption {
  value: string;
  label: string;
}

/**
 * A range bucket for a `range` facet. `max` is inclusive; omit it for an
 * open-ended top bucket (e.g. "Extended · 2 days+").
 */
export interface RangeBucket {
  key: string;
  label: string;
  min: number;
  max?: number;
}

export interface FacetFilterGroup {
  /** Matches ItemFacet.key. */
  key: string;
  /** URL query-param key the index syncs to. */
  paramKey: string;
  /** Localized group label, e.g. "Grade" / "Length". */
  label: string;
  /** Pills shown for the group. For a range facet these mirror the buckets. */
  options: FacetFilterOption[];
  /** 'exact' (default) matches facet.value === selected; 'range' buckets a numeric value. */
  kind?: 'exact' | 'range';
  /** Ordered buckets for a range facet (required when kind === 'range'). */
  buckets?: RangeBucket[];
  /** Optional italic hint shown under the group (e.g. the range explanation). */
  hint?: string;
  /** Label for the "clear" pill (defaults to the shared "All"); e.g. "Any length". */
  allLabel?: string;
}

/** Resolve a numeric value to its bucket key, or null if it fits none. */
export function bucketKeyForValue(buckets: RangeBucket[], value: number): string | null {
  for (const b of buckets) {
    if (value >= b.min && (b.max == null || value <= b.max)) return b.key;
  }
  return null;
}

/** A city-navigator entry: already-resolved, localized, with a live count. */
export interface NavigatorItem {
  id: string;
  cityName: string;
  note?: string;
  /** Preformatted, localized count label, e.g. "14 tours". */
  countLabel: string;
  href: string;
}

export interface NavigatorConfig {
  heading: string;
  intro?: string;
  items: NavigatorItem[];
}

export type CollectionVariant = 'lead' | 'pair' | 'trio';

export interface ArchiveCollection {
  /** Optional eyebrow; the template falls back to "Collection №N". */
  kicker?: string;
  title: string;
  intro?: string;
  variant: CollectionVariant;
  items: ArchiveItem[];
}

/** Find a facet by key on an item. */
export function facetOf(item: ArchiveItem, key: string): ItemFacet | undefined {
  return item.facets.find((f) => f.key === key);
}
