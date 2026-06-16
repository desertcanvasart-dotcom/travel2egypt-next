import type { ReactNode } from 'react';

interface FieldFooterProps {
  /** Label above the plan paragraph(s), e.g. "Seeing them on the ground" */
  planHeading: string;
  /** One or more paragraphs — pass as an array */
  planParagraphs: ReactNode[];
  /** Right-column colophon body (multi-line ReactNode with `<br/>` allowed) */
  colophon: ReactNode;
}

/**
 * Guide-footer. Left column: a short "plan" — how to see/use this guide
 * in practice — under a gold label heading. Right column: wordmark +
 * colophon notes. Stacks below 980px.
 */
export function FieldFooter({
  planHeading,
  planParagraphs,
  colophon,
}: FieldFooterProps) {
  return (
    <footer className="fg-foot">
      <div className="fg-plan">
        <h3>{planHeading}</h3>
        {planParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="fg-colophon">
        <span className="fg-wordmark">
          Travel<span>2</span>Egypt
        </span>
        <p>{colophon}</p>
      </div>
    </footer>
  );
}
