# Migration 0011 — measurement (walkthrough)

**Who applies it:** Islam, manually, via Supabase Dashboard → SQL Editor
(paste `0011_measurement.sql`, Run). **Apply 0010 first.** Safe to re-run.

**When:** right after the measurement PR deploys (everything is fail-soft
until then: leads are stored without the new columns, page counts are
dropped and logged, /admin/report says which table is missing).

| Change | Notes |
|---|---|
| `leads.form_location`, `interest`, `landing_page`, `referrer_domain` | filled for new leads only; old rows stay NULL |
| `leads.utm_source` … `utm_content` | generated from the existing `utm` field, so old rows that had UTM tags show them too |
| `pageviews_daily` | aggregate counts per day × path × locale × referrer domain × device. No IP, user agent, cookie or visitor ID |
| `pv_increment(...)` | atomic +1, called by `/api/pv` |
| `site_changes` | change-date markers, editable in /admin/report; pre-filled with the 61 PRs merged 1–10 Nov 2026 (add #212 once merged) |
| `pv_by_path / pv_by_day / pv_by_referrer / pv_by_device` | report queries; service role only |

Check after running:

```sql
select count(*) from concierge.site_changes;             -- 61
select concierge.pv_increment(current_date, '/__check', 'en', '', 'desktop');
select * from concierge.pageviews_daily where path = '/__check';  -- views = 1
delete from concierge.pageviews_daily where path = '/__check';
```
