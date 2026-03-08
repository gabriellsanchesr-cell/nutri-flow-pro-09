
# Plan: Módulos de Alta Prioridade (Agenda, Configurações e Banco TACO)

Temos três módulos cruciais para implementar. Minha abordagem para cada um será a seguinte, visando estabilidade, boa experiência do usuário e banco de dados consistente.

## 1. Banco de Alimentos TACO (Seed e Integração)
O banco `alimentos_taco` já existe no Supabase, mas está vazio. Precisamos preenchê-lo e conectá-lo ao editor de planos.
- **Database Seed**: Criarei uma migration SQL contendo as instruções `INSERT INTO alimentos_taco` com os alimentos essenciais da tabela TACO (cerca de 500-600 registros com nome, grupo, energia_kcal, proteina_g, lipidio_g, carboidrato_g e fibra_g).
- **Editor de Planos (`PlanoAlimentarEditor.tsx`)**:
  - Implementar o componente `AlimentoSearch` com **autocomplete e debounce**. Ao digitar, ele consultará a tabela `alimentos_taco` via Supabase.
  - Ao selecionar um alimento, seus macros base (por 100g) serão guardados no estado.
  - Implementar o **recálculo automático** no editor: se o nutricionista alterar a quantidade (ex: de 100g para 150g), o sistema recalcula automaticamente as calorias e macronutrientes daquele item na refeição.

## 2. Configurações do Sistema
Atualmente temos `configuracoes_pdf` e `configuracoes_usuarios`, mas precisamos de um local central para a clínica.
- **Nova Tabela `configuracoes_clinica`** (ou expandir a tabela PDF atual para um conceito mais amplo):
  - Campos: `user_id`, `nome_clinica`, `endereco`, `telefone`, `crn`, `logo_url`, `mensagem_boas_vindas_portal`, dados de SMTP (opcionais, caso o cliente queira usar e-mail próprio).
- **Nova UI de Configurações**:
  - Criar a página `/configuracoes/geral` (ou adicionar abas na área de Gestão).
  - Incluir formulários para: **Dados do Consultório**, **Identidade Visual/Portal** (logo, cores, mensagem) e **Notificações** (setup SMTP básico).
- **Atualização do Portal**: Fazer o `PortalPaciente` puxar a mensagem de boas-vindas e a cor primária configuradas no sistema.

## 3. Agenda e Consultas
A `Agenda.tsx` atual possui apenas uma visão mensal básica.
- **Visões Avançadas**: Adicionar controle para alternar entre **Mensal**, **Semanal** e **Diária**. A visão diária funcionará como uma lista de compromissos estilo "agenda médica".
- **Bloqueio de Horários**: Incluir a opção "Adicionar Bloqueio/Folga" ao lado de "Nova Consulta". Isso registrará um item na tabela `consultas` com o status de bloqueio, impedindo sobreposições visuais.
- **Alertas de Retorno**: 
  - Adicionar um painel lateral na Agenda chamado "Retornos Pendentes".
  - O sistema buscará consultas cujo tipo foi "Primeira Consulta" ou "Retorno", realizadas há mais de X dias, onde o paciente ainda não tem nova consulta futura agendada.
- **Status e Confirmação**: Atualizar o modal de agendamento para permitir definir se é "Online" ou "Presencial" com um link da reunião.

## Ordem de Implementação
1. **Migration SQL** populando o `alimentos_taco` para que a busca comece a funcionar imediatamente.
2. **Integração no Editor de Planos** (UI de busca TACO e matemática de porções).
3. **Migration SQL** para as configurações gerais da clínica + tela de Configurações.
4. **Refatoração da Agenda** introduzindo os bloqueios e os alertas de retorno.

Dessa forma, entregamos o valor funcional mais alto (fazer dietas com a tabela oficial) seguido da personalização e organização da clínica.
