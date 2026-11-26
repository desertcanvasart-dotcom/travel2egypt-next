/**
 * Visible breadcrumb trail. Shared across guide pages, leaf articles, and
 * (eventually) other detail pages so the style + a11y stay consistent.
 *
 * Renders as a <nav> with an ordered list; the last item is non-clickable
 * and carries aria-current="page".
 *
 * Pages should also emit the matching JSON-LD via `buildBreadcrumbList()`
 * from `lib/structured-data`. This component intentionally renders the
 * visible HTML only — schema emission stays at the page level so we don't
 * double up or get into stale-data shape issues during SSR.
 */
import { Link } from '@/i18n/navigation';

export interface BreadcrumbCrumb {
  /** Display text for this segment. Already localized by the caller. */
  label: string;
  /**
   * Locale-relative href. Omit to render as a plain non-link span (e.g.
   * the final "current page" segment, or a sidebar grouping label that
   * isn't a navigable URL on its own).
   */
  href?: string;
}

export function Breadcrumb({
  items,
  className = '',
}: {
  items: BreadcrumbCrumb[];
  className?: string;
}) {
  if (items.length === 0) return null;
  // One breadcrumb style site-wide (design review #7, 19 Nov 2026): the tour
  // pages' `.t2e-crumb` — small sans capitals, "/" separators (tour-chrome.css).
  // `--inline` drops its top padding: these pages place it inside their own
  // padded container. Phones show only the nearest parent link (same file).
  return (
    <nav aria-label="Breadcrumb" className={`t2e-crumb t2e-crumb--inline ${className}`}>
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i}>
              {item.href && !isLast ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
