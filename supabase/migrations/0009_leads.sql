-- 0009_leads.sql — website itinerary / day-tour date requests (homepage
-- rebuild, 2026-11-08).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database.
--
-- TIMING: /api/lead is fail-soft on this table. If 0009 is not applied yet,
-- the lead is still emailed to the team (the email is the primary channel)
-- and the insert error is logged — so deploy order does not matter. Apply it
-- before or after the deploy; leads are stored from then on.

create table if not exists concierge.leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_at timestamptz not null default now(),
  -- 'trip' (plan-a-trip form) | 'day_tour' (check a date for one tour)
  kind text not null default 'trip',
  -- home_hero | home_footer | header | mobile_bar | tour_card | day_tour_card | quick_finder
  source text not null,
  locale text not null default 'en',
  email text not null,
  whatsapp text,
  travel_month text,
  start_date date,
  end_date date,
  -- '3-5' | '6-9' | '10-14' | '15+'
  days_band text,
  adults int not null default 2,
  children int not null default 0,
  child_ages text,
  -- 'lt1500' | '1500-2500' | '2500-4000' | '4000+'
  budget_band text,
  notes text,
  tour_slug text,
  tour_title text,
  page_path text,
  utm jsonb not null default '{}'::jsonb,
  ip_hash text,
  emailed boolean not null default false,
  -- free-text status for the team: new | contacted | quoted | booked | lost
  status text not null default 'new'
);

create index if not exists leads_created_at_idx on concierge.leads (created_at desc);
create index if not exists leads_email_idx on concierge.leads (email);

-- RLS defense-in-depth, same as every concierge table: enabled, no permissive
-- policies — only the service role (server) can read or write.
alter table concierge.leads enable row level security;
