/**
 * Legacy tour detail route. The canonical URL is now `/<slug>` at root,
 * rendered by the catch-all using the shared TourPageView component.
 *
 * This route redirects to the canonical URL so any old internal links,
 * sitemaps, or bookmarks still work. The redirect chain is a single
 * permanent 308; the catch-all then renders the tour natively.
 */
import { permanentRedirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function LegacyTourRedirect({ params }: Props) {
  const { locale, slug } = await params;
  permanentRedirect({ href: `/${slug}`, locale: locale as Locale });
}
