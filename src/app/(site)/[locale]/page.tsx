import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';

import { ConciergeCTA } from '@/components/ConciergeCTA';
import { buildStaticMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  // The `home` namespace has no metaTitle/metaDescription keys; the site
  // name + tagline (matching the root layout's static metadata) are used
  // directly so the homepage emits its canonical, OG, and hreflang tags.
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/',
    title: 'Travel2Egypt',
    description: 'Egypt travel, with judgment. An Egyptian operator since 2003.',
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations('home');

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-end gap-16 px-6 pb-24 pt-24 md:gap-24 md:pb-32 md:pt-32 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.18em] text-night-soft">
              {t('eyebrow')}
            </p>
            <h1 className="mb-8 font-serif text-[clamp(2.75rem,7vw,5.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-night">
              <span className="block">{t('heroFirstLine')}</span>
              <span className="block italic text-faience">{t('heroAccent')}</span>
            </h1>
            <p className="mb-10 max-w-[32em] font-serif text-[clamp(1.25rem,2vw,1.5rem)] leading-[1.45] text-night-soft">
              {t('heroLede')}
            </p>
            <dl className="flex flex-wrap gap-x-12 gap-y-4 border-t border-rule pt-6 text-sm text-night-soft">
              <div>
                <dt className="sr-only">{t('heroMetaYearsLabel')}</dt>
                <dd>
                  <strong className="font-medium text-night">{t('heroMetaYears')}</strong>{' '}
                  {t('heroMetaYearsLabel')}
                </dd>
              </div>
              <div>
                <dt className="sr-only">{t('heroMetaTripsLabel')}</dt>
                <dd>
                  <strong className="font-medium text-night">{t('heroMetaTrips')}</strong>{' '}
                  {t('heroMetaTripsLabel')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Hero figure — limestone color block placeholder per
              brand-inputs Section 8 fallback strategy. Real photography
              swaps in post-cutover via siteSettings or a homepage
              document. */}
          <figure className="relative aspect-[4/5] w-full overflow-hidden bg-limestone-warm">
            <div
              className="h-full w-full"
              style={{
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(19, 17, 10, 0.18) 100%), linear-gradient(135deg, #C9A961 0%, #B8924D 50%, #8B6F3D 100%)',
              }}
            />
            <figcaption className="absolute bottom-0 left-0 p-6 font-serif text-xs italic text-paper/85">
              Western Desert, golden hour
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Standfirst ──────────────────────────────────────────── */}
      <section className="bg-night text-paper">
        <div className="mx-auto grid max-w-[920px] grid-cols-1 gap-12 px-6 py-24 md:grid-cols-[200px_1fr] md:gap-20 md:py-28">
          <p className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand">
            {t('standfirstEyebrow')}
          </p>
          <p className="font-serif text-[clamp(1.5rem,2.5vw,2rem)] leading-[1.4] text-paper">
            {t('standfirstLine1')} {t('standfirstLine2')}{' '}
            <em className="italic text-sand">{t('standfirstAccent')}</em>
          </p>
        </div>
      </section>

      {/* ── Concierge CTA ───────────────────────────────────────── */}
      <ConciergeCTA />
    </>
  );
}
