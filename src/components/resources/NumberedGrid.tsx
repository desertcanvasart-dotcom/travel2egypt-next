import type { ReactNode } from 'react';

/**
 * 4-column responsive card grid container. Falls back to 2 cols < 980px and
 * a single col on phones. Children should be `<SiloCard>` instances.
 */
export function NumberedGrid({ children }: { children: ReactNode }) {
  return <main className="fg-grid">{children}</main>;
}
