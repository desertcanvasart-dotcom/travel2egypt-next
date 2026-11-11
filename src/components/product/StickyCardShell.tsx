'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Compact sticky card shell (product page right column, owner spec
 * 2026-11-11). Desktop only (the CSS hides it below 1024px).
 *
 * - Shows once the WHOLE stack above it in the right column (decision panel,
 *   plus "Your route" / "Make it your own" when they render) is out of view
 *   (above the viewport, or under the header while it is pinned), so it never
 *   overlaps or competes with them.
 * - Sticks at header height + 24px. The header height is measured live: the
 *   part of the site nav still on screen (0 once it has scrolled away).
 * - Hides again once the end block ([data-end-form]) comes into view.
 * - Fit: no fixed height, nothing clipped. When the space below the header
 *   (viewport − header − 48px) is too short it first drops the trust line,
 *   then shortens the title to one line; if the essentials (price, primary
 *   button, WhatsApp) still don't fit, it stays hidden.
 * - Stays in the layout while hidden (opacity/visibility only), so showing it
 *   never moves anything; hidden = inert, so its controls can't take focus.
 */
type Mode = 'full' | 'no-trust' | 'tight';
const MODES: Mode[] = ['full', 'no-trust', 'tight'];

export function StickyCardShell({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<{ on: boolean; mode: Mode; top: number | null }>({ on: false, mode: 'full', top: null });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const desktop = window.matchMedia('(min-width: 1024px)');
    const nav = document.querySelector<HTMLElement>('.t2e-nav');
    const end = document.querySelector<HTMLElement>('[data-end-form]');
    const headerH = () => (nav ? Math.max(0, Math.round(nav.getBoundingClientRect().bottom)) : 0);

    // Card height in each mode (independent of scroll): measured on load,
    // resize and once fonts are ready (JA glyphs change line breaks).
    let heights: Record<Mode, number> = { full: 0, 'no-trust': 0, tight: 0 };
    const measure = () => {
      const keep = el.dataset.fit;
      for (const m of MODES) {
        el.dataset.fit = m;
        heights[m] = el.offsetHeight;
      }
      el.dataset.fit = keep;
      heights = { ...heights };
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      if (!desktop.matches) {
        setState((s) => (s.on ? { ...s, on: false } : s));
        return;
      }
      const hdr = headerH();
      const avail = window.innerHeight - hdr - 48;
      const mode = MODES.find((m) => heights[m] > 0 && heights[m] <= avail) ?? null;
      // The stack = every earlier sibling in the right column.
      const prev = el.previousElementSibling as HTMLElement | null;
      const stackGone = prev ? prev.getBoundingClientRect().bottom <= hdr : true;
      const endInView = end ? end.getBoundingClientRect().top < window.innerHeight : false;
      const on = mode !== null && stackGone && !endInView;
      const next = { on, mode: mode ?? 'tight', top: hdr + 24 };
      setState((s) => (s.on === next.on && s.mode === next.mode && s.top === next.top ? s : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    desktop.addEventListener('change', onResize);
    document.fonts?.ready.then(onResize).catch(() => {});
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      desktop.removeEventListener('change', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <aside
      ref={ref}
      className={`pdp-sticky${state.on ? ' is-on' : ''}`}
      data-fit={state.mode}
      aria-label={label}
      aria-hidden={!state.on}
      inert={!state.on}
      style={state.top != null ? { top: state.top } : undefined}
    >
      {children}
    </aside>
  );
}
