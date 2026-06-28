/**
 * The family of brands (Session 13 — portfolio triage).
 *
 * Canonical controlled vocabulary shared by the DB (conversations.routed_brand,
 * briefs.delivered_brand — migration 0007), the per-brand Autoura routing
 * (autoura/routing.ts), and the admin panel. 'travel2egypt' is the anchor and
 * the default: every conversation is the main house unless explicitly routed.
 */

export const ROUTED_BRANDS = ['travel2egypt', 'affordegypt', 'sawa', 'sillage'] as const;

export type RoutedBrand = (typeof ROUTED_BRANDS)[number];

/** The anchor / default room. Routing here is never wrong (the house serves everyone). */
export const DEFAULT_BRAND: RoutedBrand = 'travel2egypt';

export function isRoutedBrand(value: unknown): value is RoutedBrand {
  return typeof value === 'string' && (ROUTED_BRANDS as readonly string[]).includes(value);
}

/** Coerce a DB string (typed loosely as `string`) to a RoutedBrand, defaulting to the anchor. */
export function coerceBrand(value: unknown): RoutedBrand {
  return isRoutedBrand(value) ? value : DEFAULT_BRAND;
}

/** Human-facing labels for the admin panel. */
export const BRAND_LABELS: Record<RoutedBrand, string> = {
  travel2egypt: 'Travel2Egypt',
  affordegypt: 'AffordEgypt',
  sawa: 'Sawa',
  sillage: 'Sillage',
};
