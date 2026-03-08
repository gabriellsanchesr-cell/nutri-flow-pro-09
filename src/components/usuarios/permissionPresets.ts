export const PERMISSION_MODULES = {
  pacientes: {
    label: "Pacientes",
    permissions: [
      { key: "ver", label: "Ver lista de pacientes" },
      { key: "criar", label: "Adicionar paciente" },
      { key: "editar", label: "Editar dados do paciente" },
      { key: "excluir", label: "Excluir paciente" },
    ],
  },
  planos: {
    label: "Planos Alimentares",
    permissions: [
      { key: "ver", label: "Ver planos" },
      { key: "criar", label: "Criar plano" },
      { key: "editar", label: "Editar plano" },
      { key: "excluir", label: "Excluir plano" },
      { key: "exportar_pdf", label: "Exportar PDF" },
      { key: "enviar", label: "Enviar para paciente" },
    ],
  },
  avaliacoes: {
    label: "Avaliações e Acompanhamento",
    permissions: [
      { key: "ver", label: "Ver avaliações antropométricas" },
      { key: "criar", label: "Criar e editar avaliações" },
      { key: "editar", label: "Editar avaliações" },
      { key: "ver_acompanhamento", label: "Ver acompanhamento semanal" },
      { key: "registrar_acompanhamento", label: "Registrar acompanhamento" },
      { key: "ver_evolucao", label: "Ver evolução fotográfica" },
    ],
  },
  consultas: {
    label: "Consultas e Agenda",
    permissions: [
      { key: "ver_agenda", label: "Ver agenda" },
      { key: "agendar", label: "Agendar consultas" },
      { key: "registrar", label: "Registrar consultas realizadas" },
      { key: "ver_anotacoes", label: "Ver anotações clínicas" },
      { key: "editar_anotacoes", label: "Editar anotações clínicas" },
    ],
  },
  comunicacao: {
    label: "Comunicação",
    permissions: [
      { key: "ver_chat", label: "Ver chat dos pacientes" },
      { key: "enviar_mensagens", label: "Enviar mensagens" },
      { key: "enviar_materiais", label: "Enviar materiais e receitas" },
      { key: "enviar_lembretes", label: "Enviar lembretes" },
    ],
  },
  anamnese: {
    label: "Anamnese e Questionários",
    permissions: [
      { key: "ver", label: "Ver anamnese" },
      { key: "editar", label: "Editar anamnese" },
      { key: "enviar_questionarios", label: "Enviar questionários" },
      { key: "ver_respostas", label: "Ver respostas" },
    ],
  },
  financeiro: {
    label: "Financeiro (futuro)",
    permissions: [
      { key: "ver", label: "Ver dados financeiros" },
      { key: "emitir_recibos", label: "Emitir recibos" },
    ],
  },
  configuracoes: {
    label: "Configurações",
    permissions: [
      { key: "acessar", label: "Acessar configurações do sistema" },
      { key: "gerenciar_usuarios", label: "Gerenciar usuários" },
    ],
  },
} as const;

export type PermissionModules = typeof PERMISSION_MODULES;

export const PERMISSION_PRESETS: Record<string, Record<string, Record<string, boolean>>> = {
  nutricionista_assistente: {
    pacientes: { ver: true, criar: true, editar: true, excluir: false },
    planos: { ver: true, criar: true, editar: true, excluir: false, exportar_pdf: true, enviar: true },
    avaliacoes: { ver: true, criar: true, editar: true, ver_acompanhamento: true, registrar_acompanhamento: true, ver_evolucao: true },
    consultas: { ver_agenda: true, agendar: true, registrar: true, ver_anotacoes: true, editar_anotacoes: false },
    comunicacao: { ver_chat: true, enviar_mensagens: true, enviar_materiais: true, enviar_lembretes: true },
    anamnese: { ver: true, editar: true, enviar_questionarios: true, ver_respostas: true },
    financeiro: { ver: false, emitir_recibos: false },
    configuracoes: { acessar: false, gerenciar_usuarios: false },
  },
  secretaria: {
    pacientes: { ver: true, criar: false, editar: false, excluir: false },
    planos: { ver: false, criar: false, editar: false, excluir: false, exportar_pdf: false, enviar: false },
    avaliacoes: { ver: false, criar: false, editar: false, ver_acompanhamento: false, registrar_acompanhamento: false, ver_evolucao: false },
    consultas: { ver_agenda: true, agendar: true, registrar: true, ver_anotacoes: false, editar_anotacoes: false },
    comunicacao: { ver_chat: true, enviar_mensagens: true, enviar_materiais: false, enviar_lembretes: true },
    anamnese: { ver: false, editar: false, enviar_questionarios: false, ver_respostas: false },
    financeiro: { ver: false, emitir_recibos: false },
    configuracoes: { acessar: false, gerenciar_usuarios: false },
  },
  estagiario: {
    pacientes: { ver: true, criar: false, editar: false, excluir: false },
    planos: { ver: true, criar: false, editar: false, excluir: false, exportar_pdf: false, enviar: false },
    avaliacoes: { ver: true, criar: false, editar: false, ver_acompanhamento: true, registrar_acompanhamento: false, ver_evolucao: true },
    consultas: { ver_agenda: true, agendar: false, registrar: false, ver_anotacoes: false, editar_anotacoes: false },
    comunicacao: { ver_chat: true, enviar_mensagens: false, enviar_materiais: false, enviar_lembretes: false },
    anamnese: { ver: true, editar: false, enviar_questionarios: false, ver_respostas: true },
    financeiro: { ver: false, emitir_recibos: false },
    configuracoes: { acessar: false, gerenciar_usuarios: false },
  },
};
