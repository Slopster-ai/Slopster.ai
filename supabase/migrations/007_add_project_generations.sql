create table if not exists project_generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists project_generations_project_id_idx on project_generations(project_id);

-- Ensure the updated_at trigger function exists (create if missing)
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'update_updated_at_column' and n.nspname = 'public'
  ) then
    create function public.update_updated_at_column()
    returns trigger
    language plpgsql
    as $func$
    begin
      new.updated_at = now();
      return new;
    end;
    $func$;
  end if;
end $$;

create trigger project_generations_updated_at
before update on project_generations
for each row execute procedure update_updated_at_column();

