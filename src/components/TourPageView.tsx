/**
 * Hybrid editorial tour renderer.
 *
 * Per migration brief (Desktop/new tour concept/00-BRIEF-hybrid-tour-model.md):
 * tour pages are NOT spec sheets. They are editorial essays with a light
 * factual spine for orientation, ending in a concierge handoff. The
 * page's job is to make the right traveler want this kind of trip; the
 * concierge handles logistics.
 *
 * Two layers, kept visually separate:
 *
 *   Layer 1 — Editorial essay (dominant)
 *     hero with title + standfirst summary
 *     body (portable text) rendered with generous editorial typography
 *     for group packages: a structured day grid AFTER the essay
 *
 *   Layer 2 — Factual spine (compact, secondary)
 *     a quiet "shape of the day/journey/cruise" box: Where · Duration ·
 *     Character · Good for · From. Renders only populated rows; an empty
 *     priceIndication or empty highlights collapses the row rather than
 *     leaving a placeholder.
 *
 * Then ConciergeCTA replaces the old Book Now / WhatsApp sidebar.
 *
 * What this view INTENTIONALLY does not render (concierge-owned):
 *   inclusions, exclusions, meeting points, pickup times, gallery,
 *   related tours, related guide articles, traveler stories, sticky
 *   pricing sidebar. None of those belong on a hybrid editorial tour
 *   page — they're either the concierge's job or spec-sheet artefacts.
 *
 * Per-type rules:
 *   - dayTour                : essay + spine. No day grid.
 *   - package × private      : essay + spine. No day grid (deliberate).
 *   - package × group        : essay + spine + day grid (mandatory).
 *   - empty group days[]     : renders a warning placeholder rather than
 *                              silently collapsing — group needs the grid.
 */
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { JsonLd } from '@/components/JsonLd';
import {
  buildTouristTripSchema,
  buildBreadcrumbList,
} from '@/lib/structured-data';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatPrice } from '@/lib/currency';
import { urlFor } from '@/sanity/lib/image';
import { Body } from '@/components/Body';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';

export interface TourPageViewProps {
  tour: any;
  locale: Locale;
  slug: string;
  /** Reserved for future use — concierge will eventually use site contact / whatsapp data. */
  siteSettings?: { contact?: { whatsapp?: string } } | null;
}

export async function TourPageView({ tour, locale, slug }: TourPageViewProps) {
  const t = await getTranslations('tour');

  // ── Hero asset ────────────────────────────────────────────────────────────
  const heroUrl = tour.heroImage?.asset
    ? urlFor(tour.heroImage).width(2400).height(1200).quality(85).url()
    : null;

  // ── Eyebrow — link back to the appropriate hub/category for this tour ────
  // dayTour×private  → Private Day Tours hub
  // dayTour×group    → Small Group Day Tours hub
  // package×private  → its theme landing if present, else Egypt Travel Packages hub
  // package×group    → Small Group Travel Packages hub
  const eyebrow = computeEyebrow(tour);

  // ── Spine values ──────────────────────────────────────────────────────────
  const cityList: string[] = (tour.cities ?? [])
    .map((c: { name: string }) => c?.name)
    .filter(Boolean);
  const where = cityList.length > 0 ? cityList.join(' → ') : null;

  const duration = computeDurationLabel(tour, t);
  const character = computeCharacter(tour, t);
  const goodFor = computeGoodFor(tour);
  const fromPrice = formatPrice(tour.priceFrom, locale, 'pp') || null;

  // ── JSON-LD ──────────────────────────────────────────────────────────────
  // Pricing exposure (group-only) is enforced inside the builder via
  // tourMode + basePrice. priceFrom is not passed: it's a display-rail
  // value that lives in the L3 meta row, not a canonical commercial
  // price. structured-data exposes only the group-product basePrice.
  const tripSchema = buildTouristTripSchema(
    {
      title: tour.title,
      slug,
      type: tour.type,
      tourMode: tour.tourMode,
      summary: tour.summary,
      durationDays: tour.durationDays,
      durationHours: tour.durationHours,
      durationLabel: tour.durationLabel,
      basePrice: tour.basePrice,
      peakUpliftPct: tour.peakUpliftPct,
      maxGroup: tour.maxGroup,
      originRegion: tour.originRegion,
      heroImage: tour.heroImage,
      cities: tour.cities,
    },
    locale,
  );
  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: 'Home', path: '/' },
      ...(eyebrow ? [{ name: eyebrow.label, path: eyebrow.href }] : []),
      { name: tour.title, path: `/${slug}` },
    ],
    locale,
  );

  // ── Group day grid presence check ────────────────────────────────────────
  const isGroupPackage = tour.type === 'package' && tour.tourMode === 'group';
  const hasDays = Array.isArray(tour.days) && tour.days.length > 0;

  return (
    <article className="bg-paper">
      <JsonLd data={[tripSchema, breadcrumbSchema]} />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      {heroUrl ? (
        <header className="relative h-[58vh] min-h-[440px] w-full overflow-hidden bg-limestone-deep">
          <Image
            src={heroUrl}
            alt={tour.heroImage?.alt || tour.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/55 via-night/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-[820px] px-6 pb-14 md:pb-20">
              {eyebrow && (
                <p className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand">
                  <Link href={eyebrow.href} className="hover:text-paper">
                    {eyebrow.label}
                  </Link>
                </p>
              )}
              <h1 className="max-w-[20ch] font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.01em] text-paper">
                {tour.title}
              </h1>
              {tour.summary && (
                <p className="mt-6 max-w-[36em] font-serif text-[1.25rem] italic leading-[1.5] text-paper/85 md:text-[1.4rem]">
                  {tour.summary}
                </p>
              )}
            </div>
          </div>
        </header>
      ) : (
        <header className="border-b border-rule">
          <div className="mx-auto max-w-[820px] px-6 pb-12 pt-24 md:pt-32">
            {eyebrow && (
              <p className="mb-5 font-sans text-xs font-medium uppercase tracking-[0.18em] text-night-soft">
                <Link href={eyebrow.href} className="hover:text-ink">
                  {eyebrow.label}
                </Link>
              </p>
            )}
            <h1 className="max-w-[20ch] font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.01em] text-ink">
              {tour.title}
            </h1>
            {tour.summary && (
              <p className="mt-6 max-w-[36em] font-serif text-[1.25rem] italic leading-[1.5] text-night-soft md:text-[1.4rem]">
                {tour.summary}
              </p>
            )}
          </div>
        </header>
      )}

      {/* ── Body — single editorial column ──────────────────────────────── */}
      <div className="mx-auto max-w-[820px] px-6 py-16 md:py-24">
        {Array.isArray(tour.body) && tour.body.length > 0 ? (
          <div className="prose-editorial max-w-none">
            <Body value={tour.body} locale={locale} />
          </div>
        ) : (
          <p className="font-serif text-base italic text-night-soft">
            {/* Quiet placeholder for the handful of legacy thin/empty docs.
                Better than rendering an awkward gap with nothing in it. */}
            This trip’s editorial detail is being rewritten — speak to our
            team about how we’d shape it for you.
          </p>
        )}

        {/* ── Factual spine — the compact "shape of the day/journey" ──── */}
        <FactualSpine
          where={where}
          duration={duration}
          character={character}
          goodFor={goodFor}
          fromPrice={fromPrice}
          shapeLabel={
            isGroupPackage || tour.type === 'package'
              ? 'The shape of the journey'
              : 'The shape of the day'
          }
        />

        {/* ── Group day grid (mandatory for group packages, hidden for everyone else) ── */}
        {isGroupPackage && (
          <section className="mt-20 border-t border-rule pt-16">
            <h2 className="mb-8 font-serif text-3xl font-normal text-ink">
              The day-by-day
            </h2>
            {hasDays ? (
              <DayGrid days={tour.days} locale={locale} />
            ) : (
              <div className="rounded border border-terra/30 bg-terra/5 p-6 text-sm leading-relaxed text-ink-soft">
                <p className="mb-1 font-sans text-xs font-medium uppercase tracking-[0.15em] text-terra">
                  Content gap
                </p>
                <p>
                  This is a group-departure package, so its day-by-day grid is
                  meant to be fixed and visible. The grid isn’t set yet —
                  please ask our team for the current itinerary and dates.
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Concierge handoff — replaces Book Now ────────────────────────── */}
      <ConciergeCTA chatEnabled={isChatEnabled()} tourSlug={slug} variant="compact" />
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Factual spine — secondary, quiet, never competes with the essay
// ──────────────────────────────────────────────────────────────────────────

interface FactualSpineProps {
  where: string | null;
  duration: string | null;
  character: string | null;
  goodFor: string | null;
  fromPrice: string | null;
  shapeLabel: string;
}

function FactualSpine({
  where, duration, character, goodFor, fromPrice, shapeLabel,
}: FactualSpineProps) {
  const rows: Array<{ k: string; v: string }> = [];
  if (where)     rows.push({ k: 'Where', v: where });
  if (duration)  rows.push({ k: 'Duration', v: duration });
  if (character) rows.push({ k: 'Character', v: character });
  if (goodFor)   rows.push({ k: 'Good for', v: goodFor });
  if (fromPrice) rows.push({ k: 'From', v: fromPrice });
  if (rows.length === 0) return null;

  return (
    <aside
      aria-label={shapeLabel}
      className="mt-16 rounded border border-rule bg-limestone/40 px-6 py-7 md:px-8 md:py-9"
    >
      <p className="mb-5 font-sans text-xs font-medium uppercase tracking-[0.18em] text-night-soft">
        {shapeLabel}
      </p>
      <dl className="space-y-4">
        {rows.map((r) => (
          <div
            key={r.k}
            className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-6 gap-y-1 border-t border-rule/60 pt-4 first:border-t-0 first:pt-0 md:grid-cols-[7.5rem_1fr]"
          >
            <dt className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.14em] text-night-soft">
              {r.k}
            </dt>
            <dd className="font-serif text-[1rem] leading-[1.55] text-ink md:text-[1.0625rem]">
              {r.v}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Day grid — group-package-only, structured itinerary
// ──────────────────────────────────────────────────────────────────────────

function DayGrid({ days, locale }: { days: any[]; locale: Locale }) {
  return (
    <ol className="space-y-12">
      {days.map((d) => (
        <li key={d.dayNumber} className="border-l-2 border-sand pl-6">
          <p className="mb-2 font-sans text-[0.7rem] font-medium uppercase tracking-[0.14em] text-night-soft">
            Day {d.dayNumber}
          </p>
          {d.title && (
            <h3 className="mb-3 font-serif text-2xl font-normal text-ink">
              {d.title}
            </h3>
          )}
          {Array.isArray(d.morning) && d.morning.length > 0 && (
            <div className="prose-editorial mb-3 max-w-none text-[0.975rem]">
              <Body value={d.morning} locale={locale} />
            </div>
          )}
          {Array.isArray(d.afternoon) && d.afternoon.length > 0 && (
            <div className="prose-editorial mb-3 max-w-none text-[0.975rem]">
              <Body value={d.afternoon} locale={locale} />
            </div>
          )}
          <DayMeta day={d} />
        </li>
      ))}
    </ol>
  );
}

function DayMeta({ day }: { day: any }) {
  const items: Array<{ k: string; v: string }> = [];
  if (day.meals)         items.push({ k: 'Meals', v: day.meals });
  if (day.accommodation) items.push({ k: 'Stay', v: day.accommodation });
  if (day.transport)     items.push({ k: 'Transport', v: day.transport });
  if (typeof day.paceRating === 'number') {
    const labels = ['—', 'Relaxed', 'Steady', 'Full', 'Busy', 'Intense'];
    items.push({ k: 'Pace', v: labels[day.paceRating] ?? String(day.paceRating) });
  }
  if (items.length === 0) return null;
  return (
    <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-sans text-[0.8125rem] text-night-soft">
      {items.map((it, i) => (
        <span key={i}>
          <span className="font-medium uppercase tracking-[0.1em] text-night-soft/70">{it.k}:</span>{' '}
          <span className="text-ink">{it.v}</span>
        </span>
      ))}
    </p>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers: derive spine values from the tour doc
// ──────────────────────────────────────────────────────────────────────────

function computeEyebrow(tour: any): { label: string; href: string } | null {
  if (tour.type === 'dayTour' && tour.tourMode === 'private')
    return { label: 'Private Day Tours', href: '/private-day-tours' };
  if (tour.type === 'dayTour' && tour.tourMode === 'group')
    return { label: 'Small Group Day Tours', href: '/group-day-tours' };
  if (tour.type === 'package' && tour.tourMode === 'group')
    return { label: 'Small Group Travel Packages', href: '/small-group-travel-packages' };
  if (tour.type === 'package' && tour.tourMode === 'private') {
    // Prefer the theme's tourLanding URL if we have it; otherwise the
    // packages hub. The themeLanding slug (e.g. "egypt-luxury-holidays")
    // is fetched via a sub-projection on tourBySlugQuery and is the
    // SEO-locked legacy WP URL — not the same as theme.slug, which is
    // an internal taxonomy slug ("luxury").
    const themeName: string | undefined = tour.theme?.name;
    const landingSlug: string | undefined = tour.themeLanding?.slug;
    if (themeName && landingSlug) return { label: themeName, href: `/${landingSlug}` };
    return { label: 'Egypt Travel Packages', href: '/egypt-travel-packages' };
  }
  return null;
}

function computeDurationLabel(tour: any, _t: any): string | null {
  if (tour.durationLabel?.trim()) return tour.durationLabel.trim();
  if (tour.type === 'dayTour') {
    if (typeof tour.durationHours === 'number') {
      return `Full day (≈ ${tour.durationHours} hours)`;
    }
    return 'Full day';
  }
  if (typeof tour.durationDays === 'number' && tour.durationDays > 0) {
    return `≈ ${tour.durationDays} days`;
  }
  return null;
}

function computeCharacter(tour: any, _t: any): string | null {
  const parts: string[] = [];
  if (tour.tourMode === 'private') parts.push('Fully private');
  else if (tour.tourMode === 'group') parts.push('Small group, shared departure');
  if (tour.type === 'dayTour') parts.push('licensed Egyptologist guide');
  else if (tour.type === 'package') parts.push('Egyptologist throughout');
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

function computeGoodFor(tour: any): string | null {
  if (!Array.isArray(tour.highlights) || tour.highlights.length === 0) return null;
  // Render up to 2 highlights as a single comma-joined line.
  return tour.highlights.slice(0, 2).join(' · ');
}
