/**
 * Legacy package detail route. The canonical URL is now `/<slug>` at root,
 * rendered by the catch-all using the shared TourPageView component (which
 * handles packages: structured day grid, inclusions/exclusions, gallery).
 *
 * This route redirects to the canonical URL so any old internal links,
 * sitemaps, or bookmarks still work, preserving the active locale.
 */
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function LegacyPackageRedirect({ params }: Props) {
  const { locale, slug } = await params;
  redirect({ href: `/${slug}`, locale: locale as Locale });
}
