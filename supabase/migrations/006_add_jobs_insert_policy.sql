-- Add INSERT policy for jobs table
-- Users can create jobs for videos in their own projects
CREATE POLICY "Users can create jobs for own videos" ON public.jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.videos
      JOIN public.projects ON projects.id = videos.project_id
      WHERE videos.id = jobs.video_id
      AND projects.user_id = auth.uid()
    )
  );

