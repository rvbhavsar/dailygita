-- Create table for saved AI insights
CREATE TABLE public.saved_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  verse_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved insights" 
ON public.saved_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save their own insights" 
ON public.saved_insights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved insights" 
ON public.saved_insights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_insights_user_id ON public.saved_insights(user_id);
CREATE INDEX idx_saved_insights_verse_id ON public.saved_insights(verse_id);