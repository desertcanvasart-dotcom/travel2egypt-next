# Migration 0009 — website leads (walkthrough)

**Who applies it:** Islam, manually, via Supabase Dashboard → SQL Editor
(paste `0009_leads.sql`, Run). Safe to re-run (`if not exists`).

**When:** any time. `/api/lead` emails every request to `TEAM_INBOX_EMAIL`
first; the database insert is best-effort and only logs an error while this
table is missing. Once applied, every request is also stored.

## What it adds

`concierge.leads` — one row per form submission from the new homepage
(itinerary form, header/mobile "Get a free itinerary", "Customise" on a tour
card, "Check this date" on a day-tour card).

| Column | Notes |
|---|---|
| `reference` | `T2E-XXXXXX`, shown to the traveller and in the email subject |
| `kind` | `trip` or `day_tour` |
| `source` | which button/form it came from |
| `email`, `whatsapp` | contact (WhatsApp optional) |
| `travel_month` / `start_date` / `end_date` | month, or exact dates (day tour: the tour date) |
| `days_band`, `adults`, `children`, `child_ages`, `budget_band`, `notes` | the form answers |
| `tour_slug`, `tour_title` | set when the form was opened from a tour card |
| `page_path`, `utm` | where the visitor was, and campaign tags (incl. `gclid`) |
| `ip_hash` | keyed one-way hash (abuse control) — never the raw IP |
| `emailed` | whether the team email went out |
| `status` | free text for the team: `new` → `contacted` → `quoted` → `booked` / `lost` |

RLS is enabled with no policies: only the server's service-role key can
read or write, like every other concierge table.

## Reading leads

Supabase Dashboard → Table editor → schema `concierge` → `leads`, newest first.
