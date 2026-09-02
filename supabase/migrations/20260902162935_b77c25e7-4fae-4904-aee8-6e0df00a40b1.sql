ALTER TABLE public.depoimentos ADD COLUMN IF NOT EXISTS aprovado boolean NOT NULL DEFAULT false;
UPDATE public.depoimentos SET aprovado = true;