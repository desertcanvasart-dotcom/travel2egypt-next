'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

import { Link } from '@/i18n/navigation';

/**
 * Homepage redesign — Hero (ported from the design prototype into our stack:
 * Cormorant + Source Serif 4, our palette (night/paper/sand), framer-motion).
 * NOTE: copy is placeholder from the prototype and English-only for now — it
 * moves to i18n/messages once the final headline/deck are locked.
 */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const kicker = 'font-sans text-[11px] font-medium uppercase tracking-[0.32em]';

const COVER_LINES = [
  { n: '01', title: 'The Slow Nile', meta: '8 days by dahabiya' },
  { n: '02', title: 'Cairo After Dark', meta: 'A walk in five acts' },
  { n: '03', title: 'The White Desert', meta: 'One night under chalk & stars' },
];

function HeadlineLine({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        initial={{ y: '110%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 1.1, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[680px] overflow-hidden bg-night text-paper">
      {/* Cover photograph — parallax + scale-in */}
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <motion.img
          src="/home/hero.jpg"
          alt="The Temple of Hatshepsut at Deir el-Bahari, Luxor, beneath its desert cliffs"
          className="h-[115%] w-full object-cover"
          initial={{ scale: 1.14, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: EASE }}
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/25 to-night/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-night/60 via-transparent to-transparent" />

      {/* Content */}
      <motion.div style={{ opacity: fade }} className="relative z-10 flex h-full flex-col">
        {/* Dateline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 pt-24 text-[10px] uppercase tracking-[0.3em] text-paper/70 md:px-10 md:pt-28 md:text-[11px]"
        >
          <span>Issue Nº 07 — Summer 2026</span>
          <span className="hidden md:block">Cairo · Luxor · Aswan</span>
          <span>Est. 2003</span>
        </motion.div>

        {/* Headline block */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 md:px-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
            className={`${kicker} mb-6 text-sand md:mb-8`}
          >
            The Egypt Journal — cover story
          </motion.p>

          <h1 className="max-w-[13ch] font-serif text-[clamp(2.9rem,8.4vw,7.5rem)] font-light leading-[0.98] tracking-[-0.01em]">
            <HeadlineLine delay={0.55}>Egypt asks more</HeadlineLine>
            <HeadlineLine delay={0.68}>of you than its</HeadlineLine>
            <HeadlineLine delay={0.81}>
              <em className="font-normal italic text-sand">postcards admit.</em>
            </HeadlineLine>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 1.05 }}
            className="mt-7 max-w-md text-[15px] leading-relaxed text-paper/80 md:mt-9 md:text-base"
          >
            An editorial travel journal of Egypt — operator-grade guides and private
            journeys, drafted in seconds by our AI concierge and refined by the Cairo
            team that has run them for thirty years.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 1.2 }}
            className="mt-9 flex flex-wrap items-center gap-5"
          >
            <Link
              href="/plan-your-tour"
              className="group flex items-center gap-3 rounded-full bg-sand px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-night transition-all duration-300 hover:brightness-105"
            >
              <SparkleIcon />
              Plan with the concierge
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-paper/80 underline-offset-4 transition-colors hover:text-paper hover:underline"
            >
              Read the issue
              <ArrowDownIcon />
            </Link>
          </motion.div>
        </div>

        {/* In this issue — cover strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.45 }}
          className="relative z-10 border-t border-white/15"
        >
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 md:grid-cols-4">
            <div className="hidden items-center px-10 py-5 md:flex">
              <span className="text-[10px] uppercase tracking-[0.34em] text-paper/50">In this issue</span>
            </div>
            {COVER_LINES.map((c) => (
              <a
                key={c.n}
                href="#journal"
                className="group hidden items-baseline gap-3 border-l border-white/15 px-8 py-5 transition-colors duration-300 hover:bg-white/5 md:flex"
              >
                <span className="font-serif text-sm italic text-sand">{c.n}</span>
                <span>
                  <span className="block font-serif text-[15px] leading-tight text-paper/90 transition-colors group-hover:text-sand">
                    {c.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-paper/45">{c.meta}</span>
                </span>
              </a>
            ))}
            <div className="flex items-center justify-between px-5 py-4 md:hidden">
              <span className="text-[10px] uppercase tracking-[0.3em] text-paper/50">In this issue — 3 stories</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="transition-transform duration-300 group-hover:rotate-12">
      <path d="M12 2l1.7 6.1L20 9.8l-5.5 1.7L12 18l-2.5-6.5L4 9.8l6.3-1.7L12 2z" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}
