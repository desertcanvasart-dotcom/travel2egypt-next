'use client';

import type { ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { track } from '@/lib/analytics';
import { useLead } from '@/components/leads/LeadProvider';
import type { LeadSource } from '@/lib/leads/schema';

/**
 * Client bits of a RelatedToursBlock card: the "View tour" link and the
 * Check-this-date / Customise button. Both record GA4 select_item with
 * item_list_name = article_inline | article_end and the article slug.
 */
interface Common {
  listName: 'article_inline' | 'article_end';
  articleSlug: string;
  tourSlug: string;
}

export function TourViewLink({ listName, articleSlug, tourSlug, className, children }: Common & { className?: string; children: ReactNode }) {
  return (
    <Link
      href={`/${tourSlug}`}
      className={className}
      onClick={() => track('select_item', { item_list_name: listName, item_id: tourSlug, article: articleSlug, action: 'view' })}
    >
      {children}
    </Link>
  );
}

export function TourRequestButton({
  listName,
  articleSlug,
  tourSlug,
  tourTitle,
  type,
  durationDays,
  priceFromEur,
  label,
  className,
}: Common & {
  tourTitle: string;
  type?: string | null;
  durationDays?: number | null;
  priceFromEur?: number | null;
  label: string;
  className?: string;
}) {
  const { open } = useLead();
  const isDay = type === 'dayTour';
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        track('select_item', { item_list_name: listName, item_id: tourSlug, article: articleSlug, action: 'request' });
        const source: LeadSource = isDay ? 'day_tour_card' : 'tour_card';
        open(
          isDay
            ? { source, kind: 'day_tour', tourSlug, tourTitle, priceFromEur }
            : { source, kind: 'trip', tourSlug, tourTitle, durationDays },
        );
      }}
    >
      {label}
    </button>
  );
}
