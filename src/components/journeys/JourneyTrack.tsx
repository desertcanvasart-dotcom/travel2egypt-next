'use client';

import type { ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { track } from '@/lib/analytics';

/** A link that sends `select_content` (journey experiences, Phase B). */
export function ExperienceLink({
  href,
  journey,
  itemId,
  className,
  children,
}: {
  href: string;
  journey: string;
  itemId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href as never}
      className={className}
      onClick={() => track('select_content', { content_type: 'journey_experience', journey, item_id: itemId })}
    >
      {children}
    </Link>
  );
}

/**
 * One question of the "Questions this traveller asks" accordion: a native
 * <details>, so the answer is in the HTML, it works by keyboard, and no
 * script is needed to read it. `faq_open` fires when a reader opens it
 * (on the summary's click — Enter/Space also click it — so the initially
 * open first question never sends one).
 */
export function FaqItem({
  journey,
  questionId,
  question,
  open,
  children,
}: {
  journey: string;
  questionId: string;
  question: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="jfaq-item" open={open}>
      <summary
        onClick={(e) => {
          const d = e.currentTarget.parentElement as HTMLDetailsElement | null;
          if (d && !d.open) track('faq_open', { journey, question_id: questionId });
        }}
      >
        {question}
      </summary>
      <div className="jfaq-a">{children}</div>
    </details>
  );
}
