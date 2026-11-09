'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

/**
 * The slide-out CONCIERGE panel, loaded only when it's opened (product page
 * template, 2026-11-09). Until then this renders the same trigger button and
 * nothing else; the panel's script is fetched on the first click or on the
 * `concierge:open` event. Hidden on Japanese pages (the concierge doesn't
 * speak Japanese).
 */
const FloatingConcierge = dynamic(() => import('./FloatingConcierge').then((m) => m.FloatingConcierge), {
  ssr: false,
});

export function LazyFloatingConcierge({ tourSlug }: { tourSlug?: string | null }) {
  const locale = useLocale();
  const t = useTranslations('floatingConcierge');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const onOpen = () => setMounted(true);
    window.addEventListener('concierge:open', onOpen);
    return () => window.removeEventListener('concierge:open', onOpen);
  }, []);

  if (locale === 'ja') return null;
  if (mounted) return <FloatingConcierge tourSlug={tourSlug} initialOpen />;
  return (
    <div className="t2e-conc">
      <button type="button" className="t2e-conc-trigger" aria-haspopup="dialog" aria-expanded={false} onClick={() => setMounted(true)}>
        <span className="dot" aria-hidden />
        {t('trigger')}
      </button>
    </div>
  );
}
