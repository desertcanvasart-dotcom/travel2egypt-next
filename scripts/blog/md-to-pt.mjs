/**
 * Markdown → Portable Text for native blog articles (`article`, one doc per
 * language). Lifted from the converter in scripts/create-eclipse-article.ts
 * (frontmatter, inline **strong** / *em* spans, first-match internalLink
 * injection — that script runs on import, so it cannot be imported) and
 * extended for the owner's 2026-11 article format:
 *
 *   - `# H1` is the title (checked against front matter, not emitted)
 *   - `## ` → h2, `### ` → h3 (body); the LAST `## ` section, when it is made
 *     of `### question` + answer paragraphs, becomes the `faq` field (the
 *     template renders it and emits FAQPage markup — the body must not repeat it)
 *   - `- ` → bullet list items
 *   - `[text](url)` → internalLink / externalLink markDefs via `resolveLink`
 *   - markdown tables → a `definitionList` block (no table type exists in the
 *     article schema; Body.tsx already renders definitionList and reads plain
 *     strings): header row first, then one row per line — term = column 1,
 *     note = column 2, description = column 3. Every cell stays verbatim.
 *
 * Nothing here talks to Sanity.
 */

export function frontmatter(raw) {
  const m = raw.match(/^﻿?---\n([\s\S]*?)\n---\n/);
  const out = {};
  if (m) for (const l of m[1].split('\n')) {
    const kv = l.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

export function makeKeys(prefix) {
  let n = 0;
  return (p) => `${prefix}${p}${(n++).toString(36)}`;
}

const INLINE_RE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*(.+?)\*/g;

/**
 * Inline markdown → spans. `resolveLink(url, text)` returns a markDef (without
 * _key) or null to drop the link and keep its text.
 */
function inline(text, ctx, marks = []) {
  const out = [];
  let last = 0;
  let m;
  const re = new RegExp(INLINE_RE.source, 'g');
  const push = (t, mk) => { if (t) out.push({ _key: ctx.key('s'), _type: 'span', text: t, marks: mk }); };
  while ((m = re.exec(text))) {
    push(text.slice(last, m.index), [...marks]);
    if (m[1] != null) {
      const def = ctx.resolveLink(m[2], m[1]);
      if (def) {
        const md = { _key: ctx.key('m'), ...def };
        ctx.markDefs.push(md);
        out.push(...inline(m[1], ctx, [...marks, md._key]));
      } else out.push(...inline(m[1], ctx, marks));
    } else if (m[3] != null) out.push(...inline(m[3], ctx, [...marks, 'strong']));
    else out.push(...inline(m[4], ctx, [...marks, 'em']));
    last = re.lastIndex;
  }
  push(text.slice(last), [...marks]);
  return out;
}

function block(text, style, ctx, extra = {}) {
  const markDefs = [];
  const children = inline(text, { ...ctx, markDefs });
  return { _key: ctx.key('b'), _type: 'block', style, ...extra, markDefs, children };
}

/** Plain text of a markdown line as a reader sees it (for the verbatim check). */
export const stripMd = (s) => s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1').replace(/\*\*|\*/g, '');

export const blockText = (b) =>
  b._type === 'definitionList'
    ? b.items.map((r) => [r.term, r.note, r.description].join(' | ')).join('\n')
    : (b.children ?? []).map((c) => c.text).join('');

/**
 * Parse one article file. Returns { fm, h1, body, faq, consumed, sourceLines }.
 * `sourceLines` = every content line as plain text, `consumed` = how many the
 * parser turned into output (must be equal: nothing silently dropped).
 */
export function parseArticle(raw, { key, resolveLink }) {
  const fm = frontmatter(raw);
  const lines = raw.replace(/^﻿?---\n[\s\S]*?\n---\n/, '').split('\n').map((l) => l.replace(/\s+$/, ''));
  const ctx = { key, resolveLink };
  const h2Idx = lines.map((l, i) => (/^## /.test(l) ? i : -1)).filter((i) => i >= 0);
  const lastH2 = h2Idx[h2Idx.length - 1];
  const faqStart = lastH2 != null && lines.slice(lastH2 + 1).find((l) => l.trim())?.startsWith('### ') ? lastH2 : -1;

  let h1 = null;
  const body = [];
  const faq = [];
  const sourceLines = [];
  let consumed = 0;
  let table = null;
  const flushTable = () => {
    if (!table) return;
    const [head, ...rows] = table;
    const row = (cells) => ({ _key: key('r'), _type: 'definition', term: cells[0], note: cells[1], description: cells[2] });
    body.push({ _key: key('t'), _type: 'definitionList', items: [row(head), ...rows.map(row)] });
    table = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^\|?\s*:?-{3,}/.test(line) && line.includes('|')) continue; // table separator row
    sourceLines.push(stripMd(line.replace(/^#{1,4}\s+|^-\s+/, '')));
    if (line.startsWith('|')) {
      const cells = line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.length !== 3) throw new Error(`table row with ${cells.length} cells (expected 3): ${line}`);
      (table ??= []).push(cells);
      consumed++;
      continue;
    }
    flushTable();
    if (/^# /.test(line)) { h1 = line.slice(2).trim(); consumed++; continue; }

    if (faqStart >= 0 && i >= faqStart) {
      if (i === faqStart) { consumed++; continue; } // "## Frequently asked questions" → rendered by the template
      if (/^### /.test(line)) { faq.push({ _key: key('q'), _type: 'articleFaqItem', question: stripMd(line.slice(4).trim()), answer: [] }); consumed++; continue; }
      if (!faq.length) throw new Error(`FAQ answer before any question: ${line}`);
      faq[faq.length - 1].answer.push(block(line, 'normal', ctx));
      consumed++;
      continue;
    }
    const h = line.match(/^(#{2,4})\s+(.+)$/);
    if (h) { body.push(block(h[2], `h${h[1].length}`, ctx)); consumed++; continue; }
    const li = line.match(/^[-*]\s+(.+)$/);
    if (li) { body.push(block(li[1], 'normal', ctx, { listItem: 'bullet', level: 1 })); consumed++; continue; }
    body.push(block(line, 'normal', ctx));
    consumed++;
  }
  flushTable();
  return { fm, h1, body, faq, consumed, sourceLines };
}

/**
 * Attach an internalLink to the first `normal` (incl. list) block whose text
 * contains `within` (default: `anchor`), on `anchor` inside that match. Keeps
 * the span's own marks (e.g. strong); never nests inside an existing link.
 * Returns true when linked.
 */
export function injectLink(blocks, { anchor, within = anchor, ref, weak = false }, key) {
  if (!within.includes(anchor)) throw new Error(`anchor "${anchor}" not inside "${within}"`);
  for (const b of blocks) {
    if (b._type !== 'block' || b.style !== 'normal') continue;
    const linkKeys = new Set(b.markDefs.map((d) => d._key));
    for (let idx = 0; idx < b.children.length; idx++) {
      const s = b.children[idx];
      if (s.marks.some((m) => linkKeys.has(m))) continue;
      const w = s.text.indexOf(within);
      if (w === -1) continue;
      const at = w + within.indexOf(anchor);
      const md = { _key: key('m'), _type: 'internalLink', reference: { _ref: ref, _type: 'reference', ...(weak ? { _weak: true } : {}) } };
      const parts = [
        [s.text.slice(0, at), s.marks],
        [anchor, [...s.marks, md._key]],
        [s.text.slice(at + anchor.length), s.marks],
      ].filter(([t]) => t);
      b.children.splice(idx, 1, ...parts.map(([text, marks]) => ({ _key: key('s'), _type: 'span', text, marks: [...marks] })));
      b.markDefs.push(md);
      return true;
    }
  }
  return false;
}
