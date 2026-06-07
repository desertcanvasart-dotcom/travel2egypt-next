import { createNavigation } from 'next-intl/navigation';
import type { ComponentProps, FC } from 'react';

import { routing, type Locale } from './routing';

/**
 * next-intl types navigation `href`/`pathname` strictly against the `pathnames`
 * map in routing.ts. This app passes many dynamic string hrefs (Sanity slugs at
 * the root, /tours/<slug>, /blog/category/<slug>, …) that are valid at RUNTIME:
 * next-intl localizes the known pathnames (e.g. /private-day-tours → JA romaji)
 * and passes unknown ones through unchanged.
 *
 * Rather than convert every dynamic href to next-intl's object form, we re-export
 * the navigation APIs with `string`-based types. Runtime localization is
 * unchanged — only the compile-time href type is relaxed.
 */
const nav = createNavigation(routing);

type LinkProps = Omit<ComponentProps<typeof nav.Link>, 'href' | 'locale'> & {
  href: string;
  locale?: Locale;
};
export const Link = nav.Link as unknown as FC<LinkProps>;

export const usePathname = nav.usePathname as unknown as () => string;

interface LooseRouter {
  push: (href: string, options?: { locale?: Locale; scroll?: boolean }) => void;
  replace: (href: string, options?: { locale?: Locale; scroll?: boolean }) => void;
  prefetch: (href: string, options?: { locale?: Locale }) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
}
export const useRouter = nav.useRouter as unknown as () => LooseRouter;

export const redirect = nav.redirect as unknown as (
  args: string | { href: string; locale?: Locale },
) => never;

export const getPathname = nav.getPathname as unknown as (args: {
  href: string;
  locale: Locale;
}) => string;
