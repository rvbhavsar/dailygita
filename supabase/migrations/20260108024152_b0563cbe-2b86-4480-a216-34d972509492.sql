-- Create table to store AI-analyzed verse challenge tags
CREATE TABLE public.verse_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  challenges TEXT[] NOT NULL DEFAULT '{}',
  ai_summary TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chapter_number, verse_number)
);

-- Enable RLS
ALTER TABLE public.verse_challenges ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read verse challenges"
ON public.verse_challenges FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_verse_challenges_chapter_verse ON public.verse_challenges(chapter_number, verse_number);