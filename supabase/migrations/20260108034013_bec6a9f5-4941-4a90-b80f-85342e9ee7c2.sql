-- Add selected_challenges column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN selected_challenges text[] NOT NULL DEFAULT '{}'::text[];