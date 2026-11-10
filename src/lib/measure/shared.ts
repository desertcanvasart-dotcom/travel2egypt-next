/**
 * Cookieless measurement helpers shared by the client counter, /api/pv and
 * /api/lead (2026-11-10). Pure + client-safe. No cookies, no IDs, no IPs.
 */

/** Our own hosts: a referrer from these is internal, not a source. */
const OWN_HOSTS = /(^|\.)travel2egypt\.org$|^localhost$|^127\.0\.0\.1$/;

/** "https://www.google.com/search?q=…" → "google.com"; internal/invalid → "". */
export function referrerDomain(ref: string | null | undefined): string {
  if (!ref) return '';
  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, '');
    if (!host || OWN_HOSTS.test(host)) return '';
    return /^[a-z0-9.-]{1,100}$/.test(host) ? host : '';
  } catch {
    return '';
  }
}

/** Keep only a clean path: no query, no hash, ≤200 chars, no trailing slash. */
export function cleanPath(p: unknown): string | null {
  if (typeof p !== 'string' || !p.startsWith('/')) return null;
  let path = p.split(/[?#]/)[0].slice(0, 200);
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return /^\/[\p{L}\p{N}\-._~/%]*$/u.test(path) ? path : null;
}

/** Crawlers, previewers and headless tools — never counted. */
export const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|discord|skype|preview|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python|httpclient|java\/|go-http|axios|node-fetch|okhttp|ahrefs|semrush|mj12|dotbot|petalbot|yandex|baiduspider|bytespider|gptbot|claudebot|perplexity|ccbot|amazonbot|applebot/i;

export const isBot = (ua: string | null | undefined) => !ua || BOT_UA.test(ua);

export type Device = 'mobile' | 'desktop';
export const SESSION_LANDING_KEY = 't2e_landing';
export const SESSION_REFERRER_KEY = 't2e_ref';
