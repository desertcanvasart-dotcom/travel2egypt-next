/**
 * Per-brand Autoura delivery routing (Session 13 — portfolio triage).
 *
 * The S9 delivery worker (sign / payload / deliver / reconcile / state machine)
 * is REUSED UNCHANGED — only the TARGET varies by routed_brand. `deliverBrief()`
 * resolves its endpoint from `deps.env = { url, secret }`; this module produces
 * that pair for a given brand, so routing is a one-line `depsOverride.env`.
 *
 * FALLBACK TO THE ANCHOR: a sub-brand whose own env pair is not fully set falls
 * back to the default Travel2Egypt endpoint (AUTOURA_WEBHOOK_URL /
 * AUTOURA_WEBHOOK_SECRET). So until the three sub-brand secrets are provisioned,
 * every route delivers to the existing Travel2Egypt Autoura account exactly as
 * today — the feature is built and verifiable before the new endpoints exist.
 * (deliver.ts still fail-closes to the email fallback if even the default pair
 * is missing.)
 */
import type { RoutedBrand } from '@/lib/concierge/brands';

/** Env-name prefixes for the sub-brands; the anchor uses the original S9 names. */
const SUBBRAND_ENV_PREFIX: Record<Exclude<RoutedBrand, 'travel2egypt'>, string> = {
  affordegypt: 'AUTOURA_AFFORDEGYPT',
  sawa: 'AUTOURA_SAWA',
  sillage: 'AUTOURA_SILLAGE',
};

export interface BrandEnv {
  url: string | undefined;
  secret: string | undefined;
  /**
   * Set ONLY when a sub-brand brief is delivered via the anchor fallback:
   * the shared inbox can't otherwise distinguish routed briefs (the wire
   * payload deliberately carries no brand field), so the deliverer prefixes
   * brief_summary with "[ROUTED: <TAG>]" for the team. Owner-approved
   * 2026-07-07. Disappears automatically once the brand's own env pair is
   * set (no fallback -> no tag), keeping real sub-brand endpoints clean.
   */
  routingTag?: string;
}

/** The default (anchor) Autoura endpoint — the original S9 env pair. */
function defaultEnv(): BrandEnv {
  return { url: process.env.AUTOURA_WEBHOOK_URL, secret: process.env.AUTOURA_WEBHOOK_SECRET };
}

/**
 * Resolve `{ url, secret }` for a brand. Sub-brands use their own pair when BOTH
 * are set, else fall back to the anchor endpoint. Passed verbatim as
 * `deliverBrief(briefId, { env })`.
 */
export function resolveBrandEnv(brand: RoutedBrand): BrandEnv {
  if (brand === 'travel2egypt') return defaultEnv();
  const prefix = SUBBRAND_ENV_PREFIX[brand];
  const url = process.env[`${prefix}_WEBHOOK_URL`];
  const secret = process.env[`${prefix}_WEBHOOK_SECRET`];
  if (url && secret) return { url, secret };
  // Not yet provisioned → deliver to the anchor, tagged for the shared inbox.
  return { ...defaultEnv(), routingTag: brand.toUpperCase() };
}
