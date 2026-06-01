import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Body } from '@/components/Body';
import { Breadcrumb, type BreadcrumbCrumb } from '@/components/Breadcrumb';
import { PlaceHero } from '@/components/PlaceHero';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import { ArticleFootBand, type FootBandProps } from '@/components/ArticleConnective';
import { ArchiveCard } from '@/components/archive/ArchiveCard';
import type { ArchiveItem } from '@/components/archive/types';

export interface SubcategoryTemplateProps {
  locale: Locale;
  hero: {
    image?: { asset?: unknown; alt?: string } | null;
    kicker?: string;
    kickerHref?: string;
    title: string;
  };
  breadcrumbItems: BreadcrumbCrumb[];
  /** Italic centered lead line above the body. */
  dek?: string;
  /** PortableText essay (may include conciergeNote). */
  essayBody?: unknown;
  /** "{n} {track} days from {city}". */
  scopedHeading: string;
  /** Optional "All {city} tours →" link. */
  allLink?: { label: string; href: string };
  items: ArchiveItem[];
  conciergeContextLabel: string;
  footBand: FootBandProps;
}

/**
 * Subcategory archetype (category → SUBCATEGORY → single): a long editorial
 * body fused with a scoped product grid under a place hero. Composes existing
 * parts (PlaceHero, Body, ArchiveCard, ConciergeCTA, ArticleFootBand,
 * FloatingConcierge) — it is NOT an ArchiveTemplate instance. Item-source
 * agnostic: a route hands it a resolved landing + its scoped items.
 *
 * Body is centered single-column (not the blog's sidebar-TOC layout) — these
 * read short and lead into the products. See ./README.md for package reuse.
 */
export function SubcategoryTemplate({
  locale,
  hero,
  breadcrumbItems,
  dek,
  essayBody,
  scopedHeading,
  allLink,
  items,
  conciergeContextLabel,
  footBand,
}: SubcategoryTemplateProps) {
  const hasBody = Array.isArray(essayBody) && essayBody.length > 0;

  return (
    <article>
      <PlaceHero
        image={hero.image}
        kicker={hero.kicker}
        kickerHref={hero.kickerHref}
        title={hero.title}
      />

      <div className="mx-auto max-w-7xl px-6">
        <Breadcrumb items={breadcrumbItems} className="pt-7" />
      </div>

      {/* Centered editorial body */}
      {(dek || hasBody) && (
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-[720px] py-12 md:py-14">
            {dek && (
              <p className="mb-10 text-center font-serif text-[clamp(1.25rem,2.2vw,1.625rem)] italic leading-snug text-night-soft">
                {dek}
              </p>
            )}
            {hasBody && (
              <div className="prose-editorial">
                <Body value={essayBody} locale={locale} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scoped product grid */}
      {items.length > 0 && (
        <section className="border-t border-rule">
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
            <div className="mb-11 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-baseline">
              <h2 className="font-serif text-[clamp(1.875rem,3.4vw,2.875rem)] font-normal leading-tight text-faience">
                {scopedHeading}
              </h2>
              {allLink && (
                <Link
                  href={allLink.href}
                  className="shrink-0 whitespace-nowrap border-b border-sand pb-1 font-sans text-sm text-night transition-colors hover:text-sand-warm"
                >
                  {allLink.label} <span aria-hidden>→</span>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 gap-x-9 gap-y-12 sm:grid-cols-2 md:grid-cols-3">
              {items.map((item, i) => (
                <ArchiveCard key={item._id} item={item} size={i === 0 ? 'lead' : 'default'} />
              ))}
            </div>
          </div>
        </section>
      )}

      <ConciergeCTA variant="compact" contextLabel={conciergeContextLabel} />
      <ArticleFootBand {...footBand} />
      <FloatingConcierge />
    </article>
  );
}
