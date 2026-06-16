'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Client-side scroll-reveal harness. Walks descendants matching
 * `.fg-card, .fg-scale__box, .fg-index__item` and stages an
 * IntersectionObserver that adds `.fg-reveal` with a staggered delay
 * once each item enters the viewport. No-ops under reduced-motion.
 *
 * Pure presentation — the CSS handles the actual animation and the
 * reduced-motion fallback; this just stamps the class.
 */
export function FieldReveal({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const items = Array.from(
      root.querySelectorAll<HTMLElement>(
        '.fg-card, .fg-scale__box, .fg-index__item',
      ),
    );
    if (!items.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          const i = items.indexOf(target);
          target.style.animationDelay = `${Math.min(i, 7) * 0.06}s`;
          target.classList.add('fg-reveal');
          io.unobserve(target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    for (const item of items) io.observe(item);

    return () => io.disconnect();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
