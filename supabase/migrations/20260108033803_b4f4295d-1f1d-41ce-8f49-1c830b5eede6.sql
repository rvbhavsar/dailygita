-- Add is_onboarded column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_onboarded boolean NOT NULL DEFAULT false;

-- Update the handle_new_user trigger to include is_onboarded
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, age, profession, marital_status, is_onboarded)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'display_name',
    (new.raw_user_meta_data ->> 'age')::integer,
    new.raw_user_meta_data ->> 'profession',
    new.raw_user_meta_data ->> 'marital_status',
    COALESCE((new.raw_user_meta_data ->> 'is_onboarded')::boolean, false)
  );
  RETURN new;
END;
$$;