-- Adicionar coluna id como primary key na tabela timesheets
ALTER TABLE public.timesheets 
ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;