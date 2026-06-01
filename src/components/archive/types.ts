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
  /** Canonical value used for filtering (category value, city slug, …). */
  value: string;
  /** Human-readable display (e.g. "Luxury", "Cairo", "★★★★★"). */
  label: string;
  /** Visual treatment; defaults to 'text'. */
  render?: FacetRender;
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

export interface FacetFilterGroup {
  /** Matches ItemFacet.key. */
  key: string;
  /** URL query-param key the index syncs to. */
  paramKey: string;
  /** Localized group label, e.g. "Grade". */
  label: string;
  options: FacetFilterOption[];
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
