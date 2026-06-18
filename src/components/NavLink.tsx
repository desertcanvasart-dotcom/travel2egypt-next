'use client';

import type { ComponentProps, ReactNode } from 'react';

import { Link, usePathname } from '@/i18n/navigation';

/**
 * Primary-nav link that marks itself `aria-current="page"` (and adds the
 * `.active` class the nav CSS already styles) when the current route matches.
 * `usePathname` from next-intl returns the locale-stripped pathname, so the
 * same comparison works on /guide and /es/guide alike. Section links (e.g.
 * /guide) stay active on their detail pages (/guide/cairo) via the prefix test.
 */
export function NavLink({
  href,
  className,
  children,
  ...rest
}: ComponentProps<typeof Link> & { children: ReactNode }) {
  const pathname = usePathname();
  const target = typeof href === 'string' ? href : '';
  const active =
    target !== '' && (pathname === target || pathname.startsWith(`${target}/`));

  return (
    <Link
      href={href}
      className={[className, active ? 'active' : ''].filter(Boolean).join(' ')}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      {children}
    </Link>
  );
}
