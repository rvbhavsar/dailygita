-- Create verse_feedback table for tracking user likes/dislikes
CREATE TABLE public.verse_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  verse_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  feedback TEXT NOT NULL CHECK (feedback IN ('like', 'dislike')),
  challenge_context TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, verse_id)
);

-- Create daily_verse_history table for tracking shown verses
CREATE TABLE public.daily_verse_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  verse_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  shown_date DATE NOT NULL DEFAULT CURRENT_DATE,
  was_liked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, shown_date)
);

-- Enable RLS on both tables
ALTER TABLE public.verse_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_verse_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for verse_feedback
CREATE POLICY "Users can view their own feedback"
  ON public.verse_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON public.verse_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.verse_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.verse_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for daily_verse_history
CREATE POLICY "Users can view their own history"
  ON public.daily_verse_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON public.daily_verse_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
  ON public.daily_verse_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_verse_feedback_user_id ON public.verse_feedback(user_id);
CREATE INDEX idx_verse_feedback_verse_id ON public.verse_feedback(verse_id);
CREATE INDEX idx_daily_verse_history_user_id ON public.daily_verse_history(user_id);
CREATE INDEX idx_daily_verse_history_shown_date ON public.daily_verse_history(shown_date);