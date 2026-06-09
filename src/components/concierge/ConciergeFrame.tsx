import { useTranslations } from 'next-intl';

/**
 * Concierge frame — eyebrow + heading + subheading that introduces the
 * concierge above the chat. Copy from the planYourTour namespace; the heading
 * accent renders as a faience italic clause (mirrors the ConciergeCTA split).
 */
export function ConciergeFrame() {
  const t = useTranslations('planYourTour');
  return (
    <section className="cnc-frame">
      <p className="cnc-frame__eyebrow">{t('eyebrow')}</p>
      <h1 className="cnc-frame__heading">
        {t('headingLead')} <em>{t('headingAccent')}</em>
      </h1>
      <p className="cnc-frame__subheading">{t('subheading')}</p>
    </section>
  );
}
