import type { ReactNode } from 'react';

/**
 * Root wrapper for every /resources page. Applies the .fg-doc scope so all
 * `fg-*` styles in src/styles/resources.css activate, and provides the
 * fixed `.fg-wrap` content gutter from the reference design.
 */
export function FieldGuideShell({ children }: { children: ReactNode }) {
  return (
    <div className="fg-doc">
      <div className="fg-wrap">{children}</div>
    </div>
  );
}
