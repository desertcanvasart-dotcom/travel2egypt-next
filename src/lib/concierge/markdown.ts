import { marked } from 'marked';

import { findMatches, type MatchableEntry } from '@/lib/linkMap/match';
import type { LinkMapEntry } from '@/lib/linkMap/resolve';

/**
 * Option-A rendering (locked): agent text streams as PLAIN TEXT; only on
 * stream completion is the full message parsed as markdown and sanitized,
 * replacing the streamed content. Markdown is NEVER rendered progressively
 * mid-stream — partial markdown + innerHTML is the known-XSS path this
 * design explicitly avoids.
 *
 * `isomorphic-dompurify` is loaded via a BROWSER-ONLY dynamic import. The
 * package eagerly pulls in jsdom at module-eval time, which crashes Next's
 * server bundler — and we never sanitize server-side anyway (rendering happens
 * in the browser at stream completion and on history reload, both client-only).
 *
 * Allowlist matches what v4.1 actually produces (bold/italic/lists/links plus
 * paragraph structure). Link hardening (target/rel) happens AFTER sanitization
 * via the DOMPurify hook.
 *
 * ── Link map (locked post-processor model) ───────────────────────────────────
 * The agent prompt is NEVER told about links. Two clearly-separated link paths:
 *
 *  1. AGENT-emitted links (a hallucinated/injected `[x](url)` or a bare URL):
 *     governed by the `afterSanitizeAttributes` hook DURING sanitize — any href
 *     not in the resolved map is neutralized. This is the hallucination guard.
 *
 *  2. POST-PROCESSOR links (this file's `wrapEntities`): added AFTER sanitize by
 *     direct DOM node operations (`createElement` + `setAttribute` +
 *     `textContent`) — NEVER innerHTML/string markup. They bypass the sanitizer
 *     entirely; the only thing that makes that safe is that NO map string
 *     (canonicalName, alias, url) is ever interpreted as markup — aliases are
 *     used for matching only, the anchor text is the agent's own (already-safe)
 *     text via `textContent`, and the href is a map-derived path via
 *     `setAttribute`. They are map-derived by construction, so they do not need
 *     (and must not be subjected to) the agent-link allowlist.
 *
 *  DO NOT move wrapping before sanitize: that would subject map links to the
 *  allowlist (or, worse, let agent links skip it).
 */

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTR = ['href'];

type PurifyModule = typeof import('isomorphic-dompurify').default;

let purifyPromise: Promise<PurifyModule> | null = null;

// The resolved-map URL allowlist for the CURRENT sanitize call. Set just before
// DOMPurify.sanitize and cleared right after — synchronous, single-threaded, so
// there is no overlap. Governs AGENT-emitted links only (see header).
let agentHrefAllowlist: ReadonlySet<string> | null = null;

function loadPurify(): Promise<PurifyModule> {
  if (!purifyPromise) {
    purifyPromise = import('isomorphic-dompurify').then(({ default: DOMPurify }) => {
      DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if (node.tagName === 'A') {
          const href = node.getAttribute('href') ?? '';
          // http(s) and same-site relative links only — strip javascript:, data:, etc.
          if (!/^(https?:\/\/|\/)/i.test(href)) {
            node.removeAttribute('href');
            return;
          }
          // Hallucination guard: an AGENT-emitted link must be in the curated
          // map, else neutralize it (the post-processor's own links are added
          // after sanitize and never reach this hook).
          if (agentHrefAllowlist && !agentHrefAllowlist.has(href)) {
            node.removeAttribute('href');
            return;
          }
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      });
      return DOMPurify;
    });
  }
  return purifyPromise;
}

/**
 * Wrap recognized entity names with map links — AFTER sanitize, DOM ops only.
 * Walks text nodes NOT inside an existing `<a>`/`<code>`; first occurrence of
 * each entity per message (longest-match, case-insensitive, whole-word).
 */
export function wrapEntities(root: DocumentFragment, entries: LinkMapEntry[]): void {
  const matchable: MatchableEntry[] = entries.map((e) => ({
    url: e.url,
    phrases: [e.canonicalName, ...e.aliases],
  }));
  const linked = new Set<string>();

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      for (let p = node.parentElement; p; p = p.parentElement) {
        if (p.tagName === 'A' || p.tagName === 'CODE') return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) textNodes.push(n as Text);

  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? '';
    const matches = findMatches(text, matchable, linked);
    if (matches.length === 0) continue;

    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const m of matches) {
      if (m.start > pos) frag.appendChild(document.createTextNode(text.slice(pos, m.start)));
      const a = document.createElement('a');
      a.setAttribute('href', m.url); // map-derived; setAttribute never parses markup
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.textContent = text.slice(m.start, m.end); // agent's own text; textContent escapes
      frag.appendChild(a);
      linked.add(m.url);
      pos = m.end;
    }
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    textNode.parentNode?.replaceChild(frag, textNode);
  }
}

/**
 * Full agent message → safe HTML string for innerHTML. Browser-only.
 * `linkMap` (resolved for the active locale) drives the entity-wrapping
 * post-processor + the agent-link allowlist; omit/empty → no wrapping.
 */
export async function renderAgentMarkdown(
  text: string,
  linkMap: LinkMapEntry[] = [],
): Promise<string> {
  const DOMPurify = await loadPurify();
  const html = marked.parse(text, { async: false, gfm: true, breaks: true });

  agentHrefAllowlist = new Set(linkMap.map((e) => e.url));
  let safe: string;
  try {
    safe = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, KEEP_CONTENT: true });
  } finally {
    agentHrefAllowlist = null;
  }

  if (linkMap.length === 0) return safe;

  // Entity-wrap AFTER sanitize. `safe` is already DOMPurify-sanitized, so this
  // innerHTML assignment is safe; the wrapped anchors are built by DOM ops, not
  // markup (see header).
  const template = document.createElement('template');
  template.innerHTML = safe;
  wrapEntities(template.content, linkMap);
  return template.innerHTML;
}
