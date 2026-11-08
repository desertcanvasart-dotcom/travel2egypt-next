# Go-live steps — Sentry DSN on Railway, then the DNS cutover

Owner-facing, step by step. Written 2026-09-07 against the real state of the
system: Cloudflare is authoritative for travel2egypt.org (nameservers
austin/sureena.ns.cloudflare.com), the apex and `www` are proxied ("orange
cloud") to the WordPress host today, Google Workspace handles mail, and
Resend's DKIM record already exists. Nothing in either guide needs a code
change; the app is built to lift its own noindex the moment it sees the real
host name.

Do Part A first (any time). Do Part B in one sitting, at a quiet hour, with
30–60 minutes free afterwards for checks.

---

## Part A — Sentry error monitoring on Railway

The code is already wired and dormant: no DSN → nothing is sent. The cookie
and privacy policies were updated 2026-09-07 to describe exactly this setup,
so you may switch it on.

### A1. Create the Sentry project (once)

1. Go to https://sentry.io and sign in (or create an organisation under
   info@travel2egypt.org). When asked for a **data region, choose EU** — the
   policy says data may be stored outside Egypt, and the EU is the friendlier
   choice for your European customers.
2. **Create Project** → platform **Next.js** → name it `travel2egypt-web`.
   Skip the "install the SDK" wizard: the SDK is already installed.
3. Open **Project Settings → Client Keys (DSN)** and copy the DSN. It looks like
   `https://<long-hex>@o<org-id>.ingest.de.sentry.io/<project-id>`. A DSN is a
   public ingest key, not a secret — it is allowed in the browser bundle.

### A2. Harden the project (5 minutes, recommended)

Belt and braces on top of the app's own scrubber:

1. **Project Settings → Security & Privacy**: turn ON **Data Scrubber** and
   **Use Default Scrubbers**, and turn ON **Prevent Storing of IP Addresses**.
2. **Project Settings → Alerts** (or Alerts → Create Alert Rule): "When a new
   issue is created → send email to" your address. One rule is enough.
3. Do not enable **Session Replay** anywhere. The site has no replay SDK, and
   the cookie policy says no session recording.

### A3. Set the variables on Railway

Railway → project → service **travel2egypt-next-production** → **Variables**.
Add:

| Variable | Value |
|---|---|
| `SENTRY_DSN` | the DSN from A1 |
| `NEXT_PUBLIC_SENTRY_DSN` | the **same** DSN (this one reaches the browser) |

Leave `SENTRY_TRACES_SAMPLE_RATE` and `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
unset — the code defaults to 0.1 (one in ten), which is what the policies say.

Optional, for readable stack traces (source-map upload at build time). Skip
for launch if you like; errors still arrive, just with minified file names:

| Variable | Value |
|---|---|
| `SENTRY_ORG` | your org slug (from the Sentry URL) |
| `SENTRY_PROJECT` | `travel2egypt-web` |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → **Auth Tokens** → create, scopes `project:releases` + `org:read` |

If you do set the upload trio, first confirm the build variable
`NODE_OPTIONS=--max-old-space-size=8192` exists on Railway. The Sentry build
plugin over ~4,400 pages runs out of memory at Node's default heap.

### A4. Redeploy

`NEXT_PUBLIC_*` values are baked in at build time, so this needs a **rebuild**,
not a restart. Railway usually starts one when variables change; if it does
not, **Deployments → ⋯ → Redeploy**. Wait for the deployment to go green.

### A5. Test that an error arrives, scrubbed

1. Open https://travel2egypt-next-production.up.railway.app/ in Chrome.
2. Open DevTools (⌥⌘I on Mac) → **Console** tab, paste this and press Enter:

```js
setTimeout(() => { throw new Error('t2e sentry test ' + Date.now()) }, 0)
```

3. Within a minute, Sentry → **Issues** shows "t2e sentry test …". Open it and
   check three things:
   - **User** section: no IP address, no email, no id.
   - **Request** section: no cookies, no headers.
   - The URL shown has no query string.
4. DevTools → **Application → Cookies** → the site's origin: only the cookies
   the policy lists (`NEXT_LOCALE`, and `t2e_ccy` / `t2e_session_id` if you used
   those features). Sentry must not have added any.
5. Resolve the test issue in Sentry (Issues → select → Resolve).

If nothing arrives after two minutes: check the deployment actually rebuilt
after the variable change (A4), and that `NEXT_PUBLIC_SENTRY_DSN` has no
trailing space.

That closes the S11 "Sentry DSN live test" gate.

---

## Part B — DNS cutover: travel2egypt.org → Railway

### What actually happens

Today Cloudflare proxies `travel2egypt.org` and `www.travel2egypt.org` to the
WordPress host. You will re-point those two names at Railway. Everything else
in Cloudflare DNS — the Google mail records (`MX`, `SPF`), DMARC, Resend's
DKIM — stays untouched. WordPress keeps running on its own host, unreachable
by the public, as the rollback.

The app decides "am I live?" from the request host name. Cloudflare passes
`Host: travel2egypt.org` through to Railway, so at the moment DNS flips:
robots.txt switches from "block everything" to the real crawl policy, the
`x-robots-tag: noindex` header disappears, and canonical/hreflang URLs (which
already say travel2egypt.org) become self-consistent. No env-var change, no
redeploy.

### B0. The day before — preparation (no traffic impact)

1. **Part A done**, quality-sample and canary crons green, host still serving
   `production` content (all verified 2026-09-07).
2. **Supabase on Pro.** A Free-tier pause during launch week would take the
   concierge down. Do this before, not after.
3. **Export the current Cloudflare DNS zone** as your rollback artefact:
   Cloudflare → travel2egypt.org → **DNS → Records → Export**. Save the file.
   Also note the current **origin IPs** of the `@` and `www` A/AAAA records as
   shown in the dashboard (the public sees only Cloudflare IPs).
4. **Cloudflare SSL/TLS mode = Full.** SSL/TLS → Overview. Railway's docs:
   "You MUST set your SSL/TLS settings to Full — Full (Strict) will not work as
   intended." If it is on *Flexible* or *Full (strict)*, change it to **Full**
   now; WordPress is fine with Full.
5. **Disable WordPress-specific Cloudflare features** that would break a
   Next.js origin:
   - Speed → Optimization → **Automatic Platform Optimization (APO) for
     WordPress**: OFF if present.
   - Rules → **Page Rules / Cache Rules / Redirect Rules**: review every rule.
     Remove or disable anything that caches HTML ("Cache Everything"),
     rewrites `/wp-admin`, `/wp-login`, or forces `www`. Keep **Always Use
     HTTPS** on.
6. **Add the domains on Railway** (this is safe now — nothing routes until DNS
   changes): Railway → service → **Settings → Public Networking → + Custom
   Domain**. Add **`travel2egypt.org`**, then add **`www.travel2egypt.org`**.
   For each, Railway shows two records to create: a **CNAME** target
   (something like `abc123.up.railway.app`) and a **TXT** verification record.
   Railway's docs: "Both records are required — the domain will not verify
   with only the CNAME in place", otherwise the domain 404s.
7. **Create the two TXT records now** in Cloudflare DNS exactly as Railway
   shows them (name and value). TXT records affect nothing live. Leave the
   CNAMEs for tomorrow.
8. Check Railway plan limits: Hobby allows 2 custom domains per service, which
   is exactly what you need.

### B1. Cutover (5 minutes of work, then waiting)

Pick a quiet hour (early morning Cairo time). In Cloudflare → DNS → Records:

1. **Apex.** Delete the `A` and `AAAA` records for `@` (travel2egypt.org).
   Add a **CNAME**, name `@`, target = the Railway CNAME target from B0.6,
   **Proxy status ON (orange cloud)**. Cloudflare flattens a CNAME at the apex
   automatically. Railway's docs are explicit: "If proxying is not enabled,
   Cloudflare will not associate the domain with your Railway project."
2. **www.** Delete the `A`/`AAAA` records for `www`. Add a **CNAME**, name
   `www`, target = the same Railway target, **Proxy ON**.
3. Cloudflare → **Rules → Redirect Rules → Create**: "www → apex".
   When: Hostname equals `www.travel2egypt.org`. Then: Dynamic redirect,
   expression `concat("https://travel2egypt.org", http.request.uri.path)`,
   status **301**, preserve query string ON. One canonical host for search
   engines; the app would serve www too, but the redirect keeps things tidy.
4. Save. Cloudflare changes are live within seconds worldwide because the
   proxy IPs did not change — only the origin behind them.
5. Railway → Settings → Public Networking: within a few minutes each domain
   should show a **green check**. Railway's docs: "Certificate issuance should
   happen within an hour of your DNS being updated." (Behind Cloudflare proxy
   the visitor sees Cloudflare's certificate immediately anyway.)

### B2. Verify — the header check is the one that matters

Run these from a terminal (or ask me — I can run them the moment you say the
records are in).

The noindex lift depends on the app seeing the real host name:

```bash
curl -sI https://travel2egypt.org/ | grep -i x-robots
```

Must print **nothing**. If it prints `noindex, nofollow`, the origin is not
seeing `Host: travel2egypt.org` — check that the Cloudflare record is
proxied and that the domain shows green on Railway.

```bash
curl -s https://travel2egypt.org/robots.txt | head -3
```

Must start with `User-Agent: *` then `Allow: /` (not `Disallow: /`).

```bash
curl -sI https://www.travel2egypt.org/ | grep -iE "^HTTP|^location"
```

Must be a `301` to `https://travel2egypt.org/`.

```bash
curl -sI https://travel2egypt.org/contact-us | grep -iE "^HTTP|^location"
```

Must redirect to `/contact` — proves the legacy redirect map is live on the
real domain.

```bash
curl -s https://travel2egypt.org/ | grep -oE "ufallvd2/[a-z-]+" | sort -u
```

Must print only `ufallvd2/production`.

Then in a browser, one page per surface, English + Spanish + Japanese:
home, a tour, a guide article, `/faq`, `/privacy-policy`. Finally
`/plan-your-tour`: send a short test conversation, share an email address,
and confirm (a) the "save my conversation" email arrives with a link that
starts with `https://travel2egypt.org/` (the app builds it from the request
host, so this proves the proxy is passing the right one), and (b) the brief
lands in getAutoura under the travel2egypt brand.

### B3. Same day — search engines

1. Google Search Console → the travel2egypt.org property → **Sitemaps** →
   submit `https://travel2egypt.org/sitemap.xml`. (Bing Webmaster Tools: same.)
2. Do **not** request re-indexing page by page; the sitemap plus the 3,657
   legacy 301s carry the old URLs across.
3. Leave the GitHub cron workflows pointing at the `up.railway.app` host — the
   Railway domain keeps working alongside the custom domain.

### B4. Rollback (if anything is wrong and you cannot fix it in 15 minutes)

Cloudflare → DNS → Records: delete the two CNAMEs, re-create the `A`/`AAAA`
records for `@` and `www` with the origin IPs you noted in B0.3 (or re-import
the exported zone file), proxy ON. Disable the www redirect rule. WordPress is
back within a minute. Nothing on Railway or in Sanity needs undoing.

### B5. After a clean week

- Cancel the WordPress hosting (Hostinger) once you no longer want the
  rollback. Keep a final WP export first.
- Tidy the SPF record: `include:_spf.reach.hostinger.com` can go once no mail
  is sent from that host.
- Consider adding `www.travel2egypt.org` alerts/uptime and a Sentry alert on
  error volume.
