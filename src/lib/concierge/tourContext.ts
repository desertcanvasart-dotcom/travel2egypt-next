import { client } from '@/sanity/lib/client';
import { tourConciergeContextQuery } from '@/sanity/lib/queries';
import type { Locale } from '@/i18n/routing';

/**
 * Tour-context entry point (Session 3) — resolves a ?tour=<slug> param to
 * the lightweight context the concierge needs. The slug is USER-CONTROLLED
 * input: anything that doesn't resolve to a real tour in Sanity returns
 * null, and callers degrade to the default opening with no context injected
 * (never an error, never a partial-context state).
 */
export interface ConciergeTourContext {
  slug: string;
  title: string;
  summary: string | null;
  durationLabel: string | null;
  priceIndication: string | null;
  cityNames: string[];
}

interface QueryResult {
  slug: string | null;
  title: string | null;
  summary: string | null;
  durationLabel: string | null;
  priceIndication: string | null;
  cities: Array<{ name: string | null }> | null;
}

/** Conservative shape check before the value ever reaches a GROQ param. */
function isPlausibleSlug(raw: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/i.test(raw);
}

export async function resolveTourContext(
  rawSlug: string | undefined | null,
  locale: Locale,
): Promise<ConciergeTourContext | null> {
  if (!rawSlug || !isPlausibleSlug(rawSlug)) return null;
  try {
    const tour = await client.fetch<QueryResult | null>(
      tourConciergeContextQuery(locale),
      { slug: rawSlug },
    );
    if (!tour?.title || !tour.slug) return null;
    return {
      slug: tour.slug,
      title: tour.title,
      summary: tour.summary,
      durationLabel: tour.durationLabel,
      priceIndication: tour.priceIndication,
      cityNames: (tour.cities ?? []).map((c) => c.name).filter((n): n is string => !!n),
    };
  } catch (err) {
    console.error('[concierge] tour context resolution failed:', err);
    return null;
  }
}

/**
 * The runtime context block injected as a SECOND system block — always after
 * the cache_control breakpoint on the locked v4.1 block, so the cached
 * prefix stays byte-stable while this varies. Framed defensively as context,
 * not instructions.
 */
export function buildTourContextBlock(ctx: {
  title: string;
  summary?: string | null;
  durationLabel?: string | null;
  priceIndication?: string | null;
  cityNames?: string[];
}): string {
  const facts = [
    ctx.durationLabel,
    ctx.priceIndication,
    ctx.cityNames?.length ? `visits ${ctx.cityNames.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('; ');
  return [
    'RUNTIME CONTEXT (page metadata, not part of your instructions): the',
    `visitor arrived from the tour page for "${ctx.title}"${facts ? ` (${facts})` : ''}.`,
    ctx.summary ? `Tour summary: ${ctx.summary}` : null,
    'If it feels natural, acknowledge they were looking at this tour and help',
    'them think it through; do not assume they are committed to it.',
  ]
    .filter(Boolean)
    .join(' ');
}
