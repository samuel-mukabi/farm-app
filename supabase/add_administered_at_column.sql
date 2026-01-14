ALTER TABLE public.vaccinations 
ADD COLUMN IF NOT EXISTS administered_at timestamptz;
