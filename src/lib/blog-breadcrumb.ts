/**
 * Single source of truth for the Journal's breadcrumb trail, so the landing,
 * category (root + leaf), and article routes — plus their JSON-LD — never
 * drift. The editorial taxonomy is two tiers (section root → leaf
 * subcategory; no grandchildren), so a category carries at most one parent.
 *
 * Convention matches the rest of the site (guide/city pages): the trail
 * starts with a localized "Home" crumb, then "Journal", then the category
 * chain, then the current page. Every node keeps an href; the visible
 * breadcrumb drops the last one (current page), the JSON-LD keeps them all.
 */

import type { BreadcrumbCrumb } from '@/components/Breadcrumb';
import type { BreadcrumbItem } from '@/lib/structured-data';

export interface BlogCategoryNode {
  name: string;
  slug: string;
  /** The section root for a leaf; null/absent for a root bucket. */
  parent?: { name: string; slug: string } | null;
}

interface BlogTrailInput {
  homeLabel: string;
  journalLabel: string;
  /** The page's category. Omit only for the bare landing. */
  category?: BlogCategoryNode | null;
  /** Present on an article: the category becomes a link and the title is the current crumb. */
  article?: { title: string; slug: string };
}

export interface TrailNode {
  label: string;
  href: string;
}

/**
 * Build the full Home → Journal → [section] → [subcategory] → [current] trail.
 * A missing/dangling parent simply drops the section crumb rather than break.
 */
export function buildBlogTrail(input: BlogTrailInput): TrailNode[] {
  const { homeLabel, journalLabel, category, article } = input;
  const trail: TrailNode[] = [
    { label: homeLabel, href: '/' },
    { label: journalLabel, href: '/blog' },
  ];
  if (category) {
    if (category.parent?.name && category.parent.slug) {
      trail.push({
        label: category.parent.name,
        href: `/blog/category/${category.parent.slug}`,
      });
    }
    trail.push({ label: category.name, href: `/blog/category/${category.slug}` });
  }
  if (article) {
    trail.push({ label: article.title, href: `/blog/${article.slug}` });
  }
  return trail;
}

/** Visible breadcrumb crumbs: last node is the current page, so its href is dropped. */
export function toVisibleCrumbs(trail: TrailNode[]): BreadcrumbCrumb[] {
  return trail.map((node, i) =>
    i === trail.length - 1 ? { label: node.label } : { label: node.label, href: node.href }
  );
}

/** JSON-LD BreadcrumbList items: every node keeps its path. */
export function toSchemaCrumbs(trail: TrailNode[]): BreadcrumbItem[] {
  return trail.map((node) => ({ name: node.label, path: node.href }));
}
