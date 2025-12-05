-- Add INSERT policy for users table
-- This allows users to create their own record if the trigger fails
CREATE POLICY "Users can create own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);



