import type { ReactNode } from 'react';

interface FieldMastheadProps {
  /** Issue/series label, e.g. "No. 01" */
  number: string;
  /** Region or category, e.g. "Lower Egypt" */
  region: string;
  /** Tag summary, e.g. "Eight Monuments" */
  tagSummary: string;
  /** Main title; the optional `em` portion is rendered as the gold italic accent */
  title: ReactNode;
  /** Standfirst paragraph; the optional `em` portion is rendered muted-italic */
  standfirst: ReactNode;
  /** Wordmark suffix — defaults to "Field Guide" (singular) for individual
   *  guides. The /resources index passes "Field Guides" (plural) since it
   *  reads as the volume that contains them. */
  wordmarkSuffix?: string;
}

/**
 * The reference field-guide masthead — wordmark on the left, three labels
 * on the right, the big italic-accented title and a 46ch standfirst.
 * Title/standfirst accept ReactNode so callers can mark the gold italic
 * accent inline with `<em>`.
 */
export function FieldMasthead({
  number,
  region,
  tagSummary,
  title,
  standfirst,
  wordmarkSuffix = 'Field Guide',
}: FieldMastheadProps) {
  return (
    <header className="fg-mast">
      <div className="fg-mast__top">
        <div className="fg-wordmark">
          Travel<span>2</span>Egypt &nbsp;·&nbsp; {wordmarkSuffix}
        </div>
        <div className="fg-mast__meta">
          <span className="fg-label fg-label--soft">{number}</span>
          <span className="fg-label fg-label--soft">{region}</span>
          <span className="fg-label fg-label--gold">{tagSummary}</span>
        </div>
      </div>
      <h1>{title}</h1>
      <p className="fg-standfirst">{standfirst}</p>
    </header>
  );
}
