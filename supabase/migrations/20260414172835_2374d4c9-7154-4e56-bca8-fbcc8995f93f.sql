
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  origem TEXT NOT NULL DEFAULT 'indicacao',
  status TEXT NOT NULL DEFAULT 'novo',
  valor_estimado NUMERIC,
  anotacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create financeiro_receitas table
CREATE TABLE public.financeiro_receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT NOT NULL DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'pago',
  categoria TEXT NOT NULL DEFAULT 'consulta',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financeiro_receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutri can view own receitas" ON public.financeiro_receitas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutri can insert own receitas" ON public.financeiro_receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutri can update own receitas" ON public.financeiro_receitas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutri can delete own receitas" ON public.financeiro_receitas FOR DELETE USING (auth.uid() = user_id);
