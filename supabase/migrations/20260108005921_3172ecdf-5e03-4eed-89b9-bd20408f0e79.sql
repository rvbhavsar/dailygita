-- Add new profile attributes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS profession text,
ADD COLUMN IF NOT EXISTS marital_status text;

-- Add check constraint for valid marital status values
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_marital_status CHECK (marital_status IS NULL OR marital_status IN ('single', 'married', 'divorced', 'widowed'));