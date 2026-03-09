-- Expandir configurações para dados gerais da clínica
ALTER TABLE public.configuracoes_pdf RENAME TO configuracoes_clinica;

-- Adicionar novos campos para configurações gerais
ALTER TABLE public.configuracoes_clinica 
ADD COLUMN nome_clinica text DEFAULT 'Gabriel Sanches Nutrição',
ADD COLUMN endereco text,
ADD COLUMN mensagem_boas_vindas text DEFAULT 'Bem-vindo ao seu portal nutricional! Aqui você acompanha sua evolução e acessa seu plano personalizado.',
ADD COLUMN cor_secundaria text DEFAULT '#10B981',
ADD COLUMN instagram text,
ADD COLUMN facebook text,
ADD COLUMN whatsapp text,
ADD COLUMN smtp_host text,
ADD COLUMN smtp_port integer DEFAULT 587,
ADD COLUMN smtp_user text,
ADD COLUMN smtp_password text,
ADD COLUMN smtp_ativo boolean DEFAULT false;

-- Criar configuração padrão para usuários existentes se não existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.configuracoes_clinica WHERE user_id IN (SELECT id FROM auth.users LIMIT 1)) THEN
        INSERT INTO public.configuracoes_clinica (user_id, nome_clinica, mensagem_boas_vindas)
        SELECT 
            id as user_id,
            'Gabriel Sanches Nutrição' as nome_clinica,
            'Bem-vindo ao seu portal nutricional! Aqui você acompanha sua evolução e acessa seu plano personalizado.' as mensagem_boas_vindas
        FROM auth.users 
        WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'nutri');
    END IF;
END
$$;