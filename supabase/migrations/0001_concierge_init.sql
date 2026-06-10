-- 0001_concierge_init.sql — concierge schema, tables, indexes, RLS, grants.
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database. Walkthrough (incl.
-- the required Dashboard "Exposed schemas" step) in 0001_concierge_init.md.

create schema if not exists concierge;

create table concierge.sessions (
  id uuid primary key default gen_random_uuid(),
  cookie_id text unique not null,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  ip_hash text,            -- keyed HMAC-SHA256 (IP_HASH_SECRET), never raw. Populated from Session 7.
  user_agent_hash text,    -- keyed HMAC-SHA256. Populated from Session 7.
  locale text not null default 'en',
  email text,
  email_verified boolean default false
);
create index sessions_cookie_id_idx on concierge.sessions(cookie_id);

create table concierge.conversations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references concierge.sessions(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  prompt_version text not null default 'v4.1',
  brief_completed boolean default false,
  brief_completed_at timestamptz,
  brief_payload jsonb,
  reviewed boolean default false,
  reviewer_rating int check (reviewer_rating between 1 and 5),
  reviewer_notes text,
  archived boolean default false,
  flagged boolean default false,
  flag_reason text   -- controlled vocab: 'escape_hatch_used' | 'prompt_injection_attempt'
                     -- | 'hostile_language' | 'off_topic_persistent' | 'repeated_identical'
  -- escape-hatch columns added in 0002; brief_revision support relates to concierge.briefs
);
create index conversations_session_id_idx on concierge.conversations(session_id);
create index conversations_brief_completed_idx on concierge.conversations(brief_completed);
create index conversations_flagged_idx on concierge.conversations(flagged) where flagged = true;

create table concierge.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references concierge.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now(),
  response_time_ms int,
  token_count_input int,
  token_count_output int,
  model_version text
);
create index messages_conversation_id_idx on concierge.messages(conversation_id);
create index messages_created_at_idx on concierge.messages(created_at);

create table concierge.briefs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references concierge.conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  payload jsonb not null,
  autoura_webhook_status text default 'pending'
    check (autoura_webhook_status in ('pending','sent','failed','retried')),
  autoura_webhook_response jsonb,
  autoura_attempts int default 0,
  email_fallback_sent boolean default false
  -- brief_revision int added in 0003
);
create index briefs_conversation_id_idx on concierge.briefs(conversation_id);
create index briefs_webhook_status_idx on concierge.briefs(autoura_webhook_status);

create table concierge.rate_limits (
  id uuid primary key default gen_random_uuid(),
  cookie_id text not null,
  ip_hash text,
  window_start timestamptz not null default now(),
  message_count int default 0,
  blocked_until timestamptz
);
create index rate_limits_cookie_id_idx on concierge.rate_limits(cookie_id);
create index rate_limits_blocked_idx on concierge.rate_limits(blocked_until) where blocked_until is not null;

-- RLS defense-in-depth: enable, no permissive policies (service-role access only).
alter table concierge.sessions      enable row level security;
alter table concierge.conversations enable row level security;
alter table concierge.messages      enable row level security;
alter table concierge.briefs        enable row level security;
alter table concierge.rate_limits   enable row level security;

-- Grants — service_role ONLY. PostgREST serves a non-public schema only if it
-- is (a) listed in the Dashboard's "Exposed schemas" AND (b) the requesting
-- role has USAGE + table privileges. anon/authenticated deliberately get
-- NOTHING here (not even USAGE), so even though exposing the schema makes it
-- addressable via the REST API, those roles fail at the permission layer —
-- before RLS is ever consulted. RLS deny-all above remains as the second wall.
grant usage on schema concierge to service_role;
grant all on all tables in schema concierge to service_role;
grant all on all sequences in schema concierge to service_role;
alter default privileges for role postgres in schema concierge
  grant all on tables to service_role;
alter default privileges for role postgres in schema concierge
  grant all on sequences to service_role;
