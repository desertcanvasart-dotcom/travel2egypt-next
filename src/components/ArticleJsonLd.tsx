import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList, buildPageArticleSchema } from '@/lib/structured-data';

/**
 * Article + BreadcrumbList for editorial pages that had no structured data
 * (resources field guides, the travel-tips index; Ahrefs audit 2026-11-09).
 * Title and description are the page's own meta title and description.
 */
export async function ArticleJsonLd({
  title,
  description,
  path,
  locale,
  parent,
}: {
  title: string;
  description?: string | null;
  path: string;
  locale: Locale;
  /** Middle breadcrumb, e.g. the field-guides index. */
  parent?: { name: string; path: string };
}) {
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  const crumbs = [{ name: tNav('home'), path: '/' }, ...(parent ? [parent] : []), { name: title, path }];
  return (
    <JsonLd
      data={[
        buildPageArticleSchema({ title, description, path }, locale),
        buildBreadcrumbList(crumbs, locale),
      ]}
    />
  );
}
