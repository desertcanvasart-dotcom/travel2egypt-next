'use client';

import { useEffect, useRef, useState } from 'react';

import type { TocHeading } from '@/lib/portable-text';

export interface ArticleSidebarLabels {
  toc: string;
  conciergeText: string;
  conciergeCta: string;
  filedUnder: string;
  share: string;
  copyLink: string;
  copied: string;
  email: string;
}

interface Props {
  headings: TocHeading[];
  /** Already-localized strings: category, then cities. */
  filedUnder: string[];
  labels: ArticleSidebarLabels;
  /** Article title — used for the email share subject. */
  shareTitle: string;
}

export function ArticleSidebar({ headings, filedUnder, labels, shareTitle }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll-spy via IntersectionObserver (not a scroll listener). The active
  // heading is the last one whose top has crossed the upper reading line.
  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Pick the earliest heading still in the active band; fall back to
        // the last heading scrolled past.
        const firstVisible = headings.find((h) => visible.has(h.id));
        if (firstVisible) {
          setActiveId(firstVisible.id);
        } else {
          const scrolledPast = [...elements]
            .filter((el) => el.getBoundingClientRect().top < 140)
            .pop();
          if (scrolledPast) setActiveId(scrolledPast.id);
        }
      },
      // Activate a heading once it enters the top ~25% of the viewport.
      { rootMargin: '-110px 0px -70% 0px', threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  function openConcierge() {
    window.dispatchEvent(new CustomEvent('concierge:open'));
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  function shareByEmail() {
    const url = window.location.href;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      shareTitle
    )}&body=${encodeURIComponent(url)}`;
  }

  return (
    <aside className="lg:sticky lg:top-28">
      {headings.length > 0 && (
        <nav
          aria-label={labels.toc}
          className="mb-9 border-b border-rule pb-9"
        >
          <p className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.18em] text-gold-ink">
            {labels.toc}
          </p>
          <ul className="space-y-3">
            {headings.map((h) => {
              const active = h.id === activeId;
              return (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    aria-current={active ? 'location' : undefined}
                    className={`block font-sans text-sm leading-snug transition-colors ${
                      active
                        ? '-ml-3 border-l-2 border-sand pl-[10px] text-night'
                        : 'text-night-soft hover:text-night'
                    }`}
                  >
                    {h.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <div className="mb-9 border-b border-rule pb-9">
        <div className="border-l border-sand bg-limestone-warm p-5">
          <p className="mb-4 font-serif text-base italic leading-snug text-night">
            {labels.conciergeText}
          </p>
          <button
            type="button"
            onClick={openConcierge}
            className="font-sans text-xs uppercase tracking-[0.06em] text-gold-ink transition-colors hover:text-night"
          >
            {labels.conciergeCta} <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {filedUnder.length > 0 && (
        <div className="mb-9 border-b border-rule pb-9">
          <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-gold-ink">
            {labels.filedUnder}
          </p>
          <p className="font-sans text-sm leading-relaxed text-night-soft">
            {filedUnder.map((item, i) => (
              <span key={item}>
                {i === 0 ? <strong className="font-medium text-night">{item}</strong> : item}
                {i < filedUnder.length - 1 && <span aria-hidden> · </span>}
              </span>
            ))}
          </p>
        </div>
      )}

      <div>
        <p className="mb-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-night-soft">
          {labels.share}
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={copyLink}
            className="font-sans text-xs uppercase tracking-[0.06em] text-night-soft transition-colors hover:text-night"
          >
            {copied ? labels.copied : labels.copyLink}
          </button>
          <button
            type="button"
            onClick={shareByEmail}
            className="font-sans text-xs uppercase tracking-[0.06em] text-night-soft transition-colors hover:text-night"
          >
            {labels.email}
          </button>
        </div>
      </div>
    </aside>
  );
}
