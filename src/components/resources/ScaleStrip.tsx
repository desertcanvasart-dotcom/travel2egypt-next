import type { ReactNode } from 'react';

interface ScaleStripProps {
  /** Heading, supports `<em>` for italic gold accent */
  heading: ReactNode;
  /** Subtitle (italics live inline) */
  sub: ReactNode;
  /** Right-side label, e.g. "Metres · as built" */
  unitLabel: ReactNode;
  /** The wide drawn-to-scale SVG itself */
  children: ReactNode;
}

/**
 * The "drawn to relative scale" comparison strip. Intro row (h2 + sub on
 * the left, gold unit label on the right) above an SVG box. Caller hands
 * in the SVG so each guide can compose its own visualization.
 */
export function ScaleStrip({
  heading,
  sub,
  unitLabel,
  children,
}: ScaleStripProps) {
  return (
    <section className="fg-scale">
      <div className="fg-scale__intro">
        <div>
          <h2>{heading}</h2>
          <p className="fg-scale__sub">{sub}</p>
        </div>
        <span className="fg-label fg-label--gold">{unitLabel}</span>
      </div>
      <div className="fg-scale__box">{children}</div>
    </section>
  );
}
