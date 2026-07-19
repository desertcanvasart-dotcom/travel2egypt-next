'use client';

import { formatPrice } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';

/**
 * Renders a stored EUR amount in the viewer's chosen currency. Client component
 * so the price personalises after hydration without fragmenting the page cache.
 * Renders nothing for a missing/non-finite amount (callers show "On inquiry").
 */
export function Price({ eur, unit }: { eur: number | null | undefined; unit?: string }) {
  const { currency } = useCurrency();
  const s = formatPrice(eur, currency, unit);
  return s ? <>{s}</> : null;
}
