/**
 * Authenticated WP REST client.
 *
 * - HTTP Basic auth via the developer admin app-password.
 * - User-Agent: t2e-migration/1.0 (REQUIRED — Cloudflare returns "error 1010"
 *   on auth requests without a UA, even with valid creds. Verified.)
 * - Token-bucket rate limiter (default 4 req/sec, configurable via --rate).
 * - Wordfence backoff: any 403 (other than rest_forbidden_context) or 429 →
 *   pause 60s → probe at 1 req/sec for 30s → resume. Three triggers in one
 *   run = halt with operator notice.
 * - On-disk cache for paginated GETs (so re-runs don't re-fetch).
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Env } from './env.js';
import type { Locale } from './types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_DIR = join(ROOT, 'migration/.cache/rest');

mkdirSync(CACHE_DIR, { recursive: true });

const USER_AGENT = 't2e-migration/1.0';
const MAX_BACKOFFS = 3;

export class WordfenceHaltError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WordfenceHaltError';
  }
}

interface FetchOptions {
  /** Skip cache lookup and force network fetch. */
  bypassCache?: boolean;
  /** Override request method. Default GET. */
  method?: 'GET' | 'POST';
  /** Body for non-GET. */
  body?: unknown;
}

export class WpClient {
  private readonly authHeader: string;
  private readonly host: string;
  private readonly tokens: { tokens: number; lastRefill: number; capacity: number; refillRate: number };
  private backoffCount = 0;

  constructor(env: Env, ratePerSec: number) {
    this.authHeader = 'Basic ' + Buffer.from(`${env.wpUsername}:${env.wpPassword}`).toString('base64');
    this.host = env.wpHost;
    this.tokens = {
      tokens: ratePerSec,
      lastRefill: Date.now(),
      capacity: ratePerSec,
      refillRate: ratePerSec,
    };
  }

  /** Wait for one token to be available, then consume it. */
  private async takeToken(): Promise<void> {
    while (true) {
      const now = Date.now();
      const elapsed = (now - this.tokens.lastRefill) / 1000;
      this.tokens.tokens = Math.min(this.tokens.capacity, this.tokens.tokens + elapsed * this.tokens.refillRate);
      this.tokens.lastRefill = now;
      if (this.tokens.tokens >= 1) {
        this.tokens.tokens -= 1;
        return;
      }
      const waitMs = Math.ceil(((1 - this.tokens.tokens) / this.tokens.refillRate) * 1000);
      await sleep(Math.max(10, waitMs));
    }
  }

  /** Wordfence backoff protocol per MIGRATION_MAPPING §1. */
  private async backoff(reason: string): Promise<void> {
    this.backoffCount++;
    if (this.backoffCount >= MAX_BACKOFFS) {
      throw new WordfenceHaltError(
        `Halted after ${MAX_BACKOFFS} Wordfence/Cloudflare backoffs in this run. Last reason: ${reason}. Coordinate with the site admin to allowlist this IP, then resume with --rate 2 (or lower).`
      );
    }
    process.stderr.write(`\n[wp-client] backoff ${this.backoffCount}/${MAX_BACKOFFS} (${reason}). Pausing 60s, then probing at 1 req/s for 30s.\n`);
    await sleep(60_000);
    // Drop rate to 1 req/s during probe, then restore.
    const originalRate = this.tokens.refillRate;
    this.tokens.refillRate = 1;
    this.tokens.capacity = 1;
    this.tokens.tokens = 1;
    await sleep(30_000);
    this.tokens.refillRate = originalRate;
    this.tokens.capacity = originalRate;
    this.tokens.tokens = originalRate;
  }

  private async fetchRaw(path: string, opts: FetchOptions = {}): Promise<{ status: number; headers: Headers; body: string }> {
    await this.takeToken();
    const url = path.startsWith('http') ? path : `${this.host}${path}`;
    const init: RequestInit = {
      method: opts.method ?? 'GET',
      headers: {
        Authorization: this.authHeader,
        'User-Agent': USER_AGENT,
        Accept: 'application/json,text/html;q=0.9,*/*;q=0.5',
      },
    };
    if (opts.body !== undefined) {
      init.body = JSON.stringify(opts.body);
      (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, init);
    const body = await res.text();
    return { status: res.status, headers: res.headers, body };
  }

  /** Single request, with retry/backoff for 429 + qualifying 403. */
  async request(path: string, opts: FetchOptions = {}): Promise<{ status: number; headers: Headers; body: string }> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await this.fetchRaw(path, opts);
      if (res.status === 429) {
        await this.backoff('429 Too Many Requests');
        continue;
      }
      if (res.status === 403) {
        // Some 403s are legitimate (e.g. rest_forbidden_context for endpoints we shouldn't be hitting).
        // Cloudflare/Wordfence 403s tend to have specific signatures.
        const cfBlock = res.body.includes('error code: 1010') || res.body.includes('Wordfence') || res.body.includes('blocked');
        if (cfBlock) {
          await this.backoff(`403 (Cloudflare/Wordfence): ${res.body.slice(0, 120)}`);
          continue;
        }
        // Genuine REST forbidden — return as-is.
        return res;
      }
      if (res.status >= 500) {
        if (attempt < 3) {
          await sleep(2_000 * (attempt + 1));
          continue;
        }
      }
      return res;
    }
    throw new Error(`request retry budget exhausted: ${path}`);
  }

  /** GET JSON with on-disk cache. */
  async getJson<T = unknown>(path: string, opts: { bypassCache?: boolean; cacheKey?: string } = {}): Promise<T> {
    const cacheKey = opts.cacheKey ?? hashKey(path);
    const cachePath = join(CACHE_DIR, `${cacheKey}.json`);
    if (!opts.bypassCache && existsSync(cachePath)) {
      return JSON.parse(readFileSync(cachePath, 'utf8'));
    }
    const res = await this.request(path);
    if (res.status >= 400) {
      throw new Error(`GET ${path} → ${res.status}: ${res.body.slice(0, 200)}`);
    }
    const data = JSON.parse(res.body) as T;
    writeFileSync(cachePath, JSON.stringify(data));
    return data;
  }

  /** Paginated GET — walks ?page=1..N transparently. */
  async getPaginated<T = unknown>(path: string, params: Record<string, string> = {}, opts: { bypassCache?: boolean } = {}): Promise<T[]> {
    const cacheKey = hashKey(`${path}?${new URLSearchParams(params).toString()}`);
    const cachePath = join(CACHE_DIR, `paginated-${cacheKey}.json`);
    if (!opts.bypassCache && existsSync(cachePath)) {
      return JSON.parse(readFileSync(cachePath, 'utf8'));
    }
    const out: T[] = [];
    let page = 1;
    const perPage = 100;
    while (true) {
      const qs = new URLSearchParams({ ...params, per_page: String(perPage), page: String(page) });
      const url = `${this.host}${path}?${qs}`;
      const res = await this.request(url);
      if (res.status === 400 || res.status === 404) break;
      if (res.status >= 400) {
        throw new Error(`paginated GET ${path} page ${page} → ${res.status}: ${res.body.slice(0, 200)}`);
      }
      const totalPages = Number(res.headers.get('x-wp-totalpages') ?? '0');
      const batch = JSON.parse(res.body) as T[];
      out.push(...batch);
      if (page >= totalPages || batch.length === 0) break;
      page++;
      if (page > 200) break;
    }
    writeFileSync(cachePath, JSON.stringify(out));
    return out;
  }

  /** Fetch a rendered HTML page (not a /wp-json/ endpoint). */
  async getHtml(url: string): Promise<string> {
    const res = await this.request(url);
    if (res.status >= 400) {
      throw new Error(`GET ${url} → ${res.status}`);
    }
    return res.body;
  }

  /** Download a binary asset (image/etc.). Returns Buffer + content-type. */
  async getBinary(url: string): Promise<{ buffer: Buffer; contentType: string }> {
    await this.takeToken();
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`binary GET ${url} → ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { buffer: buf, contentType: res.headers.get('content-type') ?? 'application/octet-stream' };
  }

  /** Fetch a WP entity with locale + context overlays. */
  async getEntity(type: 'posts' | 'pages', id: number, locale: Locale): Promise<unknown> {
    return this.getJson(`/wp-json/wp/v2/${type}/${id}?context=edit&lang=${locale}`, {
      cacheKey: `${type}-${id}-${locale}`,
    });
  }
}

function hashKey(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 24);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
