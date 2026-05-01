import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations('site');
  const tNav = useTranslations('nav');

  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <h1 className="mb-6 font-serif text-[clamp(2.75rem,7vw,5.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-night">
        {t('tagline')}
      </h1>
      <p className="mb-12 max-w-2xl font-serif text-2xl italic leading-snug text-night-soft md:text-[1.625rem]">
        Egyptian-operated since 1995. Day tours, multi-day packages, and Nile
        cruises designed in conversation, not from a catalogue.
      </p>

      <div className="grid grid-cols-1 gap-px bg-rule-strong sm:grid-cols-2">
        <Link
          href="/guide"
          className="group block bg-paper p-10 transition-colors hover:bg-limestone"
        >
          <p className="mb-3 font-serif text-sm italic text-faience">i.</p>
          <h2 className="mb-2 font-serif text-3xl font-medium leading-tight text-night transition-colors group-hover:text-faience">
            {tNav('guide')} <span className="font-sans font-normal">→</span>
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-night-soft">
            Operator-grade guides to Egypt&rsquo;s cities.
          </p>
        </Link>
        <Link
          href="/plan-your-tour"
          className="group block bg-night p-10 text-paper transition-colors hover:bg-night-soft"
        >
          <p className="mb-3 font-serif text-sm italic text-sand">ii.</p>
          <h2 className="mb-2 font-serif text-3xl font-medium leading-tight text-paper transition-colors group-hover:text-sand">
            {tNav('planYourTour')} <span className="font-sans font-normal">→</span>
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-paper/75">
            Talk to our concierge about the trip you want.
          </p>
        </Link>
      </div>

      <p className="mt-16 max-w-2xl font-serif text-sm italic text-night-soft">
        Development scaffold. Most pages are stubs — the live demo is the city
        guide at{' '}
        <Link href="/guide/cairo" className="border-b border-rule-strong text-faience">
          /guide/cairo
        </Link>{' '}
        once you have seeded the Sanity dataset.
      </p>
    </div>
  );
}
