-- Remove the language column from translations table since all translations are English
ALTER TABLE public.translations DROP COLUMN IF EXISTS language;