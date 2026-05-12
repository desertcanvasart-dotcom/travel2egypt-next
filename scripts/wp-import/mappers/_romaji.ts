/**
 * Japanese → ASCII slug helper.
 *
 * Single source of truth for JA slug generation. Consumed by:
 *   (a) scripts/migrate-ja-romaji-slugs.ts — one-shot migration of
 *       existing JA docs across entity types
 *   (b) scripts/wp-import/mappers/*.ts — wp-import mappers handling
 *       future JA content imports
 *
 * Locked policies (from docs/decisions/ja-slug-options.md §1.5):
 *   1. Hepburn romanization via kuroshiro + kuroshiro-analyzer-kuromoji.
 *   2. Macrons collapsed: ō→o, ū→u, ē→e, ā→a, ī→i.
 *   3. 60-char cap, truncate at last hyphen at or before position 60.
 *      Never mid-word. Hard-truncate only if no hyphen within cap.
 *   4. Particles preserved as romaji (no, ni, e, ga, wo, wa, to, de,
 *      kara, made, ya, mo). Romaji is transliteration, not paraphrase.
 *
 * Init is one-time per process (loads ~13MB kuromoji dictionary).
 * titleToRomajiSlug() is pure-after-init: same input → same output.
 */

// kuroshiro v1.2 ships CJS; we use dynamic import for ESM/tsx compat
// and the standard `.default ?? Mod` interop pattern.
type KuroshiroInstance = {
  convert: (
    text: string,
    opts: { to: string; mode: string; romajiSystem: string }
  ) => Promise<string>;
};

let kuroshiro: KuroshiroInstance | null = null;

export async function initRomaji(): Promise<void> {
  if (kuroshiro) {
    // Idempotent — calling twice is a no-op rather than an error so
    // tests / repeated migration runs don't have to coordinate.
    return;
  }
  const KuroshiroMod = await import('kuroshiro');
  const KuromojiMod = await import('kuroshiro-analyzer-kuromoji');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Kuroshiro = (KuroshiroMod as any).default ?? KuroshiroMod;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const KuromojiAnalyzer = (KuromojiMod as any).default ?? KuromojiMod;
  const k = new Kuroshiro();
  await k.init(new KuromojiAnalyzer());
  kuroshiro = k;
}

function stripMacrons(s: string): string {
  return s
    .replace(/ō/g, 'o').replace(/Ō/g, 'O')
    .replace(/ū/g, 'u').replace(/Ū/g, 'U')
    .replace(/ē/g, 'e').replace(/Ē/g, 'E')
    .replace(/ā/g, 'a').replace(/Ā/g, 'A')
    .replace(/ī/g, 'i').replace(/Ī/g, 'I');
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // drop punctuation (incl. JA full-width)
    .replace(/\s+/g, '-')           // whitespace to hyphen
    .replace(/-+/g, '-')            // collapse runs of hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing hyphen
}

const MAX_SLUG_LENGTH = 60;

function truncateAtWordBoundary(s: string, max = MAX_SLUG_LENGTH): string {
  if (s.length <= max) return s;
  const cut = s.lastIndexOf('-', max);
  // Hard-truncate only when no hyphen exists within cap — exceedingly
  // rare with romanized JA, but cap is a hard guarantee.
  return cut > 0 ? s.slice(0, cut) : s.slice(0, max);
}

export async function titleToRomajiSlug(jaTitle: string): Promise<string> {
  if (!kuroshiro) {
    throw new Error(
      'titleToRomajiSlug called before initRomaji(); await initRomaji() at script startup.'
    );
  }
  const hepburn = await kuroshiro.convert(jaTitle, {
    to: 'romaji',
    mode: 'spaced',
    romajiSystem: 'hepburn',
  });
  const ascii = stripMacrons(hepburn);
  const slug = slugify(ascii);
  return truncateAtWordBoundary(slug);
}
