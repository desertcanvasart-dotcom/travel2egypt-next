'use client';

import { useEffect } from 'react';

import { track } from '@/lib/analytics';
import type { JourneyKey } from '@/lib/journeys/registry';

/** GA4 `view_journey {journey}` once per journey page view (Phase A §8). */
export function JourneyViewTracker({ journey }: { journey: JourneyKey }) {
  useEffect(() => {
    track('view_journey', { journey });
  }, [journey]);
  return null;
}
