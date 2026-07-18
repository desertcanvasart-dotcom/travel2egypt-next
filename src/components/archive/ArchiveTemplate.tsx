import { Suspense } from 'react';

import { Breadcrumb, type BreadcrumbCrumb } from '@/components/Breadcrumb';
import { ConciergeCTA } from '@/components/ConciergeCTA';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import { ArticleFootBand, type FootBandProps } from '@/components/ArticleConnective';
import type { Locale } from '@/i18n/routing';

import { ArchiveHeader } from './ArchiveHeader';
import { ArchiveEssay } from './ArchiveEssay';
import { FeaturedItem } from './FeaturedItem';
import { ThemedCollection } from './ThemedCollection';
import { ArchiveNavigator } from './ArchiveNavigator';
import { ArchiveIndex, ArchiveIndexView } from './ArchiveIndex';
import type {
  ArchiveCollection,
  ArchiveItem,
  FacetFilterGroup,
  NavigatorConfig,
} from './types';

const CONTAINER = 'mx-auto max-w-7xl px-6';

export interface ArchiveTemplateProps {
  locale: Locale;
  breadcrumbItems: BreadcrumbCrumb[];
  header: { kicker?: string; title: string; tagline?: string; stats?: Array<{ label: string; value: string | number }> };
  essay?: { heading?: string; body: unknown };
  featured?: {
    kicker?: string;
    item: ArchiveItem;
    dek?: string;
    body?: unknown;
    linkLabel: string;
  };
  collections: ArchiveCollection[];
  /** Optional "choose by destination" navigator. Omitted archives skip the section. */
  navigator?: NavigatorConfig;
  index: {
    items: ArchiveItem[];
    filters: FacetFilterGroup[];
    labels: { kicker: string; title: string; intro: string; all: string; empty: string };
  };
  /** Pluralized item noun for collection meta lines, e.g. "properties". */
  itemNoun: string;
  /** Fallback kicker for a collection with no kicker set, given its 1-based index. */
  collectionKicker: (n: number) => string;
  conciergeContextLabel: string;
  footBand: FootBandProps;
}

/**
 * Item-agnostic archive page. Composes the editorial layers — header, essay,
 * optional featured spotlight, curated themed collections, and a faceted index
 * — then the shared closing rhythm (concierge CTA → foot band → floating
 * concierge). Pass mapped ArchiveItems and a facet config; the template renders
 * nothing type-specific. See ./README.md to add a new archive.
 */
export function ArchiveTemplate({
  locale,
  breadcrumbItems,
  header,
  essay,
  featured,
  collections,
  navigator,
  index,
  itemNoun,
  collectionKicker,
  conciergeContextLabel,
  footBand,
}: ArchiveTemplateProps) {
  const hasEssay = essay?.body && (!Array.isArray(essay.body) || essay.body.length > 0);

  return (
    <>
      <div className={CONTAINER}>
        <Breadcrumb items={breadcrumbItems} className="pt-8" />
        <ArchiveHeader kicker={header.kicker} title={header.title} tagline={header.tagline} stats={header.stats} />
      </div>

      {hasEssay && (
        <div className={CONTAINER}>
          <ArchiveEssay heading={essay!.heading} body={essay!.body} locale={locale} />
        </div>
      )}

      {featured?.item && (
        <div className={CONTAINER}>
          <FeaturedItem
            kicker={featured.kicker}
            item={featured.item}
            dek={featured.dek}
            body={featured.body}
            linkLabel={featured.linkLabel}
            locale={locale}
          />
        </div>
      )}

      {collections.length > 0 && (
        <div className={`${CONTAINER} pt-20 md:pt-24`}>
          {collections.map((collection, i) => (
            <ThemedCollection
              key={i}
              kicker={collection.kicker || collectionKicker(i + 1)}
              collection={collection}
              itemNoun={itemNoun}
            />
          ))}
        </div>
      )}

      {navigator && navigator.items.length > 0 && (
        <div className={CONTAINER}>
          <ArchiveNavigator config={navigator} />
        </div>
      )}

      <div className={CONTAINER}>
        {/* useSearchParams (in ArchiveIndex) must sit inside Suspense for static
            prerender. The fallback is the same view unfiltered, so the rows are
            still server-rendered for SEO; the client swaps in the interactive
            filtered version on hydration. */}
        <Suspense
          fallback={
            <ArchiveIndexView
              items={index.items}
              filters={index.filters}
              labels={index.labels}
              selected={{}}
            />
          }
        >
          <ArchiveIndex items={index.items} filters={index.filters} labels={index.labels} />
        </Suspense>
      </div>

      <ConciergeCTA chatEnabled={isChatEnabled()} variant="compact" contextLabel={conciergeContextLabel} />
      <ArticleFootBand {...footBand} />
      <FloatingConcierge />
    </>
  );
}
