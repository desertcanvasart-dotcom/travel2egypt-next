'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from '@/i18n/navigation';
import { track } from '@/lib/analytics';

import { HOME_COPY, localHref, type HomeLocale } from './copy';

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

export function QuickFinder({ locale }: { locale: HomeLocale }) {
  const c = HOME_COPY[locale];
  const f = c.finder;
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
    router.push(localHref(c, href));
  }

  return (
    <form className="qf" onSubmit={onSubmit} aria-label={f.label}>
      <label className="qf-field">
        <span>{f.want}</span>
        <select value={what} onChange={(e) => setWhat(e.target.value as typeof what)}>
          <option value="tour">{f.tour}</option>
          <option value="day">{f.day}</option>
          <option value="cruise">{f.cruise}</option>
        </select>
      </label>
      {what === 'tour' && (
        <label className="qf-field">
          <span>{f.lengthLabel}</span>
          <select name="length" defaultValue="6-9">
            <option value="">{f.anyLength}</option>
            {(['3-5', '6-9', '10-14', '15+'] as const).map((b) => (
              <option key={b} value={b}>
                {f.lengths[b]}
              </option>
            ))}
          </select>
        </label>
      )}
      {what === 'day' && (
        <label className="qf-field">
          <span>{f.cityLabel}</span>
          <select name="city" defaultValue="cairo">
            {(['cairo', 'luxor', 'aswan', 'alexandria'] as const).map((k) => (
              <option key={k} value={k}>
                {c.dayTours.cities[k].label}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="submit" className="qf-go">
        {f.go}
      </button>
    </form>
  );
}
