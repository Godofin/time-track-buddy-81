-- Criar políticas RLS para a tabela timesheets
-- Permitir que usuários anônimos insiram seus próprios dados
CREATE POLICY "Permitir inserção de dados próprios" 
ON public.timesheets 
FOR INSERT 
WITH CHECK (true);

-- Permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados" 
ON public.timesheets 
FOR SELECT 
USING (true);

-- Permitir que usuários atualizem seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados" 
ON public.timesheets 
FOR UPDATE 
USING (true);

-- Permitir que usuários deletem seus próprios dados
CREATE POLICY "Usuários podem deletar seus próprios dados" 
ON public.timesheets 
FOR DELETE 
USING (true);