# Measurement — owner steps (2026-11-10)

In order. Nothing here needs DNS.

## 1. Supabase (SQL editor)
1. Run `supabase/migrations/0010_leads_journey.sql` (from PR #212), then
2. `supabase/migrations/0011_measurement.sql`. Checks are in `0011_measurement.md`.

Until both run: test leads can't be excluded, the new lead fields aren't stored,
and page views aren't counted (the site works normally either way).

## 2. Railway (environment variables), then redeploy
| Variable | Value | Why |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | the GA4 web stream ID, `G-…` (GA4 → Admin → Data streams → travel2egypt.org) | **GA4 is currently OFF in production**: the variable isn't set, so no GA tag loads. The data GA4 showed came from the Cloudflare-injected tag disabled on 8 Nov. |
| `T2E_TEST_SECRET` | any long random string | optional: lets a QA tool mark a lead as a test with the `X-T2E-Test` header. `@test.travel2egypt.org` addresses are test leads without it. |

After the deploy, visitors see the cookie choice once ("Accept analytics" / "Essential only").

## 3. GA4 admin (analytics.google.com, property "Travel2Egypt")
1. **Key event:** Admin → Events → mark `generate_lead` as a key event. (`test_lead` must NOT be one.)
2. **Custom dimensions** (Admin → Custom definitions → Create, event-scoped), so the parameters show in reports:
   `form_location`, `location`, `journey`, `menu`, `item`, `item_list_name`, `method`, `tour`.
3. **Data retention:** Admin → Data retention → 14 months.
4. **Consent mode check:** Admin → Data streams → web → Consent settings should show "Consent mode active" a day after the deploy.

## 4. Search Console ↔ GA4
GA4 → Admin → Product links → Search Console links → Link → pick the `travel2egypt.org` property → web stream. (Needs owner on both.)

## 5. Afterwards
- In /admin/report, add a change marker for PR #212 (and later PRs) on its merge date.
- Use the Search Console link on /admin/report: compare the same 28-day windows before and after each change date.
