import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { Body } from '@/components/Body';
import { urlFor } from '@/sanity/lib/image';
import type { Locale } from '@/i18n/routing';

import type { ArchiveItem } from './types';
import { FacetBadgeLine } from './ArchiveCard';

/**
 * Asymmetric spotlight: editorial copy beside a tall image. Optional — the
 * template only renders it when a featured item is set. The body may carry an
 * inline concierge note (shared <Body> serializer). dek falls back to the
 * item summary; the image falls back to a placeholder when absent.
 */
export function FeaturedItem({
  kicker,
  item,
  dek,
  body,
  linkLabel,
  locale,
}: {
  kicker?: string;
  item: ArchiveItem;
  dek?: string;
  body?: unknown;
  linkLabel: string;
  locale: Locale;
}) {
  const imageUrl = item.image?.asset
    ? urlFor(item.image).width(1000).height(1250).quality(82).url()
    : null;
  const lead = dek || item.summary;
  const hasBody = Array.isArray(body) && body.length > 0;

  return (
    <section className="border-b border-rule py-20 md:py-24">
      {kicker && (
        <p className="mb-8 font-sans text-xs font-medium uppercase tracking-[0.2em] text-sand-warm">
          {kicker}
        </p>
      )}
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <FacetBadgeLine facets={item.facets} className="mb-4" />
          <h2 className="font-serif text-[clamp(2.25rem,4.4vw,3.75rem)] font-normal leading-[1.02] tracking-[-0.01em] text-faience">
            {item.title}
          </h2>
          {lead && (
            <p className="mt-6 max-w-[520px] font-serif text-[1.4rem] italic leading-snug text-night-soft">
              {lead}
            </p>
          )}
          {hasBody && (
            <div className="prose-editorial mt-7 max-w-[500px]">
              <Body value={body} locale={locale} />
            </div>
          )}
          <Link
            href={item.href}
            className="group mt-8 inline-flex items-center gap-2.5 border-b border-night pb-1 font-sans text-sm text-night transition-colors hover:border-sand hover:text-sand-warm"
          >
            {linkLabel}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden bg-limestone-deep">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={item.image?.alt || item.title}
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
          )}
        </div>
      </div>
    </section>
  );
}
