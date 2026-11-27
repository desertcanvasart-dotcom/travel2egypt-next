import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * Egypt Wiki landing redirects to /wiki/monuments for v1.
 *
 * Only the monuments sub-section ships in v1 (134 docs). The other three
 * sub-sections (deities, dynasties, people) are deferred to v2 and render
 * "Coming Soon" placeholders. Rather than show a landing page that
 * advertises sections that aren't ready, send visitors straight to the
 * live monuments index.
 *
 * It is a TEMPORARY redirect on purpose (the landing returns in v2), and a single hop:
 * the locale-aware redirect leaves the English path without a /en prefix. (It used to
 * redirect to /en/wiki/monuments, which the middleware then redirected again: two 307s.)
 *
 * To restore the full landing in v2: replace this redirect with the
 * previous featured-grid implementation (see git history at session 30).
 */
export default async function WikiLandingRedirect({ params }: Props) {
  const { locale } = await params;
  redirect({ href: '/wiki/monuments', locale: locale as Locale });
}
