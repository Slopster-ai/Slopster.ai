-- user brand context (persisted across projects)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS brand_context jsonb DEFAULT '{}'::jsonb NOT NULL;

-- per-project strategy and flow stage
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS strategy_context jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS flow_stage smallint DEFAULT 1 NOT NULL;

-- optional helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_brand_context ON public.users USING GIN (brand_context);
CREATE INDEX IF NOT EXISTS idx_projects_strategy_context ON public.projects USING GIN (strategy_context);


