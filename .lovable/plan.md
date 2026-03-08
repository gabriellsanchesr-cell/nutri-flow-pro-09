

# Plan: Chat Interno + Sistema de Notificações

## Overview

This is a very large feature with 3 major parts: (1) real-time chat for nutritionist, (2) chat for patient portal, (3) notification system. Given the scope, I'll implement the core chat functionality first (database + real-time messaging + UI for both sides) and the notification system as a simpler in-app notification center. Push notifications and scheduled messages will be noted as future enhancements since they require external services (FCM/APNs).

## Scope for this implementation

**Included:**
- Database tables for messages, conversations, quick replies, notifications
- Real-time chat between nutri and patient (Supabase Realtime)
- Nutri chat page: 3-column layout (conversations list, messages, patient context)
- Quick replies management
- Patient portal chat tab
- In-app notification center (bell icon + panel) for nutritionist
- Archive/unread conversation features
- Bulk messaging
- Read receipts and typing indicators

**Deferred (requires external integrations):**
- Push notifications (requires FCM setup + service worker)
- Scheduled messages (requires cron job)
- WhatsApp/email integration
- Non-response timeout badges (requires background job)

## Database Migration

### Table: `mensagens`
- `id` uuid PK
- `conversa_id` uuid (references conversas)
- `remetente_id` uuid (auth user who sent)
- `conteudo` text
- `tipo` text default 'texto' (texto, imagem, arquivo, plano, receita, material)
- `arquivo_url` text nullable
- `referencia_id` uuid nullable (ID of plano/receita/material sent)
- `lida` boolean default false
- `lida_em` timestamptz nullable
- `created_at` timestamptz default now()

### Table: `conversas`
- `id` uuid PK
- `nutri_id` uuid (nutritionist user)
- `paciente_id` uuid (references pacientes)
- `arquivada` boolean default false
- `ultima_mensagem_texto` text nullable
- `ultima_mensagem_em` timestamptz nullable
- `nao_lidas_nutri` int default 0
- `nao_lidas_paciente` int default 0
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()
- UNIQUE(nutri_id, paciente_id)

### Table: `respostas_rapidas`
- `id` uuid PK
- `user_id` uuid
- `titulo` text
- `categoria` text
- `texto` text
- `ativo` boolean default true
- `created_at` timestamptz default now()

### Table: `notificacoes`
- `id` uuid PK
- `user_id` uuid (recipient)
- `tipo` text (check_in, evolucao, sem_checkin, retorno_pendente, mensagem, questionario, plano_visualizado, consulta_hoje)
- `titulo` text
- `descricao` text
- `cor` text (azul, verde, vermelho, amarelo)
- `lida` boolean default false
- `link` text nullable (route to navigate)
- `referencia_id` uuid nullable
- `created_at` timestamptz default now()

### RLS Policies
- `mensagens`: nutri can CRUD on conversations they own; paciente can read/insert on their own conversation
- `conversas`: nutri sees own; paciente sees own
- `respostas_rapidas`: nutri CRUD own
- `notificacoes`: user sees own, can update own (mark read)

### Realtime
- Enable realtime on `mensagens` and `notificacoes`

### Seed quick replies
- Pre-insert the 6 example quick replies from the spec

## Files to Create/Modify

### New Files:
1. **`src/pages/Chat.tsx`** — Full 3-column chat page for nutritionist
   - Left: conversation list with search, filters (all/unread/archived), bulk message button
   - Center: message area with date grouping, bubbles, read receipts, typing indicator, input with attachments and quick reply button
   - Right: patient context panel (weight, phase, next appointment, adherence)

2. **`src/components/chat/ConversationList.tsx`** — Left column component
3. **`src/components/chat/MessageArea.tsx`** — Center column with messages
4. **`src/components/chat/PatientContext.tsx`** — Right column context panel
5. **`src/components/chat/QuickRepliesPanel.tsx`** — Quick replies selector
6. **`src/components/chat/BulkMessageModal.tsx`** — Bulk messaging modal

7. **`src/components/NotificationCenter.tsx`** — Bell icon + slide-in panel for notifications with filters and mark-all-read

8. **`src/components/portal/PortalChat.tsx`** — Patient-side chat (mobile layout)

### Modified Files:
1. **`src/components/AppSidebar.tsx`** — Add "Chat" icon with unread badge
2. **`src/components/AppLayout.tsx`** — Add notification bell to header
3. **`src/App.tsx`** — Add `/chat` route
4. **`src/pages/PortalPaciente.tsx`** — Wire "mensagens" more-tab to PortalChat

## Real-time Implementation

Use Supabase Realtime subscriptions:
- Subscribe to `mensagens` inserts filtered by conversation ID for live chat
- Subscribe to `notificacoes` inserts filtered by user ID for notification badge
- Subscribe to `conversas` updates for unread count badges in sidebar

## Typing Indicator

Use Supabase Realtime Broadcast (channel-based, no DB) to send/receive typing events per conversation. No database table needed.

## Visual Identity

All components follow the Gabriel Sanches brand:
- Primary #2B3990, bubbles as specified (nutri right #2B3990, patient left #F0F2F8)
- Pill-shaped input (h-48px, radius-24px)
- Chat bubbles: radius 16px with flat corner on sender side
- Notification panel: 360px wide, slide-in from right, colored left border per type
- Badge: red circle #EF4444

## Implementation Order

1. Database migration (all 4 tables + realtime + seed)
2. Chat page for nutritionist (largest piece)
3. Portal chat for patient
4. Notification center
5. Sidebar + header integration (badge, bell)
6. Route wiring

