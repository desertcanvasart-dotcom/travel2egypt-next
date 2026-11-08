'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from '@/i18n/navigation';
import { track } from '@/lib/analytics';

/**
 * Hero quick finder (spec §1): pure URL routing to existing listing pages —
 * no search backend. Multi-day + length → the packages page, which filters
 * client-side on ?length; day tour + city → the city's day-tour landing;
 * Nile cruise → the cruises page. The month is carried as ?month so the
 * itinerary form can pre-fill it later; nothing filters on it.
 */
const CITY_PATHS: Record<string, string> = {
  cairo: '/cairo-private-day-tours',
  luxor: '/luxor-private-day-tours',
  aswan: '/aswan-private-day-tours',
  alexandria: '/alexandria-private-day-tours',
};

export function QuickFinder() {
  const router = useRouter();
  const [what, setWhat] = useState<'tour' | 'day' | 'cruise'>('tour');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => (typeof f.get(k) === 'string' ? (f.get(k) as string) : '');
    let href = '/egypt-travel-packages';
    if (what === 'tour') {
      const len = get('length');
      href = len ? `/egypt-travel-packages?length=${encodeURIComponent(len)}` : '/egypt-travel-packages';
    } else if (what === 'day') {
      href = CITY_PATHS[get('city')] ?? '/private-day-tours';
    } else {
      href = '/nile-cruises';
    }
    track('select_item', { item_list_name: 'quick_finder', item_id: href });
    router.push(href);
  }

  return (
    <form className="qf" onSubmit={onSubmit} aria-label="Find a tour">
      <label className="qf-field">
        <span>I want</span>
        <select value={what} onChange={(e) => setWhat(e.target.value as typeof what)}>
          <option value="tour">A multi-day tour</option>
          <option value="day">A day tour</option>
          <option value="cruise">A Nile cruise</option>
        </select>
      </label>
      {what === 'tour' && (
        <label className="qf-field">
          <span>for</span>
          <select name="length" defaultValue="6-9">
            <option value="">Any length</option>
            <option value="3-5">3–5 days</option>
            <option value="6-9">6–9 days</option>
            <option value="10-14">10–14 days</option>
            <option value="15+">15+ days</option>
          </select>
        </label>
      )}
      {what === 'day' && (
        <label className="qf-field">
          <span>in</span>
          <select name="city" defaultValue="cairo">
            <option value="cairo">Cairo &amp; Giza</option>
            <option value="luxor">Luxor</option>
            <option value="aswan">Aswan &amp; Abu Simbel</option>
            <option value="alexandria">Alexandria</option>
          </select>
        </label>
      )}
      <button type="submit" className="qf-go">
        Show tours
      </button>
    </form>
  );
}
