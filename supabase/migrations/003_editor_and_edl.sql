CREATE TABLE IF NOT EXISTS public.edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  edl JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own edits" ON public.edits FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = edits.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own edits" ON public.edits FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = edits.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own edits" ON public.edits FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = edits.project_id
    AND projects.user_id = auth.uid()
  )
);



