

# NutriGabriel — Sistema de Gestão para Nutricionista Clínico

## Identidade Visual
- Cores: Azul royal (#5B6ABF conforme a logo), branco e cinza escuro
- Logo do Gabriel Sanches incorporada no topo da sidebar
- Design limpo, profissional e moderno com tipografia clara
- Idioma: Português brasileiro

## Estrutura e Navegação
- **Sidebar** fixa com navegação entre: Dashboard, Pacientes, Planos Alimentares, Acompanhamento, Agenda, Biblioteca e Templates
- Tela de login para o nutricionista (autenticação via Supabase)
- Layout responsivo

## 1. Autenticação
- Login/cadastro do nutricionista com email e senha
- Tela de recuperação de senha
- Rotas protegidas para todas as seções

## 2. Dashboard
- Cards com: total de pacientes ativos, retornos pendentes (>30 dias), pacientes sem peso na semana, próximas consultas
- Lista dos últimos acompanhamentos registrados
- Ícones simples e visual limpo com cards informativos

## 3. Pacientes
- **Listagem** com busca e filtros (nome, objetivo, fase do Método R.E.A.L.)
- **Formulário de cadastro** com todos os campos solicitados: dados pessoais, antropometria, objetivo, restrições, alergias, patologias, medicamentos, atividade física, sono, observações comportamentais
- **Campo de fase do Método R.E.A.L.**: Rotina, Estratégia, Autonomia ou Liberdade
- **Perfil individual** com abas: Dados Pessoais, Plano Alimentar, Acompanhamento, Consultas

## 4. Planos Alimentares
- Montagem de plano com refeições configuráveis: café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia (opcional)
- Cada refeição: adicionar alimentos com quantidade, medida caseira, macronutrientes calculados automaticamente
- **Banco de alimentos da Tabela TACO** (597 alimentos com calorias, proteínas, carboidratos, gorduras, fibras) — dados extraídos do PDF e armazenados no banco
- Campos de observações por refeição e substituições sugeridas
- Exportação do plano em **PDF** com nome do paciente e data
- **Templates de plano**: salvar planos-base por objetivo e duplicar para novos pacientes

## 5. Biblioteca de Substituições
- Cadastro de trocas fixas por grupo alimentar (cereais, proteínas, frutas, etc.)
- Vincular substituições aos planos alimentares

## 6. Acompanhamento
- Registro semanal: peso, circunferência abdominal/quadril, foto de evolução (upload), energia (1-5), sono (1-5), aderência (%), observações do paciente e do nutricionista
- **Gráficos de linha** (Recharts) para evolução de peso e medidas ao longo do tempo
- Variação semanal em destaque
- **Checklist do paciente**: tela simples com link compartilhável onde o paciente responde o check semanal — dados vão direto para o painel do nutricionista

## 7. Agenda
- Calendário mensal e semanal
- Consultas com: paciente, data/hora, tipo (primeira consulta, retorno, online, presencial), anotações pós-consulta, status (agendado, realizado, cancelado)
- Alertas de retorno automáticos baseados na última consulta

## 8. Exportação de Relatório Mensal
- PDF com evolução completa do paciente (peso, medidas, gráficos, aderência, observações) para entregar na consulta

## Backend (Supabase via Lovable Cloud)
- Tabelas: profiles (nutricionista), pacientes, planos_alimentares, refeicoes, alimentos_plano, alimentos_taco, acompanhamentos, consultas, substituicoes, templates_plano, checklist_respostas, user_roles
- Storage para fotos de evolução
- RLS para segurança dos dados por nutricionista
- Edge functions para geração de PDFs

