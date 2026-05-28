# Production read-token setup

The `migration-staging` dataset (and any future private dataset) requires a
server-side **read token** for the Next.js frontend to load newly-created
docs. Without it, the public read API only returns the original WP imports
— the May-2026 MD bulk-upload guideArticles silently 404 in production.

## Token chain (resolved in `src/sanity/lib/client.ts`)

```
SANITY_API_READ_TOKEN              ← preferred, scope to Viewer role only
  ↓ (fallback, dev only)
SANITY_STAGING_API_WRITE_TOKEN     ← acceptable in dev
  ↓ (last resort)
SANITY_API_WRITE_TOKEN
```

Production should always pin `SANITY_API_READ_TOKEN`. The write-token
fallback exists so local dev "just works" with the migration credentials
already loaded into `.env`.

## One-time setup

### 1. Create the read token in Sanity Manage

1. Open https://www.sanity.io/manage → project `ufallvd2` → **API → Tokens**.
2. Click **Add API token**.
3. Name: `prod-read` (or similar).
4. Permissions: **Viewer** (read-only — important).
5. Copy the token value immediately (shown only once).

### 2. Add it to the production environment

**Vercel** (or whichever host):

```sh
# In the Vercel project → Settings → Environment Variables
SANITY_API_READ_TOKEN=<paste from step 1>
```

Set scope to **Production** (and Preview if you want preview branches to see
the same dataset). Do NOT mark it `NEXT_PUBLIC_*` — it must stay server-side.

### 3. Confirm `.env.example` matches the new shape

Already updated in this session. The relevant block:

```sh
SANITY_API_READ_TOKEN=
SANITY_API_WRITE_TOKEN=
SANITY_STAGING_API_WRITE_TOKEN=
```

### 4. Verify after deploy

After the next prod build, hit a guideArticle whose `_id` starts with
`guideArticle.<city>.<slug>` (i.e. a doc created by the MD bulk upload, not
a `wp-page-*` import). If it renders, the token is wired. If it 404s,
either the token is missing or its role is wrong.

Quick sanity check from a serverless function / route handler:

```ts
import { client } from '@/sanity/lib/client';
const doc = await client.fetch(
  `count(*[_type == "guideArticle" && _id match "guideArticle.cairo.*"])`
);
console.log('cairo MD docs visible:', doc);
// Expect ~30+ in migration-staging. 0 means the token is missing.
```

## When the dataset goes public

If/when `migration-staging` (or its successor) is set to **Public read**
in Sanity Manage → Datasets, the token becomes optional for read. The
fallback chain still works fine; no code change needed. Keep the token in
place anyway — it lets you use `perspective: 'previewDrafts'` or visible
draft docs in editorial-preview routes.
