'use client';

import { useEffect } from 'react';

/**
 * Deep-link support for the FAQ accordion. Native <details> elements can't
 * be opened by CSS, so on load (and on hashchange) we find the <details>
 * whose id matches the URL fragment, open it, and scroll it into view.
 * Renders nothing.
 */
export function FaqHashOpener() {
  useEffect(() => {
    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  return null;
}
