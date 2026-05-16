/**
 * Phonetic mapping from English letters to Egyptian hieroglyphs.
 *
 * Uses the Egyptological phonetic alphabet (Manuel de Codage / 1992
 * standard) and Unicode codepoints from block U+13000-U+1342F (added
 * in Unicode 5.2). Rendering relies on Noto Sans Egyptian Hieroglyphs
 * — a free Google Font loaded by the translator page.
 *
 * Disclaimer: this is a phonetic transliteration, not historically
 * accurate ancient Egyptian writing. Real scribes used hieroglyphs
 * symbolically and grammatically. Names were typically written within
 * a cartouche (oval frame) reserved for royalty. This tool produces a
 * fun, approximate rendering of modern names.
 *
 * Some letters share glyphs (E/I both = single reed; O/U/W all = quail
 * chick; C/K both = basket; F/V both = horned viper). This reflects the
 * actual phonetic system — ancient Egyptian didn't distinguish those
 * sounds the way modern English does.
 */

export type GlyphMapping = {
  /** Gardiner sign-list ID (e.g., "G1" = Egyptian vulture). */
  gardiner: string;
  /** Codepoint in the Egyptian Hieroglyphs Unicode block. */
  char: string;
  /** Short label for tooltip / alt text. */
  name: string;
  /** Brief description for hover / a11y. */
  description: string;
};

export const PHONETIC_MAP: Record<string, GlyphMapping> = {
  a: { gardiner: 'G1',   char: '\u{1313F}', name: 'Vulture',      description: 'Egyptian vulture (Aleph)' },
  b: { gardiner: 'D58',  char: '\u{130C0}', name: 'Foot',         description: 'Foot and lower leg' },
  c: { gardiner: 'V31',  char: '\u{133A1}', name: 'Basket',       description: 'Basket with handle' },
  d: { gardiner: 'D46',  char: '\u{130A7}', name: 'Hand',         description: 'Hand' },
  e: { gardiner: 'M17',  char: '\u{131CB}', name: 'Reed',         description: 'Single reed leaf' },
  f: { gardiner: 'I9',   char: '\u{13191}', name: 'Horned viper', description: 'Horned viper' },
  g: { gardiner: 'W11',  char: '\u{133BC}', name: 'Pot stand',    description: 'Pot stand / ring stand' },
  h: { gardiner: 'O4',   char: '\u{13254}', name: 'Reed shelter', description: 'Reed shelter in fields' },
  i: { gardiner: 'M17',  char: '\u{131CB}', name: 'Reed',         description: 'Single reed leaf (same as E)' },
  j: { gardiner: 'I10',  char: '\u{13193}', name: 'Cobra',        description: 'Cobra at rest' },
  k: { gardiner: 'V31',  char: '\u{133A1}', name: 'Basket',       description: 'Basket with handle (same as C)' },
  l: { gardiner: 'E23',  char: '\u{130EC}', name: 'Lion',         description: 'Recumbent lion' },
  m: { gardiner: 'G17',  char: '\u{13153}', name: 'Owl',          description: 'Owl' },
  n: { gardiner: 'N35',  char: '\u{13216}', name: 'Water',        description: 'Ripple of water' },
  o: { gardiner: 'G43',  char: '\u{13171}', name: 'Quail chick',  description: 'Quail chick' },
  p: { gardiner: 'Q3',   char: '\u{132AA}', name: 'Stool',        description: 'Mat or stool' },
  q: { gardiner: 'N29',  char: '\u{1320E}', name: 'Hill slope',   description: 'Hill slope' },
  r: { gardiner: 'D21',  char: '\u{1308B}', name: 'Mouth',        description: 'Mouth' },
  s: { gardiner: 'S29',  char: '\u{132F4}', name: 'Folded cloth', description: 'Folded cloth' },
  t: { gardiner: 'X1',   char: '\u{133CF}', name: 'Bread loaf',   description: 'Bread loaf' },
  u: { gardiner: 'G43',  char: '\u{13171}', name: 'Quail chick',  description: 'Quail chick (same as O)' },
  v: { gardiner: 'I9',   char: '\u{13191}', name: 'Horned viper', description: 'Horned viper (same as F)' },
  w: { gardiner: 'G43',  char: '\u{13171}', name: 'Quail chick',  description: 'Quail chick (same as O, U)' },
  x: { gardiner: 'Aa1',  char: '\u{1340D}', name: 'Placenta',     description: 'Placenta (Kh sound, close enough)' },
  y: { gardiner: 'M17A', char: '\u{131CC}', name: 'Two reeds',    description: 'Two reed leaves' },
  z: { gardiner: 'O34',  char: '\u{13283}', name: 'Door bolt',    description: 'Door bolt' },
};

/**
 * Optional: the cartouche-frame glyphs (Ca1 / Ca2 — the oval that
 * surrounded royal names). The translator could optionally wrap output
 * in a cartouche for that "name like a pharaoh" feel.
 */
export const CARTOUCHE = {
  open:  '\u{13286}', // Ca1 — left half of cartouche
  close: '\u{13287}', // Ca2 — right half of cartouche
} as const;
