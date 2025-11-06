-- Agregar campo code a la tabla passengers para docentes
-- Este campo será opcional y solo se usará para docentes

ALTER TABLE public.passengers
ADD COLUMN IF NOT EXISTS code text;

-- Crear índice único para el código (solo para docentes)
CREATE UNIQUE INDEX IF NOT EXISTS passengers_code_unique_idx 
ON public.passengers(code) 
WHERE code IS NOT NULL;

-- Comentario sobre el campo
COMMENT ON COLUMN public.passengers.code IS 'Código único para docentes (formato DOC-XXXXX). Solo se usa para tipo docente.';

