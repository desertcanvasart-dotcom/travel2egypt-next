/**
 * Visible breadcrumb trail. Shared across guide pages, leaf articles, and
 * (eventually) other detail pages so the style + a11y stay consistent.
 *
 * Renders as a <nav> with an ordered list; the last item is non-clickable
 * and gets a subtly different colour to mark "current page".
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
  return (
    <nav
      aria-label="Breadcrumb"
      className={`font-sans text-xs uppercase tracking-[0.12em] text-ink-muted ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-ink-muted/60">
                  ›
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-orange-deep"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'text-ink-soft' : ''}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
