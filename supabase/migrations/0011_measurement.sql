-- 0011_measurement.sql — reliable measurement (2026-11-10): lead attribution
-- fields, cookieless aggregate page counts, change-date markers, and the
-- report functions behind /admin/report.
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database. Apply AFTER 0010.
-- Safe to re-run.
--
-- TIMING: everything is fail-soft. /api/lead stores leads without the new
-- columns until this runs (logged); /api/pv answers 204 and drops the count
-- until pageviews_daily exists; /admin/report says which table is missing.
--
-- PRIVACY: no IP address, user agent, cookie or visitor ID is stored anywhere
-- below. pageviews_daily holds aggregate counts only.

-- ── 1. Lead attribution ──────────────────────────────────────────────────
-- Old rows stay NULL (not guessed). utm_* are read from the existing utm jsonb.
alter table concierge.leads add column if not exists form_location text null;
alter table concierge.leads add column if not exists interest text null;
alter table concierge.leads add column if not exists landing_page text null;
alter table concierge.leads add column if not exists referrer_domain text null;
alter table concierge.leads add column if not exists utm_source text generated always as (utm->>'utm_source') stored;
alter table concierge.leads add column if not exists utm_medium text generated always as (utm->>'utm_medium') stored;
alter table concierge.leads add column if not exists utm_campaign text generated always as (utm->>'utm_campaign') stored;
alter table concierge.leads add column if not exists utm_term text generated always as (utm->>'utm_term') stored;
alter table concierge.leads add column if not exists utm_content text generated always as (utm->>'utm_content') stored;
-- 0010 adds these; repeated here so 0011 never fails if run alone.
alter table concierge.leads add column if not exists journey text null;
alter table concierge.leads add column if not exists style_answer jsonb null;
alter table concierge.leads add column if not exists is_test boolean not null default false;

-- ── 2. Cookieless page counts (aggregate only) ───────────────────────────
create table if not exists concierge.pageviews_daily (
  day date not null,
  path text not null,
  locale text not null default 'en',
  referrer_domain text not null default '',   -- '' = direct / internal
  device text not null default 'desktop',     -- 'mobile' | 'desktop'
  views integer not null default 0,
  primary key (day, path, locale, referrer_domain, device)
);
create index if not exists pageviews_daily_day_idx on concierge.pageviews_daily (day);
alter table concierge.pageviews_daily enable row level security;

-- Atomic +1 (called by /api/pv with the service role).
create or replace function concierge.pv_increment(p_day date, p_path text, p_locale text, p_referrer text, p_device text)
returns void
language sql
as $$
  insert into concierge.pageviews_daily as pv (day, path, locale, referrer_domain, device, views)
  values (p_day, p_path, p_locale, coalesce(p_referrer, ''), p_device, 1)
  on conflict (day, path, locale, referrer_domain, device)
  do update set views = pv.views + 1;
$$;

-- ── 3. Change-date markers (editable in /admin/report) ──────────────────
create table if not exists concierge.site_changes (
  id bigint generated always as identity primary key,
  day date not null,
  description text not null,
  created_at timestamptz not null default now()
);
create index if not exists site_changes_day_idx on concierge.site_changes (day);
alter table concierge.site_changes enable row level security;

-- Prefill: every PR merged in November 2026 (from git history, merge date
-- UTC). Add PR #212 in /admin/report once it is merged. Only inserted when
-- the table is empty, so re-running never duplicates.
insert into concierge.site_changes (day, description)
select v.day::date, v.description from (values
  ('2026-11-02', 'PR #152: perf(sanity): read through API CDN; ISR window 60s → 1h'),
  ('2026-11-06', 'PR #153: fix(redirects): JA Grand West Bank + ES/JA Safaga→Luxor tour slug renames'),
  ('2026-11-06', 'PR #154: seo: nofollow the per-tour /plan-your-tour?tour= links'),
  ('2026-11-06', 'PR #155: fix(redirects): 116 legacy WP URLs from GSC "Crawled – currently not indexed"'),
  ('2026-11-06', 'PR #156: fix(redirects): 102 legacy WP URLs from GSC "Server error (5xx)"'),
  ('2026-11-08', 'PR #157: feat(analytics): GA4 + Consent Mode v2 + conversion events'),
  ('2026-11-08', 'PR #158: fix(trust): accreditations — Ministry licence 2179, ETAA, IATA 9022839 (drop ASTA/JATA)'),
  ('2026-11-08', 'PR #159: feat(home): English sales homepage, product-first nav, itinerary form → /api/lead'),
  ('2026-11-08', 'PR #160: fix(home): round 1 review — honeypot, sticky bar, dahabiya, licence settings, estimate'),
  ('2026-11-08', 'PR #106: fix(links): close the raw travel2egypt.org sweep — final broken link repointed'),
  ('2026-11-08', 'PR #107: chore(content): Solar Boat sweep — triage CSV + 8-tour GEM-aware fix (audit trail)'),
  ('2026-11-08', 'PR #161: fix(trust): round 2 — one licence statement sitewide; 230 trips a year'),
  ('2026-11-08', 'PR #162: feat(round3): response-time promise, guide meta/intro split, priced tour blocks in articles'),
  ('2026-11-08', 'PR #163: Nile Cruises: three kinds of boat, Lake Nasser off the page'),
  ('2026-11-08', 'PR #164: Spanish and Japanese sales homepage'),
  ('2026-11-08', 'PR #165: Plan page: form first, WhatsApp and AI concierge as options'),
  ('2026-11-09', 'PR #166: Floating concierge panel: open the AI concierge, not WhatsApp'),
  ('2026-11-09', 'PR #168: Live daily exchange rates (ECB) for converted prices'),
  ('2026-11-09', 'PR #169: Product page template: decision panel, review-gated facts, offers (release 1)'),
  ('2026-11-09', 'PR #170: Product pages: full-width hero back at the top, panel overlapping it'),
  ('2026-11-09', 'PR #171: Product page LCP: hero from the Sanity CDN with high priority; gtag after load'),
  ('2026-11-09', 'PR #172: Product hero: taller box and smart crop so the photo reads'),
  ('2026-11-09', 'PR #173: Product pages: title back above the hero (original order)'),
  ('2026-11-09', 'PR #174: Product pages: full-width title, panel below the hero (not sticky)'),
  ('2026-11-09', 'PR #175: Product pages: space between the photo and the first heading'),
  ('2026-11-09', 'PR #176: Remove developer notes shown to visitors'),
  ('2026-11-09', 'PR #177: Packages hub: prices, most-booked cards, budget filter, form-first close'),
  ('2026-11-09', 'PR #178: Day-tour hubs: prices, Nile Valley first, filters, Check this date, inline form'),
  ('2026-11-09', 'PR #179: SEO: Article markup for guide, wiki and editorial pages (Ahrefs)'),
  ('2026-11-09', 'PR #180: SEO: ItemList on /hotels and /packages'),
  ('2026-11-09', 'PR #181: Redirects: fix hreflang links that point at redirects (Ahrefs)'),
  ('2026-11-09', 'PR #182: SEO: logo, image, sameAs, phone and email in the Organization markup'),
  ('2026-11-09', 'PR #183: Contact page: Spanish and Japanese title tags'),
  ('2026-11-09', 'PR #184: Redirect the Sharm–Jerusalem guide article to the Jerusalem tour'),
  ('2026-11-09', 'PR #185: Perf: cache Spanish and Japanese tour, package and landing pages'),
  ('2026-11-09', 'PR #186: perf: cache English tour/package/landing pages'),
  ('2026-11-09', 'PR #187: SEO: trim long meta descriptions at a sentence or word boundary'),
  ('2026-11-09', 'PR #188: SEO: shorter meta descriptions for 22 hand-written pages (owner-approved)'),
  ('2026-11-09', 'PR #189: SEO: meta description trim keeps EN/ES at 100+ characters'),
  ('2026-11-09', 'PR #190: SEO: shorter Spanish homepage meta description'),
  ('2026-11-09', 'PR #191: Redirect 180 old addresses with external links that now 404'),
  ('2026-11-09', 'PR #192: Tour blocks that match the article, on every blog post'),
  ('2026-11-09', 'PR #193: Redirect 25 dead tour pages Google still ranks; keyword map'),
  ('2026-11-09', 'PR #194: Search-led titles on 8 near-page-1 pages; SEO fields no longer leak English'),
  ('2026-11-09', 'PR #195: Spanish: search-led titles on 10 pages; the two cruise pages stop competing'),
  ('2026-11-09', 'PR #196: Redirect 54 old tour addresses Search Console lists as 404'),
  ('2026-11-09', 'PR #197: B5 batch 2: search titles for 17 pages + FAQs on 4 landings'),
  ('2026-11-10', 'PR #198: B5 Spanish batch 2: search titles for 11 pages + FAQs on 4 landings'),
  ('2026-11-10', 'PR #199: fix(seo): Search Console server errors — all 129 re-tested, 6 dead ends redirected'),
  ('2026-11-10', 'PR #200: Copy fixes: Spanish 9-day body (was Portuguese) + dahabiya ''no engine'''),
  ('2026-11-10', 'PR #201: fix(seo): ''Crawled – not indexed'' review — noindex empty categories, 3 redirect fixes'),
  ('2026-11-10', 'PR #202: fix(seo): 404 round 6 — 128 redirects, 28 better destinations, ''abu-simble'' spelling'),
  ('2026-11-10', 'PR #205: Merge the two Lake Nasser posts (EN/ES/JA): FAQ, last-updated date, redirects (DRAFT, awaiting approval)'),
  ('2026-11-10', 'PR #206: Siwa Desert Escape: practical-information section on package pages + owner copy'),
  ('2026-11-10', 'PR #204: chore: record Abu Simbel slug fix script (already applied)'),
  ('2026-11-10', 'PR #203: B5: small-group page search title (EN/ES)'),
  ('2026-11-10', 'PR #207: docs: Siwa tour — Alexander''s visit 332 BC (owner decision)'),
  ('2026-11-10', 'PR #208: content: Alexander''s Siwa visit → 332 BC site-wide (already applied in Sanity)'),
  ('2026-11-10', 'PR #209: JA end tour box → WhatsApp; Siwa ES/JA addresses say 4 days'),
  ('2026-11-10', 'PR #210: Guide pages: show photo credit under the hero (needed for Creative Commons images)'),
  ('2026-11-10', 'PR #211: feat(nav): header + footer navigation rebuild (EN/ES/JA)')
) as v(day, description)
where not exists (select 1 from concierge.site_changes);

-- ── 4. Report functions (read by /admin/report with the service role) ───
-- Page views by path in a date range (optionally one locale).
create or replace function concierge.pv_by_path(p_from date, p_to date, p_locale text default null)
returns table (path text, views bigint)
language sql stable
as $$
  select path, sum(views)::bigint
  from concierge.pageviews_daily
  where day between p_from and p_to and (p_locale is null or locale = p_locale)
  group by path
  order by 2 desc;
$$;

-- Page views per day in a date range (optionally one locale).
create or replace function concierge.pv_by_day(p_from date, p_to date, p_locale text default null)
returns table (day date, views bigint)
language sql stable
as $$
  select day, sum(views)::bigint
  from concierge.pageviews_daily
  where day between p_from and p_to and (p_locale is null or locale = p_locale)
  group by day
  order by day;
$$;

-- Page views by referrer domain / device in a date range.
create or replace function concierge.pv_by_referrer(p_from date, p_to date, p_locale text default null)
returns table (referrer_domain text, views bigint)
language sql stable
as $$
  select referrer_domain, sum(views)::bigint
  from concierge.pageviews_daily
  where day between p_from and p_to and (p_locale is null or locale = p_locale)
  group by referrer_domain
  order by 2 desc;
$$;

create or replace function concierge.pv_by_device(p_from date, p_to date, p_locale text default null)
returns table (device text, views bigint)
language sql stable
as $$
  select device, sum(views)::bigint
  from concierge.pageviews_daily
  where day between p_from and p_to and (p_locale is null or locale = p_locale)
  group by device
  order by 2 desc;
$$;

-- Only the server (service role) may call these.
revoke all on function concierge.pv_increment(date, text, text, text, text) from public, anon, authenticated;
revoke all on function concierge.pv_by_path(date, date, text) from public, anon, authenticated;
revoke all on function concierge.pv_by_day(date, date, text) from public, anon, authenticated;
revoke all on function concierge.pv_by_referrer(date, date, text) from public, anon, authenticated;
revoke all on function concierge.pv_by_device(date, date, text) from public, anon, authenticated;

-- Default privileges (0001) cover new tables; functions need explicit grants.
grant all on concierge.pageviews_daily, concierge.site_changes to service_role;
grant usage, select on all sequences in schema concierge to service_role;
grant execute on function concierge.pv_increment(date, text, text, text, text) to service_role;
grant execute on function concierge.pv_by_path(date, date, text) to service_role;
grant execute on function concierge.pv_by_day(date, date, text) to service_role;
grant execute on function concierge.pv_by_referrer(date, date, text) to service_role;
grant execute on function concierge.pv_by_device(date, date, text) to service_role;
