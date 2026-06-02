'use client';

import type { ReactNode } from 'react';

/**
 * Button that opens the global FloatingConcierge panel by dispatching the
 * `concierge:open` window event (the same channel in-article prompts use).
 * Styled by the caller's className so it can wear the reference `.cta-btn`,
 * `.btn`, or `.quiz button` looks.
 */
export function ConciergeOpenButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event('concierge:open'))}
    >
      {children}
    </button>
  );
}
