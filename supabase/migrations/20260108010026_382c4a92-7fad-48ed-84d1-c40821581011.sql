-- Update the handle_new_user function to include new profile fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, age, profession, marital_status)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'display_name',
    (new.raw_user_meta_data ->> 'age')::integer,
    new.raw_user_meta_data ->> 'profession',
    new.raw_user_meta_data ->> 'marital_status'
  );
  RETURN new;
END;
$$;