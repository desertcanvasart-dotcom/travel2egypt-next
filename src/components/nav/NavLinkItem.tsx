'use client';

import type { ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { Price } from '@/components/Price';
import { track } from '@/lib/analytics';

import type { NavLeaf } from './types';

export type NavSurface = 'header' | 'mobile' | 'footer' | 'footer_band' | 'brand_route';

/** "from {price}" with the price in the visitor's currency (client <Price>). */
export function FromPrice({ eur, template }: { eur: number; template: string }) {
  const [before, after] = template.split('{price}');
  return (
    <>
      {before}
      <Price eur={eur} />
      {after}
    </>
  );
}

/**
 * One menu link, internal (locale-aware) or external (new tab, noopener).
 * Fires the diagnostic `nav_click` event; never blocks navigation.
 */
export function NavLinkItem({
  item,
  menu,
  group,
  position,
  className,
  onNavigate,
  children,
  role,
}: {
  item: NavLeaf;
  menu: NavSurface;
  group: string;
  position: number;
  className?: string;
  onNavigate?: () => void;
  children?: ReactNode;
  role?: string;
}) {
  const onClick = () => {
    track('nav_click', { menu, group, item: item.id, position });
    onNavigate?.();
  };
  const body = children ?? item.label;
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick} role={role}>
        {body}
      </a>
    );
  }
  return (
    <Link href={item.href as never} className={className} onClick={onClick} role={role}>
      {body}
    </Link>
  );
}
