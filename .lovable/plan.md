

# Reconstrução Completa do Perfil do Paciente

## Avaliação do Escopo

Este pedido envolve 13 seções completas, várias tabelas novas no banco, upload de arquivos, gráficos, exportação PDF e muito mais. Para garantir qualidade e estabilidade, vou dividir a implementação em **3 fases**. Esta primeira entrega cobrirá a estrutura completa + as seções que já possuem dados no banco.

## Fase 1 (esta entrega) -- Estrutura + Seções com dados existentes

### 1. Layout do Perfil do Paciente
Reescrever `PacienteDetalhe.tsx` com:
- **Cabeçalho fixo**: avatar com iniciais, nome, idade calculada, badges (fase R.E.A.L., status ativo/inativo, acesso com/sem conta), botões de ação rápida
- **Sidebar interna** (esquerda, fundo branco, borda direita): lista de 13 seções clicáveis, item ativo com borda esquerda azul
- **Breadcrumb**: Pacientes > Nome > Seção Atual
- **Responsivo**: em tela pequena, sidebar vira dropdown no topo
- Usar estado local para seção ativa (sem sub-rotas, para manter dentro do AppLayout)

### 2. Seções implementadas com dados reais

**Visão Geral** -- Cards resumo: último peso + variação, última consulta, próxima consulta, plano ativo (sim/não), aderência média 4 semanas, fase R.E.A.L., alerta check-in. Botões de ação rápida.

**Dados do Paciente** -- 2 colunas: Informações Pessoais + Antropometria Inicial. Card de Saúde e Histórico. Botão Editar em cada bloco (abre modal de edição).

**Acompanhamento** -- Gráfico de linha (peso, abdominal, quadril) com filtros de período. Tabela de registros. Modal "Registrar semana" com todos os campos. Usa tabela `acompanhamentos` existente.

**Plano Alimentar** -- Lista de planos do paciente da tabela `planos_alimentares` com refeições e alimentos. Status ativo/inativo. Ações: editar, duplicar, definir como ativo. Botão "Novo Plano" inline.

**Consultas** -- Lista cronológica da tabela `consultas`. Modal de registro com campos: data/hora, tipo, status, anotações, próximos passos.

**Cálculo Energético** -- Calculadora TMB (Harris-Benedict + Mifflin-St Jeor), GET, meta calórica, distribuição de macros. Campos pré-preenchidos do perfil do paciente.

**Acesso do Paciente** -- Painel com status, email, data criação, último acesso. Botões criar/desativar/reativar/redefinir senha. Reutiliza `PacienteAccessModal` e edge function existentes.

### 3. Seções placeholder (Fase 2 e 3)
As seguintes seções terão UI estruturada mas com conteúdo "Em breve":
- Anamnese (precisa de tabela nova)
- Evolução Fotográfica (precisa de storage)
- Questionários (precisa de tabelas novas)
- Exames Laboratoriais (precisa de storage + tabela)
- Orientações e Materiais (precisa de tabela)
- Prontuário/Linha do tempo (agrega dados)

### 4. Identidade Visual
Ajustar cores específicas nos componentes do perfil:
- Cards: `bg-white` com `border border-[#E2E5F0]` e `rounded-xl`
- Sidebar interna: item ativo com `border-l-3 border-[#2B3990] bg-[#F4F5FA]`
- Badges coloridos por tipo
- Gráficos com `#2B3990` como cor principal

### 5. Componentes a criar
- `src/pages/PacienteDetalhe.tsx` -- reescrita completa como shell com sidebar + content area
- `src/components/paciente/PacienteHeader.tsx` -- cabeçalho fixo
- `src/components/paciente/PacienteSidebar.tsx` -- navegação interna
- `src/components/paciente/VisaoGeral.tsx`
- `src/components/paciente/DadosPaciente.tsx`
- `src/components/paciente/AcompanhamentoSection.tsx`
- `src/components/paciente/PlanoAlimentarSection.tsx`
- `src/components/paciente/ConsultasSection.tsx`
- `src/components/paciente/CalculoEnergetico.tsx`
- `src/components/paciente/AcessoPaciente.tsx`
- `src/components/paciente/PlaceholderSection.tsx` -- para seções futuras

### 6. Sem mudanças no banco de dados nesta fase
Todas as tabelas necessárias já existem (`pacientes`, `acompanhamentos`, `planos_alimentares`, `refeicoes`, `alimentos_plano`, `consultas`, `checklist_respostas`). Nenhuma migration necessária.

```text
┌──────────────────────────────────────────────────────┐
│  Breadcrumb: Pacientes > João Silva > Visão Geral    │
├──────────────────────────────────────────────────────┤
│ [Avatar] João Silva  24 anos                         │
│ [Rotina] [Ativo] [Com Conta]    [Editar] [Desativar] │
├────────────┬─────────────────────────────────────────┤
│ Sidebar    │  Área de Conteúdo                       │
│            │                                         │
│ ▸ Visão    │  ┌─────┐ ┌─────┐ ┌─────┐               │
│   Geral    │  │Peso │ │Cons.│ │Plano│               │
│   Dados    │  └─────┘ └─────┘ └─────┘               │
│   Anamnese │                                         │
│   Acomp.   │  ┌─────┐ ┌─────┐ ┌─────┐               │
│   Fotos    │  │Ader.│ │Fase │ │Check│               │
│   Plano    │  └─────┘ └─────┘ └─────┘               │
│   Cálculo  │                                         │
│   Consult. │  [Registrar Consulta] [Enviar Plano]    │
│   Quest.   │                                         │
│   Exames   │                                         │
│   Orient.  │                                         │
│   Prontuár.│                                         │
│   Acesso   │                                         │
├────────────┴─────────────────────────────────────────┤
```

## Estimativa
~11 arquivos novos/modificados. Foco em funcionalidade real com dados existentes, visual profissional, e placeholders claros para fases futuras.

