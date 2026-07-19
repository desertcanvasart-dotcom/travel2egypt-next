'use client';

import { useCurrency } from '@/lib/currency-context';

/**
 * Indicative-conversion disclaimer. Shown only when the viewer's currency is not
 * the EUR base — the note text is passed pre-localized from the server.
 */
export function CurrencyNote({ note }: { note: string }) {
  const { currency } = useCurrency();
  if (currency === 'EUR' || !note) return null;
  return <p className="price-note price-note--ccy">{note}</p>;
}
