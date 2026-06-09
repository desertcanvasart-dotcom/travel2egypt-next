import { Fragment } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Journey indicator — the three-step "chat → brief → team delivers" row with
 * hairline connectors between steps. Stacks vertically on mobile (connectors
 * hidden). The numerals are decorative order markers (aria-hidden); the
 * connectors are grid items between steps, so this is a plain styled grid
 * rather than a semantic <ol> (a <span> connector isn't a valid <li> sibling).
 */
export function JourneyIndicator() {
  const t = useTranslations('planYourTour');
  const steps = [
    { num: '01', title: t('journey1Title'), desc: t('journey1Desc') },
    { num: '02', title: t('journey2Title'), desc: t('journey2Desc') },
    { num: '03', title: t('journey3Title'), desc: t('journey3Desc') },
  ];
  return (
    <section className="cnc-journey">
      <div className="cnc-journey__inner">
        {steps.map((step, i) => (
          <Fragment key={step.num}>
            <div className="cnc-journey__step">
              <span className="cnc-journey__num" aria-hidden>
                {step.num}
              </span>
              <span className="cnc-journey__title">{step.title}</span>
              <span className="cnc-journey__desc">{step.desc}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="cnc-journey__connector" aria-hidden />
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
