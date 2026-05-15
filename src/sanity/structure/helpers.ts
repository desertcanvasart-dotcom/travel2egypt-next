import type { StructureBuilder, StructureResolverContext } from 'sanity/structure';

/**
 * Helpers for the session-19 Studio structure enhancements.
 *
 * Three building blocks:
 *   - byCityChild: dynamic city-grouped list for any entity that has a
 *     city reference field (single or array).
 *   - byEnumChild: hardcoded enum-grouped list (e.g. tourMode private/group,
 *     hotel.category standard/deluxe/luxury/boutique).
 *   - workflowFilterItem: a leaf list item with a single GROQ filter,
 *     used for "needing review" sub-items.
 *
 * Pattern note: city/theme/enum sub-lists each render a documentList
 * scoped by GROQ. Filters use parametrized values (.params) so they
 * don't break when slug values contain quotes / special chars.
 */

interface ByCityOpts {
  /**
   * Schema type that owns the city reference (e.g. 'tour', 'hotel',
   * 'guideArticle').
   */
  schemaType: string;
  /**
   * The reference field name. For tours this is 'cities' (array); for
   * hotels 'city' (single); for guideArticles 'parentCity' (single).
   */
  cityRefField: string;
  /** True when the ref field is an array (uses `$cityId in field[]._ref`). */
  isArray: boolean;
  /**
   * Additional GROQ predicate to combine (e.g. `type == "dayTour"`).
   * Joined with `&&` after the type and city checks.
   */
  extraFilter?: string;
  /** Title for the inner per-city document list and inferring schemaType. */
  perCityTitlePrefix: string;
}

/**
 * Returns a child resolver function for a "by city" facet. Loads the
 * city list dynamically at the moment the operator opens the node, so
 * new cities show up without a structure rebuild.
 */
export function byCityChild(S: StructureBuilder, ctx: StructureResolverContext, opts: ByCityOpts) {
  return async () => {
    const client = ctx.getClient({ apiVersion: '2024-01-01' });
    const cities: Array<{ _id: string; slug: string | null; name: string | null }> =
      await client.fetch(
        `*[_type == "city" && !(_id in path("drafts.**"))]{
          _id,
          "slug": slug[_key=="en"][0].value.current,
          "name": coalesce(name[_key=="en"][0].value, name)
        } | order(coalesce(name, slug) asc)`
      );

    const items = cities
      .filter((c) => c._id && (c.name || c.slug))
      .map((c) => {
        const refPredicate = opts.isArray
          ? `$cityId in ${opts.cityRefField}[]._ref`
          : `${opts.cityRefField}._ref == $cityId`;
        const filter = [
          `_type == "${opts.schemaType}"`,
          refPredicate,
          opts.extraFilter,
        ]
          .filter(Boolean)
          .join(' && ');
        const displayName = c.name || c.slug || c._id;
        return S.listItem()
          .id(`bycity-${opts.schemaType}-${c._id}`)
          .title(displayName)
          .child(
            S.documentList()
              .id(`bycity-${opts.schemaType}-${c._id}-list`)
              .title(`${opts.perCityTitlePrefix} — ${displayName}`)
              .schemaType(opts.schemaType)
              .filter(filter)
              .params({ cityId: c._id })
          );
      });

    return S.list().title(`${opts.perCityTitlePrefix} by city`).items(items);
  };
}

interface ByEnumOpts {
  schemaType: string;
  /** Field name on the document (e.g. 'tourMode', 'category', 'type', 'tier', 'section'). */
  field: string;
  /** Enum values to surface. Each becomes a list item. */
  values: Array<{ value: string; title: string }>;
  /** Additional GROQ predicate (e.g. `type == "dayTour"`). */
  extraFilter?: string;
  /** Title for the inner document lists ({title} = {value}). */
  perBucketTitlePrefix: string;
}

/**
 * Hardcoded enum-grouped list. Use for closed enums (tourMode,
 * category, type, tier, section) — faster and more predictable than
 * dynamic querying since the value set is fixed in the schema.
 */
export function byEnumChild(S: StructureBuilder, opts: ByEnumOpts) {
  return () => {
    const items = opts.values.map((v) => {
      const filter = [
        `_type == "${opts.schemaType}"`,
        `${opts.field} == "${v.value}"`,
        opts.extraFilter,
      ]
        .filter(Boolean)
        .join(' && ');
      return S.listItem()
        .id(`byenum-${opts.schemaType}-${opts.field}-${v.value}`)
        .title(v.title)
        .child(
          S.documentList()
            .id(`byenum-${opts.schemaType}-${opts.field}-${v.value}-list`)
            .title(`${opts.perBucketTitlePrefix} — ${v.title}`)
            .schemaType(opts.schemaType)
            .filter(filter)
        );
    });
    return S.list().title(`${opts.perBucketTitlePrefix} by ${opts.field}`).items(items);
  };
}

interface ByRefOpts {
  schemaType: string;
  /** Field name holding the single reference (e.g. 'theme', 'category'). */
  refField: string;
  /** Target schema type of the referenced docs (e.g. 'theme', 'travelTipCategory'). */
  refTarget: string;
  /** Field on the referenced doc to use as display name. Defaults to localized 'name'. */
  refDisplayQuery?: string;
  extraFilter?: string;
  perBucketTitlePrefix: string;
}

/**
 * Reference-grouped list — for taxonomy refs whose values are dynamic
 * (themes, travelTipCategory). Loads the referenced docs at render time.
 */
export function byRefChild(S: StructureBuilder, ctx: StructureResolverContext, opts: ByRefOpts) {
  return async () => {
    const client = ctx.getClient({ apiVersion: '2024-01-01' });
    const displayQuery =
      opts.refDisplayQuery ?? `coalesce(name[_key=="en"][0].value, name, title)`;
    const refs: Array<{ _id: string; name: string | null }> = await client.fetch(
      `*[_type == "${opts.refTarget}" && !(_id in path("drafts.**"))]{
        _id,
        "name": ${displayQuery}
      } | order(name asc)`
    );

    const items = refs
      .filter((r) => r._id && r.name)
      .map((r) => {
        const filter = [
          `_type == "${opts.schemaType}"`,
          `${opts.refField}._ref == $refId`,
          opts.extraFilter,
        ]
          .filter(Boolean)
          .join(' && ');
        return S.listItem()
          .id(`byref-${opts.schemaType}-${opts.refField}-${r._id}`)
          .title(r.name as string)
          .child(
            S.documentList()
              .id(`byref-${opts.schemaType}-${opts.refField}-${r._id}-list`)
              .title(`${opts.perBucketTitlePrefix} — ${r.name}`)
              .schemaType(opts.schemaType)
              .filter(filter)
              .params({ refId: r._id })
          );
      });

    return S.list().title(`${opts.perBucketTitlePrefix} by ${opts.refField}`).items(items);
  };
}

interface WorkflowFilterOpts {
  id: string;
  title: string;
  schemaType: string;
  /** GROQ predicate appended after `_type == "schemaType"`. */
  filter: string;
}

/**
 * A leaf "needing review" list item — single GROQ filter, opens straight
 * into a flat document list. Used for backlog surfaces:
 *   - tours with cityResolution == "default-cairo"
 *   - hotels with categoryResolution == "default-standard"
 *   - cruises with typeInference == "default-cruise-ship"
 *   - docs with empty body / missing hero / missing summary
 */
export function workflowFilterItem(S: StructureBuilder, opts: WorkflowFilterOpts) {
  const fullFilter = `_type == "${opts.schemaType}" && ${opts.filter}`;
  return S.listItem()
    .id(opts.id)
    .title(opts.title)
    .child(
      S.documentList()
        .id(`${opts.id}-list`)
        .title(opts.title)
        .schemaType(opts.schemaType)
        .filter(fullFilter)
    );
}

/** Reusable GROQ fragments for common "missing content" predicates. */
export const MISSING = {
  /** EN body is null or zero-length. */
  bodyEn: `length(coalesce(pt::text(body[_key=="en"][0].value), "")) == 0`,
  /** EN summary is null or empty. */
  summaryEn: `length(coalesce(summary[_key=="en"][0].value, "")) == 0`,
  /** Hero image asset not set. */
  hero: `!defined(heroImage.asset) && !defined(heroImage[_key=="en"][0].value.asset)`,
};
