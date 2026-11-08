'use client';

import type { ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { track } from '@/lib/analytics';

/**
 * A product link that records GA4 `select_item` (item_list_name = homepage
 * section) before navigating — the "homepage → product click rate" measure.
 */
export function TrackedLink({
  href,
  listName,
  itemId,
  className,
  children,
}: {
  href: string;
  listName: string;
  itemId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track('select_item', { item_list_name: listName, item_id: itemId })}
    >
      {children}
    </Link>
  );
}
