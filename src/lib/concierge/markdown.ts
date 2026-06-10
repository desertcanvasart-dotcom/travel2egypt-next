import { marked } from 'marked';

/**
 * Option-A rendering (locked): agent text streams as PLAIN TEXT; only on
 * stream completion is the full message parsed as markdown and sanitized,
 * replacing the streamed content. Markdown is NEVER rendered progressively
 * mid-stream — partial markdown + innerHTML is the known-XSS path this
 * design explicitly avoids.
 *
 * `isomorphic-dompurify` is loaded via a BROWSER-ONLY dynamic import. The
 * package eagerly pulls in jsdom at module-eval time, which crashes Next's
 * server bundler (jsdom can't resolve its default stylesheet under webpack)
 * — and we never sanitize server-side anyway (rendering happens in the
 * browser at stream completion and on history reload, both client-only).
 * Static-importing it would load jsdom during SSR of this client component
 * and 500 the page. Lazy import keeps the server graph jsdom-free while the
 * browser uses the native-DOM DOMPurify.
 *
 * Allowlist matches what v4.1 actually produces (bold/italic/lists/links
 * plus paragraph structure). Link hardening (target/rel) happens AFTER
 * sanitization via the DOMPurify hook — attributes added in a hook can't be
 * stripped by the pass that adds them.
 */

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTR = ['href'];

type PurifyModule = typeof import('isomorphic-dompurify').default;

let purifyPromise: Promise<PurifyModule> | null = null;

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
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      });
      return DOMPurify;
    });
  }
  return purifyPromise;
}

/** Full agent message → safe HTML string for innerHTML. Browser-only. */
export async function renderAgentMarkdown(text: string): Promise<string> {
  const DOMPurify = await loadPurify();
  const html = marked.parse(text, { async: false, gfm: true, breaks: true });
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
}
