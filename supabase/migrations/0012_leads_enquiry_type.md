# 0012 — leads.enquiry_type

**What:** one nullable text column on `concierge.leads`, `enquiry_type`
(`'small_group'` for leads from the small-group hub; NULL otherwise), plus a
partial index.

**Why:** the owner spec "small-group page consistency pass" (2026-11-10, §5)
asks for the enquiry type to be stored in the leads table. No existing column
fitted: `kind` is `trip | day_tour` (the form shape), and `source` /
`form_location` say where the form sat, not what was asked.

**Apply:** Supabase Dashboard → SQL Editor → paste `0012_leads_enquiry_type.sql`
→ Run. Apply after 0011. Safe to re-run.

**Before it is applied:** nothing breaks. `/api/lead` tries the 0012 row
first; on a missing-column error it retries without `enquiry_type` (logged as
"insert failed at 0012 (newer migration not applied; retrying)").

**Check after applying:**

```sql
select reference, created_at, enquiry_type, form_location, tour_slug
from concierge.leads
where enquiry_type is not null
order by created_at desc
limit 20;
```
