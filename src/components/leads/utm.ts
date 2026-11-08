/**
 * Campaign tags for leads: captured from the landing URL once per browser
 * session (so a visitor who lands from an ad and submits three pages later is
 * still attributed), read back when the lead form submits. sessionStorage
 * only — no cookie, nothing persists past the tab.
 */
const KEY = 't2e_utm';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];

export function captureUtm(): void {
  try {
    const sp = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const p of PARAMS) {
      const v = sp.get(p);
      if (v) found[p] = v.slice(0, 200);
    }
    if (Object.keys(found).length > 0) sessionStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    // storage disabled — attribution is best-effort
  }
}

export function readUtm(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}
