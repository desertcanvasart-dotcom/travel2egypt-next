/**
 * Single source of truth for turning a Sanity image hotspot into a CSS
 * `object-position` value, so every full-bleed hero crops toward the
 * editor's focal point instead of the geometric centre.
 *
 * Used by JourneyImage (full-bleed branch) and the bespoke heroes that
 * render their own <Image fill> (the guide/city page hero, PlaceHero).
 * Fixed-ratio surfaces don't need this — they bake a hotspot-aware crop
 * server-side via the Sanity image URL builder — but a viewport-height
 * hero is cover-cropped by CSS, and only `object-position` can steer
 * that crop toward the hotspot.
 */

export interface SanityHotspot {
  x?: number;
  y?: number;
}

/**
 * `{ x: 0.8, y: 0.25 }` → `"80.00% 25.00%"`. Returns undefined when the
 * hotspot is missing or malformed, so the caller can omit the style and
 * fall back to the CSS default (50% 50%).
 */
export function objectPositionFromHotspot(
  hotspot?: SanityHotspot | null,
): string | undefined {
  if (
    hotspot &&
    typeof hotspot.x === 'number' &&
    typeof hotspot.y === 'number'
  ) {
    return `${(hotspot.x * 100).toFixed(2)}% ${(hotspot.y * 100).toFixed(2)}%`;
  }
  return undefined;
}
