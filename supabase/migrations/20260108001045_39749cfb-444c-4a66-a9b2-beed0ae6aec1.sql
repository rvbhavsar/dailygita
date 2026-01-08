-- Fix: Add RLS policy for verses table
CREATE POLICY "Anyone can read verses" ON public.verses FOR SELECT USING (true);