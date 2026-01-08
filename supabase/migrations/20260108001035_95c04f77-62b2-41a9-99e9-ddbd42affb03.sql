-- Create chapters table
CREATE TABLE public.chapters (
  id SERIAL PRIMARY KEY,
  chapter_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_transliterated TEXT,
  name_translated TEXT,
  verses_count INTEGER NOT NULL DEFAULT 0,
  chapter_summary TEXT,
  chapter_summary_hindi TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verses table
CREATE TABLE public.verses (
  id SERIAL PRIMARY KEY,
  verse_id INTEGER NOT NULL UNIQUE,
  chapter_number INTEGER NOT NULL REFERENCES public.chapters(chapter_number) ON DELETE CASCADE,
  verse_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  transliteration TEXT,
  word_meanings TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chapter_number, verse_number)
);

-- Create translations table
CREATE TABLE public.translations (
  id SERIAL PRIMARY KEY,
  verse_id INTEGER NOT NULL REFERENCES public.verses(verse_id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'english',
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Public read access policies (Gita data is public)
CREATE POLICY "Anyone can read chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Anyone can read verses" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Anyone can read translations" ON public.translations FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_verses_chapter ON public.verses(chapter_number);
CREATE INDEX idx_verses_verse_id ON public.verses(verse_id);
CREATE INDEX idx_translations_verse_id ON public.translations(verse_id);