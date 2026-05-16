import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import { buildMetadata, pathByLocaleFromSlugs } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbList } from '@/lib/structured-data';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import {
  hotelBySlugQuery,
  allHotelSlugsQuery,
  siteSettingsQuery,
} from '@/sanity/lib/queries';
import { Body } from '@/components/Body';
import { TourCard, type TourCardData } from '@/components/TourCard';
import type { HotelCardData } from '@/components/HotelCard';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

type HotelDetail = HotelCardData & {
  body?: unknown;
  operatorNotes?: unknown;
  relatedTours?: TourCardData[];
  gallery?: Array<{ asset?: unknown; alt?: string }>;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { asset?: unknown; alt?: string } | null;
    noIndex?: boolean;
  };
  allSlugs?: Array<{ _key: string; current: string }>;
};

const CATEGORY_LABEL: Record<string, string> = {
  standard: 'Standard',
  deluxe: 'Deluxe',
  luxury: 'Luxury',
  boutique: 'Boutique',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const hotel: HotelDetail | null = await client.fetch(
    hotelBySlugQuery(locale as Locale),
    { slug }
  );
  if (!hotel) return {};
  return buildMetadata(
    { title: hotel.name, summary: hotel.summary, heroImage: hotel.heroImage, seo: hotel.seo },
    {
      locale: locale as Locale,
      path: `/hotels/${slug}`,
      pathByLocale: pathByLocaleFromSlugs(
        hotel.allSlugs ?? [],
        (s: string) => `/hotels/${s}`
      ),
    }
  );
}

export async function generateStaticParams() {
  const hotels: Array<{
    slugs: Array<{ _key: string; current: string }>;
  }> = await client.fetch(allHotelSlugsQuery);

  const params: Array<{ locale: string; slug: string }> = [];
  for (const hotel of hotels) {
    const enSlug = hotel.slugs?.find((s) => s._key === 'en')?.current;
    if (!enSlug) continue;
    for (const locale of routing.locales) {
      const localizedSlug =
        hotel.slugs.find((s) => s._key === locale)?.current ?? enSlug;
      params.push({ locale, slug: localizedSlug });
    }
  }
  return params;
}

export default async function HotelPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('hotel');
  const [hotel, siteSettings] = await Promise.all([
    client.fetch<HotelDetail | null>(hotelBySlugQuery(locale as Locale), { slug }),
    client.fetch(siteSettingsQuery(locale as Locale)),
  ]);

  if (!hotel) notFound();

  const heroUrl = hotel.heroImage?.asset
    ? urlFor(hotel.heroImage).width(2400).height(1200).quality(85).url()
    : null;

  const whatsappNumber: string | undefined = siteSettings?.contact?.whatsapp;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
        `Hi — I'd like to ask about staying at "${hotel.name}"`
      )}`
    : null;

  const categoryLabel = hotel.category ? CATEGORY_LABEL[hotel.category] : null;
  const stars =
    hotel.starRating && hotel.starRating >= 1 && hotel.starRating <= 5
      ? '★'.repeat(Math.round(hotel.starRating))
      : null;

  const breadcrumbSchema = buildBreadcrumbList(
    [
      { name: 'Home', path: '/' },
      { name: t('breadcrumbLabel'), path: '/hotels' },
      { name: hotel.name, path: `/hotels/${slug}` },
    ],
    locale as Locale
  );

  return (
    <article>
      <JsonLd data={[breadcrumbSchema]} />
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-cream-deep">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={hotel.heroImage?.alt || hotel.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1408]/25 via-[#1f1408]/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1f1408]/42 via-[#1f1408]/15 to-transparent pt-32">
          <div className="mx-auto max-w-7xl px-6 pb-12">
            <p className="mb-3 flex flex-wrap items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-soft">
              {categoryLabel && <span>{categoryLabel}</span>}
              {stars && (
                <>
                  <span className="opacity-60">·</span>
                  <span className="text-paper">{stars}</span>
                </>
              )}
              {hotel.city?.name && (
                <>
                  <span className="opacity-60">·</span>
                  <span className="text-paper/80">{hotel.city.name}</span>
                </>
              )}
            </p>
            <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.05] text-paper drop-shadow-[0_2px_8px_rgba(31,20,8,0.45)] md:text-6xl">
              {hotel.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_340px]">
          {/* Main column */}
          <div>
            {hotel.summary && (
              <p className="mb-12 font-serif text-2xl italic leading-relaxed text-ink-soft">
                {hotel.summary}
              </p>
            )}

            {Boolean(hotel.body) && (
              <div className="prose-editorial max-w-none">
                <Body value={hotel.body} locale={locale as Locale} />
              </div>
            )}

            {Boolean(hotel.operatorNotes) && (
              <section className="mt-12 border-l-2 border-orange-deep bg-cream-warm/40 p-6">
                <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-orange-deep">
                  {t('operatorNotesLabel')}
                </h2>
                <div className="prose-editorial max-w-none text-ink-soft">
                  <Body value={hotel.operatorNotes} locale={locale as Locale} />
                </div>
              </section>
            )}

            {hotel.relatedTours && hotel.relatedTours.length > 0 && (
              <section className="mt-20 border-t border-line pt-16">
                <h2 className="mb-8 font-serif text-3xl font-medium text-ink">
                  {t('relatedToursLabel')}
                </h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
                  {hotel.relatedTours.map((related) => (
                    <TourCard key={related._id} tour={related} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-line bg-cream-warm p-6">
              <dl className="space-y-4 text-sm">
                {hotel.city?.name && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('cityLabel')}
                    </dt>
                    <dd className="text-ink-soft">{hotel.city.name}</dd>
                  </div>
                )}
                {categoryLabel && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('categoryLabel')}
                    </dt>
                    <dd className="text-ink-soft">{categoryLabel}</dd>
                  </div>
                )}
                {stars && (
                  <div>
                    <dt className="mb-1 font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      {t('starRatingLabel')}
                    </dt>
                    <dd className="text-orange-deep">{stars}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/contact"
                className="block w-full rounded-full bg-orange px-6 py-3.5 text-center text-sm font-medium text-paper transition-colors hover:bg-orange-deep"
              >
                {t('talkToConcierge')}
              </Link>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-full border border-ink px-6 py-3.5 text-center text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  {t('whatsappInquiry')}
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
