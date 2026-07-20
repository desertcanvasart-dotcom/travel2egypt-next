/**
 * Japanese presentation transforms for Food articles, applied at render time so
 * authors never annotate manually. Pure functions over Portable Text blocks.
 *
 *  - annotateKatakanaFirstMentions: on the FIRST occurrence of a glossary dish's
 *    katakana form in the article, append the romanization in full-width parens
 *    — コシャリ（koshari）. Once per term per article.
 *  - injectSectionDividers: insert a `foodDivider` block before every H2 except
 *    the first, so JA sections read with the corpus's `· · ·` separators.
 *
 * The `■` heading prefix is applied by scoped CSS (.food-body-ja h2), not here,
 * so heading-id generation (the TOC anchors) stays byte-identical to EN/ES.
 */
import { FOOD_GLOSSARY, type FoodTerm } from '@/data/food-glossary';

interface PtSpan {
  _type?: string;
  text?: string;
  [k: string]: unknown;
}
interface PtBlock {
  _type?: string;
  _key?: string;
  style?: string;
  children?: PtSpan[];
  [k: string]: unknown;
}

/** Glossary terms with a katakana form, longest-katakana first (prefer longer matches). */
const KATAKANA_TERMS: FoodTerm[] = Object.values(FOOD_GLOSSARY)
  .filter((t) => t.ja)
  .sort((a, b) => b.ja.length - a.ja.length);

export function annotateKatakanaFirstMentions(blocks: unknown): unknown {
  if (!Array.isArray(blocks)) return blocks;
  const glossed = new Set<string>();

  return blocks.map((block: PtBlock) => {
    if (block?._type !== 'block' || !Array.isArray(block.children)) return block;
    const children = block.children.map((span) => {
      if (span?._type !== 'span' || typeof span.text !== 'string') return span;
      let text = span.text;
      for (const term of KATAKANA_TERMS) {
        if (glossed.has(term.ja)) continue;
        const idx = text.indexOf(term.ja);
        if (idx === -1) continue;
        const end = idx + term.ja.length;
        text = `${text.slice(0, end)}（${term.romanization}）${text.slice(end)}`;
        glossed.add(term.ja);
      }
      return { ...span, text };
    });
    return { ...block, children };
  });
}

export function injectSectionDividers(blocks: unknown): unknown {
  if (!Array.isArray(blocks)) return blocks;
  const out: PtBlock[] = [];
  let seenH2 = false;
  for (const block of blocks as PtBlock[]) {
    if (block?._type === 'block' && block.style === 'h2') {
      if (seenH2) out.push({ _type: 'foodDivider', _key: `fd-${block._key ?? out.length}` });
      seenH2 = true;
    }
    out.push(block);
  }
  return out;
}
