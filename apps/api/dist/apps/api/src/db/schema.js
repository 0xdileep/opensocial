export const schemaSql = `
create table if not exists brand_profiles (
  id text primary key,
  workspace_id text not null,
  name text not null,
  business_summary text not null,
  audience text not null,
  tone text not null,
  goals jsonb not null default '[]'::jsonb,
  banned_phrases jsonb not null default '[]'::jsonb,
  required_mentions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists posts (
  id text primary key,
  workspace_id text not null,
  brand_id text not null,
  source_type text not null,
  post_type text not null,
  text_master text not null,
  image_prompt text not null,
  image_url text,
  quality_score numeric not null,
  status text not null,
  scheduled_for timestamptz,
  platform_targets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists schedules (
  id text primary key,
  workspace_id text not null,
  brand_id text not null,
  enabled boolean not null default true,
  timezone text not null,
  days_of_week jsonb not null default '[]'::jsonb,
  local_time text not null,
  post_types jsonb not null default '[]'::jsonb,
  platforms jsonb not null default '[]'::jsonb,
  require_approval boolean not null default true,
  last_run_at timestamptz
);

create table if not exists platform_accounts (
  id text primary key,
  workspace_id text not null,
  platform text not null,
  account_label text not null,
  access_token text not null,
  refresh_token text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists publish_attempts (
  id text primary key,
  post_id text not null,
  platform text not null,
  status text not null,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists scheduler_runs (
  id text primary key,
  schedule_id text not null,
  run_key text not null unique,
  created_at timestamptz not null default now()
);
`;
