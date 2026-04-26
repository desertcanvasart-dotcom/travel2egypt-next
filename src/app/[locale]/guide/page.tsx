import { setRequestLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { allCitiesQuery } from '@/sanity/lib/queries';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function GuideLandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('guide');

  const cities = await client.fetch(allCitiesQuery(locale as Locale));

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <header className="mb-16 max-w-3xl">
        <h1 className="mb-6 font-serif text-5xl font-medium leading-tight text-ink">
          {t('landingTitle')}
        </h1>
        <p className="font-serif text-xl italic text-ink-soft">
          {t('landingDeck')}
        </p>
      </header>

      {cities && cities.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city: any) => (
            <Link
              key={city._id}
              href={{ pathname: '/guide/[citySlug]', params: { citySlug: city.slug } }}
              className="group block"
            >
              {city.heroImage?.asset && (
                <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-cream-deep">
                  <Image
                    src={urlFor(city.heroImage).width(800).height(600).quality(80).url()}
                    alt={city.heroImage.alt || city.name}
                    width={800}
                    height={600}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              )}
              <h2 className="mb-2 font-serif text-2xl font-medium text-ink group-hover:text-orange-deep">
                {city.name}
              </h2>
              <p className="text-sm leading-relaxed text-ink-soft">{city.summary}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-paper p-12 text-center">
          <p className="text-ink-muted">
            No cities found. Run the seed script to populate fixture data:
          </p>
          <code className="mt-4 inline-block rounded bg-cream-warm px-3 py-1.5 font-mono text-sm">
            npm run seed
          </code>
        </div>
      )}
    </div>
  );
}
