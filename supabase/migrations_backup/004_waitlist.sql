-- Waitlist table and beta access flag
-- Create table
create table if not exists public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text,
  use_case text,
  source_url text,
  utm jsonb default '{}'::jsonb,
  user_agent text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.waitlist enable row level security;

-- Allow anyone (anon) to insert into waitlist
create policy "Allow insert for anon to waitlist"
on public.waitlist
for insert
to anon
with check (true);

-- Block selects/updates/deletes for anon & authenticated by not creating policies.
-- Allow service_role to select for admin usage
create policy "Allow select for service_role on waitlist"
on public.waitlist
for select
using (auth.role() = 'service_role');

-- Add beta_access flag to users for invite-only gating
alter table public.users
add column if not exists beta_access boolean not null default false;


