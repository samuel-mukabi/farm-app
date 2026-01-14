ALTER TABLE public.vaccinations 
ADD COLUMN IF NOT EXISTS notes text;
