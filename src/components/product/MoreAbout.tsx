'use client';

import type { ReactNode } from 'react';
import { track } from '@/lib/analytics';

/**
 * "More about this stop" (multi-day itinerary format, 2026-11-16): a native
 * <details>, collapsed by default, so the essay text stays in the HTML and
 * opens by keyboard (Enter / Space on the summary). Opening it sends GA4
 * select_content {content_type: itinerary_more, day}.
 */
export function MoreAbout({ label, day, slug, children }: { label: string; day: number | 'route'; slug: string; children: ReactNode }) {
  return (
    <details
      className="pdp-more"
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) {
          track('select_content', { content_type: 'itinerary_more', day: String(day), tour: slug });
        }
      }}
    >
      <summary>
        {label} <span aria-hidden="true">→</span>
      </summary>
      <div className="pdp-more__body">{children}</div>
    </details>
  );
}
