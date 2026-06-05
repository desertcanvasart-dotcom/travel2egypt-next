'use client';

import type { CSSProperties, ReactNode } from 'react';

/**
 * Button that opens the global FloatingConcierge panel by dispatching the
 * `concierge:open` window event (the same channel in-article prompts use).
 * Styled by the caller's className so it can wear the reference `.cta-btn`,
 * `.btn`, or `.quiz button` looks. `style` allows per-instance layout hints
 * (e.g. a grid-column span when used as a grid cell).
 */
export function ConciergeOpenButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => window.dispatchEvent(new Event('concierge:open'))}
    >
      {children}
    </button>
  );
}
