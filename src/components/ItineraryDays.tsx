import type { Locale } from '@/i18n/routing';
import { Body } from '@/components/Body';

export interface ItineraryDay {
  dayNumber?: number;
  title?: string;
  cities?: Array<{ _id?: string; name?: string; slug?: string }>;
  morning?: unknown;
  lunch?: string;
  afternoon?: unknown;
  meals?: string;
  /** Cruise: overnight mooring. Tour: hotel/lodging note. */
  overnight?: string;
  accommodation?: string;
  transport?: string;
  paceRating?: number;
  highlights?: string[];
  suggestedActivities?: string[];
  photoSpots?: string[];
}

interface Labels {
  itinerary: string;
  day: (n: number) => string;
  meals: string;
  /** "Overnight" for cruise, "Stay" / "Accommodation" for tour. */
  stay: string;
  transport?: string;
  pace?: string;
  suggested?: string;
  photoSpots?: string;
}

interface Props {
  days: ItineraryDay[];
  locale: Locale;
  labels: Labels;
}

export function ItineraryDays({ days, locale, labels }: Props) {
  const sorted = days.slice().sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0));
  if (sorted.length === 0) return null;

  return (
    <section className="mt-16 border-t border-line pt-12">
      <h2 className="mb-6 font-serif text-3xl font-medium text-ink">
        {labels.itinerary}
      </h2>
      <ol className="space-y-10">
        {sorted.map((day, idx) => {
          const stay = day.overnight ?? day.accommodation;
          return (
            <li key={`day-${day.dayNumber ?? idx}`} className="border-l-2 border-orange-soft pl-6">
              <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-deep">
                {labels.day(day.dayNumber ?? idx + 1)}
                {day.cities && day.cities.length > 0 && (
                  <span className="ml-3 font-normal normal-case tracking-normal text-ink-muted">
                    {day.cities.map((c) => c.name).filter(Boolean).join(' · ')}
                  </span>
                )}
              </p>
              {day.title && (
                <h3 className="mb-3 font-serif text-2xl font-medium text-ink">{day.title}</h3>
              )}
              {Boolean(day.morning) && (
                <div className="prose-editorial mb-3 max-w-none text-ink-soft">
                  <Body value={day.morning} locale={locale} />
                </div>
              )}
              {day.lunch && (
                <p className="mb-3 text-sm italic text-ink-muted">{day.lunch}</p>
              )}
              {Boolean(day.afternoon) && (
                <div className="prose-editorial mb-3 max-w-none text-ink-soft">
                  <Body value={day.afternoon} locale={locale} />
                </div>
              )}
              {day.highlights && day.highlights.length > 0 && (
                <ul className="mb-3 space-y-1.5 text-sm text-ink-soft">
                  {day.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2 leading-relaxed">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-orange-deep" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
              {labels.suggested && day.suggestedActivities && day.suggestedActivities.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    {labels.suggested}
                  </p>
                  <ul className="space-y-1 text-sm text-ink-soft">
                    {day.suggestedActivities.map((a, i) => (
                      <li key={i} className="flex gap-2 leading-relaxed">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {labels.photoSpots && day.photoSpots && day.photoSpots.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    {labels.photoSpots}
                  </p>
                  <ul className="space-y-1 text-sm text-ink-soft">
                    {day.photoSpots.map((p, i) => (
                      <li key={i} className="flex gap-2 leading-relaxed">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
                {day.meals && (
                  <div className="flex gap-1.5">
                    <dt className="font-semibold uppercase tracking-wider">{labels.meals}:</dt>
                    <dd>{day.meals}</dd>
                  </div>
                )}
                {stay && (
                  <div className="flex gap-1.5">
                    <dt className="font-semibold uppercase tracking-wider">{labels.stay}:</dt>
                    <dd>{stay}</dd>
                  </div>
                )}
                {labels.transport && day.transport && (
                  <div className="flex gap-1.5">
                    <dt className="font-semibold uppercase tracking-wider">{labels.transport}:</dt>
                    <dd>{day.transport}</dd>
                  </div>
                )}
                {labels.pace && typeof day.paceRating === 'number' && (
                  <div className="flex gap-1.5">
                    <dt className="font-semibold uppercase tracking-wider">{labels.pace}:</dt>
                    <dd>{'●'.repeat(day.paceRating)}{'○'.repeat(Math.max(0, 5 - day.paceRating))}</dd>
                  </div>
                )}
              </dl>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
