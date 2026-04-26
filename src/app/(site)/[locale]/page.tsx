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
      <h1 className="mb-6 font-serif text-6xl font-medium leading-tight text-ink">
        {t('tagline')}
      </h1>
      <p className="mb-12 max-w-2xl font-serif text-2xl italic text-ink-soft">
        Egyptian-operated since 1995. Day tours, multi-day packages, and Nile
        cruises designed in conversation, not from a catalogue.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link
          href="/guide"
          className="group block rounded-lg border border-line bg-paper p-8 transition-shadow hover:shadow-soft"
        >
          <h2 className="mb-2 font-serif text-2xl text-ink group-hover:text-orange-deep">
            {tNav('guide')} →
          </h2>
          <p className="text-sm text-ink-soft">
            Operator-grade guides to Egypt's cities.
          </p>
        </Link>
        <Link
          href="/plan-your-tour"
          className="group block rounded-lg bg-ink p-8 text-paper transition-colors hover:bg-orange-deep"
        >
          <h2 className="mb-2 font-serif text-2xl text-orange group-hover:text-paper">
            {tNav('planYourTour')} →
          </h2>
          <p className="text-sm text-cream-warm">
            Talk to our concierge about the trip you want.
          </p>
        </Link>
      </div>

      <p className="mt-16 max-w-2xl text-sm text-ink-muted">
        This is a development scaffold. Most pages are stubs — the live demo
        is the city guide at <Link href="/guide/cairo" className="underline">/guide/cairo</Link>{' '}
        once you have seeded the Sanity dataset.
      </p>
    </div>
  );
}
