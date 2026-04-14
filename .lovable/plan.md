

# Aprimorar Layout do Portal do Paciente

Melhorias visuais e de UX no portal mobile-first, mantendo toda a funcionalidade existente.

## Mudanças planejadas

### 1. Header premium
- Gradiente sutil no header (from-card via glassmorphism com backdrop-blur)
- Avatar com iniciais do paciente ao lado do logo
- Saudação temporal ("Bom dia", "Boa tarde", "Boa noite") no lugar do nome fixo "Gabriel Sanches"
- Botão de notificações/sino discreto

### 2. Tela Início redesenhada
- Banner de boas-vindas com gradiente e ícone decorativo
- Cards de métricas com ícones coloridos e layout mais expressivo (peso, kcal, fase)
- Card do plano ativo com visual mais rico: borda gradiente, indicador de progresso visual
- Quick actions: botões de atalho horizontais (Ver Plano, Registrar Diário, Mensagens) com ícones em círculos coloridos
- Próxima consulta (se disponível) em destaque

### 3. Bottom navigation refinada
- Ícones levemente maiores (h-5.5)
- Indicador ativo: ponto/dot abaixo do ícone ao invés de barra no topo
- Transição suave de cor
- Safe area padding melhorado para notch/home indicator

### 4. Menu "Mais" aprimorado
- Grid 2x3 com cards ao invés de ícones soltos
- Cada card com background sutil da cor do tema
- Descrição curta abaixo de cada item

### 5. Loading state com skeleton
- Substituir "Carregando..." por skeleton cards animados na tela inicial

### 6. Tela de Perfil melhorada
- Avatar grande com iniciais no topo
- Cards separados para dados pessoais vs configurações
- Botão de sair mais elegante no final

## Arquivo modificado
- `src/pages/PortalPaciente.tsx` — todas as melhorias de layout concentradas aqui

## Sem mudanças no backend
Nenhuma migration ou alteração de dados necessária.

