'use client';

import { useMemo, useState } from 'react';

import { PHONETIC_MAP, CARTOUCHE } from '@/data/hieroglyph-phonetics';

interface Labels {
  banner: string;
  inputLabel: string;
  placeholder: string;
  emptyState: string;
  cartoucheToggle: string;
  disclaimer: string;
}

interface Props {
  labels: Labels;
}

export function HieroglyphTranslator({ labels }: Props) {
  const [name, setName] = useState('');
  const [showCartouche, setShowCartouche] = useState(true);

  const glyphs = useMemo(() => {
    return name
      .toLowerCase()
      .split('')
      .map((ch) => PHONETIC_MAP[ch])
      .filter((g): g is NonNullable<typeof g> => Boolean(g));
  }, [name]);

  return (
    <div className="space-y-12">
      {/* Banner */}
      <p className="rounded-lg border border-orange-pale bg-cream-warm/60 px-4 py-3 text-center font-sans text-sm text-ink-soft">
        ✨ {labels.banner}
      </p>

      {/* Input */}
      <label className="block">
        <span className="mb-3 block text-center font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
          {labels.inputLabel}
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.placeholder}
          maxLength={50}
          autoFocus
          aria-label={labels.inputLabel}
          className="w-full rounded-md border border-line bg-paper px-5 py-4 text-center font-serif text-2xl leading-normal text-ink shadow-sm transition focus:border-orange-deep focus:outline-none focus:ring-2 focus:ring-orange-pale"
        />
      </label>

      {/* Result */}
      <div className="min-h-[180px]">
        {glyphs.length === 0 ? (
          <p className="py-12 text-center font-serif text-lg italic text-ink-muted">
            {labels.emptyState}
          </p>
        ) : (
          <>
            <div
              className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-line bg-cream-warm/40 px-6 py-10 text-ink"
              role="img"
              aria-label={glyphs.map((g) => g.name).join(', ')}
            >
              {showCartouche && (
                <span className="font-hieroglyph text-7xl leading-none text-orange-deep" aria-hidden>
                  {CARTOUCHE.open}
                </span>
              )}
              {glyphs.map((g, i) => (
                <span
                  key={i}
                  title={`${g.name} — ${g.description}`}
                  className="font-hieroglyph text-7xl leading-none"
                >
                  {g.char}
                </span>
              ))}
              {showCartouche && (
                <span className="font-hieroglyph text-7xl leading-none text-orange-deep" aria-hidden>
                  {CARTOUCHE.close}
                </span>
              )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <label className="inline-flex cursor-pointer items-center gap-2 text-ink-soft">
                <input
                  type="checkbox"
                  checked={showCartouche}
                  onChange={(e) => setShowCartouche(e.target.checked)}
                  className="h-4 w-4 rounded border-line accent-orange-deep"
                />
                {labels.cartoucheToggle}
              </label>
            </div>

            {/* Letter-by-letter breakdown for the curious */}
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 md:grid-cols-4">
              {glyphs.map((g, i) => (
                <li key={i} className="flex items-baseline gap-3 text-ink-soft">
                  <span className="font-hieroglyph text-2xl text-ink">{g.char}</span>
                  <span>
                    <span className="font-mono text-xs uppercase text-ink-muted">{g.gardiner}</span>
                    <span className="block text-xs">{g.name}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <p className="border-t border-line pt-6 text-center text-xs leading-relaxed text-ink-muted">
        {labels.disclaimer}
      </p>
    </div>
  );
}
