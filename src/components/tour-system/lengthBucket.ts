/**
 * Length bucket for a day tour — the shared UI affordance behind the
 * "Half day / Full day / Extended" length facet on both the L1 category index
 * and the L2 single-city index. Kept in one place so the two indexes never drift.
 */
export interface BucketableTour {
  title?: string;
  slug?: string;
  durationHours?: number;
  durationDays?: number;
}

export function bucketKey(tour: BucketableTour): 'half' | 'full' | 'extended' {
  if (typeof tour.durationHours === 'number') {
    if (tour.durationHours <= 5) return 'half';
    if (tour.durationHours >= 11) return 'extended';
    return 'full';
  }
  if (typeof tour.durationDays === 'number' && tour.durationDays >= 2) return 'extended';
  const text = `${tour.title ?? ''} ${tour.slug ?? ''}`.toLowerCase();
  if (/\b(two|three|2|3)[ -]?days?\b|overnight|by road/.test(text)) return 'extended';
  if (/half[ -]?day|sunrise|sunset|balloon|by night|morning only/.test(text)) return 'half';
  return 'full';
}

/**
 * Length bucket for a multi-day PACKAGE — the affordance behind the package
 * category index's length facet (Up to 5 / 6–9 / 10–14 / 15 days+). Keyed by
 * day count; packages without a numeric duration land in the broad middle
 * bucket so the row still appears under the most common filter.
 */
export function packageBucketKey(durationDays?: number): 'le5' | '6to9' | '10to14' | '15plus' {
  if (typeof durationDays !== 'number' || !Number.isFinite(durationDays)) return '6to9';
  if (durationDays <= 5) return 'le5';
  if (durationDays <= 9) return '6to9';
  if (durationDays <= 14) return '10to14';
  return '15plus';
}
