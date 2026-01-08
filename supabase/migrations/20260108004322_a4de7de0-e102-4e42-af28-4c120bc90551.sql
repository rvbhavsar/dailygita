-- Remove the transliteration column from verses table since it's no longer used in the UI
ALTER TABLE public.verses DROP COLUMN IF EXISTS transliteration;