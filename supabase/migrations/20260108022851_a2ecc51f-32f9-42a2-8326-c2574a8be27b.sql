-- Create storage bucket for verse audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verse-audio', 'verse-audio', true, 5242880, ARRAY['audio/mpeg']);

-- Create policy to allow public read access
CREATE POLICY "Public can read verse audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'verse-audio');

-- Create policy to allow service role to upload
CREATE POLICY "Service role can upload verse audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'verse-audio');

-- Create table to track generated audio files
CREATE TABLE public.verse_audio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  duration_seconds NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chapter_number, verse_number)
);

-- Enable RLS
ALTER TABLE public.verse_audio ENABLE ROW LEVEL SECURITY;

-- Allow public read access to verse_audio table
CREATE POLICY "Public can read verse audio metadata"
ON public.verse_audio FOR SELECT
USING (true);