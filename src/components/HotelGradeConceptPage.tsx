import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Body } from '@/components/Body';

type Tier = 'standard' | 'deluxe' | 'luxury';

interface CtaLink {
  label?: string;
  href?: string;
}

interface EditorialDoc {
  heroHeading?: string;
  heroSubhead?: string;
  heroPrimaryCta?: CtaLink;
  heroSecondaryCta?: CtaLink;
  sections?: Array<{ _key: string; heading?: string; body?: unknown }>;
  ribbonBody?: string;
  ribbonCta?: CtaLink;
  bottomCtaHeading?: string;
  bottomCtaBody?: string;
  bottomCtaPrimary?: CtaLink;
  bottomCtaSecondary?: CtaLink;
}

interface HotelEntry {
  _id: string;
  category: Tier;
  name: string;
  slug: string;
  city?: { _id: string; orderRank?: number; name: string; slug: string } | null;
}

interface CruiseEntry {
  _id: string;
  tier: Tier;
  cruiseRoute: 'nile' | 'lake-nasser';
  type?: string;
  name: string;
  slug: string;
}

interface TierLabels {
  heading: string;
  tagline: string;
}

interface Labels {
  tiers: Record<Tier, TierLabels>;
  hotelsLabel: string;
  cruisesLabel: string;
  nileCruisesLabel: string;
  lakeNasserCruisesLabel: string;
  emptyTierState: string;
  jumpTo: string;
}

interface Props {
  locale: Locale;
  editorial: EditorialDoc | null;
  hotels: HotelEntry[];
  cruises: CruiseEntry[];
  labels: Labels;
}

const TIERS: Tier[] = ['standard', 'deluxe', 'luxury'];

export function HotelGradeConceptPage({ locale, editorial, hotels, cruises, labels }: Props) {
  // Group hotels: tier → city → hotels
  const hotelsByTier: Record<Tier, Map<string, { city: HotelEntry['city']; items: HotelEntry[] }>> = {
    standard: new Map(),
    deluxe: new Map(),
    luxury: new Map(),
  };
  for (const h of hotels) {
    const tier = h.category;
    if (!TIERS.includes(tier)) continue;
    const cityKey = h.city?._id ?? '__no-city__';
    if (!hotelsByTier[tier].has(cityKey)) {
      hotelsByTier[tier].set(cityKey, { city: h.city, items: [] });
    }
    hotelsByTier[tier].get(cityKey)!.items.push(h);
  }

  // Group cruises: tier → route(nile|lake-nasser) → list
  const cruisesByTier: Record<Tier, { nile: CruiseEntry[]; lakeNasser: CruiseEntry[] }> = {
    standard: { nile: [], lakeNasser: [] },
    deluxe: { nile: [], lakeNasser: [] },
    luxury: { nile: [], lakeNasser: [] },
  };
  for (const c of cruises) {
    const tier = c.tier;
    if (!TIERS.includes(tier)) continue;
    if (c.cruiseRoute === 'lake-nasser') cruisesByTier[tier].lakeNasser.push(c);
    else cruisesByTier[tier].nile.push(c);
  }

  return (
    <article>
      {/* Hero */}
      <header className="border-b border-line bg-cream-warm/40">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          {editorial?.heroHeading && (
            <h1 className="mb-6 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
              {editorial.heroHeading}
            </h1>
          )}
          {editorial?.heroSubhead && (
            <p className="mx-auto max-w-2xl font-serif text-xl italic leading-relaxed text-ink-soft">
              {editorial.heroSubhead}
            </p>
          )}
          {(editorial?.heroPrimaryCta?.href || editorial?.heroSecondaryCta?.href) && (
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {editorial.heroPrimaryCta?.href && editorial.heroPrimaryCta?.label && (
                <CtaButton cta={editorial.heroPrimaryCta} variant="primary" />
              )}
              {editorial.heroSecondaryCta?.href && editorial.heroSecondaryCta?.label && (
                <CtaButton cta={editorial.heroSecondaryCta} variant="secondary" />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Editorial body sections */}
      {editorial?.sections && editorial.sections.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 py-16">
          {editorial.sections.map((s) => (
            <div key={s._key} className="mb-16 last:mb-0">
              {s.heading && (
                <h2 className="mb-6 font-serif text-3xl font-medium text-ink">{s.heading}</h2>
              )}
              {Boolean(s.body) && (
                <div className="prose-editorial max-w-none">
                  <Body value={s.body} locale={locale} />
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Mid-page ribbon */}
      {editorial?.ribbonBody && (
        <aside className="bg-orange py-10 text-paper">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="max-w-2xl font-serif text-lg italic leading-relaxed">
              {editorial.ribbonBody}
            </p>
            {editorial.ribbonCta?.href && editorial.ribbonCta?.label && (
              <Link
                href={editorial.ribbonCta.href}
                className="whitespace-nowrap rounded-full bg-paper px-6 py-3 text-sm font-medium text-orange-deep transition-colors hover:bg-cream-warm"
              >
                {editorial.ribbonCta.label}
              </Link>
            )}
          </div>
        </aside>
      )}

      {/* Tier columns */}
      <section id="tiers" className="mx-auto max-w-7xl px-6 py-20">
        {/* Mobile anchor nav */}
        <nav
          aria-label={labels.jumpTo}
          className="mb-8 flex flex-wrap justify-center gap-3 lg:hidden"
        >
          {TIERS.map((t) => (
            <a
              key={t}
              href={`#tier-${t}`}
              className="rounded-full border border-line bg-paper px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:border-orange-deep hover:text-orange-deep"
            >
              {labels.tiers[t].heading}
            </a>
          ))}
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const cityGroups = Array.from(hotelsByTier[tier].values()).sort((a, b) => {
              const ra = a.city?.orderRank ?? 99999;
              const rb = b.city?.orderRank ?? 99999;
              if (ra !== rb) return ra - rb;
              return (a.city?.name ?? '').localeCompare(b.city?.name ?? '');
            });
            const nileCruises = cruisesByTier[tier].nile;
            const lakeNasserCruises = cruisesByTier[tier].lakeNasser;
            const hasAny =
              cityGroups.length > 0 || nileCruises.length > 0 || lakeNasserCruises.length > 0;
            const hasLakeNasser = lakeNasserCruises.length > 0;
            const totalCruises = nileCruises.length + lakeNasserCruises.length;
            return (
              <div
                key={tier}
                id={`tier-${tier}`}
                className="rounded-lg border border-line bg-paper p-6 lg:p-8"
              >
                <header className="mb-6 border-b border-line pb-4">
                  <h2 className="font-serif text-2xl font-medium text-ink">
                    {labels.tiers[tier].heading}
                  </h2>
                  <p className="mt-2 font-serif text-sm italic text-ink-soft">
                    {labels.tiers[tier].tagline}
                  </p>
                </header>

                {!hasAny ? (
                  <p className="font-serif text-sm italic text-ink-muted">
                    {labels.emptyTierState.replace(
                      '{tier}',
                      labels.tiers[tier].heading
                    )}
                  </p>
                ) : (
                  <div className="space-y-8">
                    {/* Hotels by city */}
                    {cityGroups.length > 0 && (
                      <div>
                        <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-deep">
                          {labels.hotelsLabel}
                        </h3>
                        <div className="space-y-4">
                          {cityGroups.map((cg) => (
                            <div key={cg.city?._id ?? '__no-city__'}>
                              <p className="mb-1 font-serif text-base font-medium text-ink">
                                {cg.city?.slug ? (
                                  <Link
                                    href={`/guide/${cg.city.slug}`}
                                    className="hover:text-orange-deep"
                                  >
                                    {cg.city?.name ?? '—'}
                                  </Link>
                                ) : (
                                  cg.city?.name ?? '—'
                                )}
                              </p>
                              <ul className="space-y-0.5 text-sm text-ink-soft">
                                {cg.items.map((h) => (
                                  <li key={h._id}>
                                    {h.slug ? (
                                      <Link
                                        href={`/hotels/${h.slug}`}
                                        className="hover:text-orange-deep"
                                      >
                                        {h.name}
                                      </Link>
                                    ) : (
                                      h.name
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cruises */}
                    {totalCruises > 0 && (
                      <div>
                        <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-deep">
                          {hasLakeNasser ? labels.nileCruisesLabel : labels.cruisesLabel}
                        </h3>
                        <ul className="space-y-0.5 text-sm text-ink-soft">
                          {nileCruises.map((c) => (
                            <li key={c._id}>
                              {c.slug ? (
                                <Link
                                  href={`/nile-cruises/${c.slug}`}
                                  className="hover:text-orange-deep"
                                >
                                  {c.name}
                                </Link>
                              ) : (
                                c.name
                              )}
                            </li>
                          ))}
                        </ul>
                        {hasLakeNasser && (
                          <>
                            <h3 className="mb-3 mt-6 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-deep">
                              {labels.lakeNasserCruisesLabel}
                            </h3>
                            <ul className="space-y-0.5 text-sm text-ink-soft">
                              {lakeNasserCruises.map((c) => (
                                <li key={c._id}>
                                  {c.slug ? (
                                    <Link
                                      href={`/nile-cruises/${c.slug}`}
                                      className="hover:text-orange-deep"
                                    >
                                      {c.name}
                                    </Link>
                                  ) : (
                                    c.name
                                  )}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      {(editorial?.bottomCtaHeading || editorial?.bottomCtaBody) && (
        <section className="border-t border-line bg-cream-warm/40">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            {editorial.bottomCtaHeading && (
              <h2 className="mb-4 font-serif text-3xl font-medium text-ink md:text-4xl">
                {editorial.bottomCtaHeading}
              </h2>
            )}
            {editorial.bottomCtaBody && (
              <p className="mx-auto mb-10 max-w-2xl font-serif text-lg italic leading-relaxed text-ink-soft">
                {editorial.bottomCtaBody}
              </p>
            )}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {editorial.bottomCtaPrimary?.href && editorial.bottomCtaPrimary?.label && (
                <CtaButton cta={editorial.bottomCtaPrimary} variant="primary" />
              )}
              {editorial.bottomCtaSecondary?.href && editorial.bottomCtaSecondary?.label && (
                <CtaButton cta={editorial.bottomCtaSecondary} variant="secondary" />
              )}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

function CtaButton({ cta, variant }: { cta: CtaLink; variant: 'primary' | 'secondary' }) {
  const cls =
    variant === 'primary'
      ? 'rounded-full bg-orange px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-orange-deep'
      : 'rounded-full border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper';
  if (cta.href!.startsWith('#')) {
    return (
      <a href={cta.href} className={cls}>
        {cta.label}
      </a>
    );
  }
  return (
    <Link href={cta.href!} className={cls}>
      {cta.label}
    </Link>
  );
}
