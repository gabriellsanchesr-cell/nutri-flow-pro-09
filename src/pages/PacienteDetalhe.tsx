import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PacienteHeader } from "@/components/paciente/PacienteHeader";
import { PacienteSidebar, sections, type SectionId } from "@/components/paciente/PacienteSidebar";
import { VisaoGeral } from "@/components/paciente/VisaoGeral";
import { DadosPaciente } from "@/components/paciente/DadosPaciente";
import { AcompanhamentoSection } from "@/components/paciente/AcompanhamentoSection";
import { PlanoAlimentarSection } from "@/components/paciente/PlanoAlimentarSection";
import { ConsultasSection } from "@/components/paciente/ConsultasSection";
import { CalculoEnergetico } from "@/components/paciente/CalculoEnergetico";
import { AcessoPaciente } from "@/components/paciente/AcessoPaciente";
import { PlaceholderSection } from "@/components/paciente/PlaceholderSection";
import { PacienteAccessModal } from "@/components/PacienteAccessModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

export default function PacienteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paciente, setPaciente] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("visao-geral");
  const [accessModal, setAccessModal] = useState<{ open: boolean; mode: "create" | "edit" }>({ open: false, mode: "create" });
  const [deleteModal, setDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { if (id) loadPaciente(); }, [id]);

  const loadPaciente = async () => {
    const { data } = await supabase.from("pacientes").select("*").eq("id", id).single();
    setPaciente(data);
  };

  const handleAction = async (action: "deactivate" | "reactivate") => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-patient-auth", { body: { action, paciente_id: id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sucesso", description: action === "deactivate" ? "Acesso desativado." : "Acesso reativado." });
      loadPaciente();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-patient-auth", { body: { action: "delete", paciente_id: id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sucesso", description: "Paciente excluído." });
      navigate("/pacientes");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setActionLoading(false); }
  };

  if (!paciente) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="space-y-3 text-center">
          <div className="h-10 w-10 mx-auto rounded-full bg-muted animate-pulse" />
          <p className="text-muted-foreground">Carregando paciente...</p>
        </div>
      </div>
    );
  }

  const sectionLabel = sections.find(s => s.id === activeSection)?.label || "";

  const renderSection = () => {
    switch (activeSection) {
      case "visao-geral": return <VisaoGeral paciente={paciente} onNavigate={setActiveSection} />;
      case "dados": return <DadosPaciente paciente={paciente} onEdit={() => navigate(`/pacientes/novo?edit=${paciente.id}`)} />;
      case "acompanhamento": return <AcompanhamentoSection paciente={paciente} />;
      case "plano": return <PlanoAlimentarSection paciente={paciente} />;
      case "consultas": return <ConsultasSection paciente={paciente} />;
      case "calculo": return <CalculoEnergetico paciente={paciente} />;
      case "acesso": return (
        <AcessoPaciente
          paciente={paciente}
          onCreateAccess={() => setAccessModal({ open: true, mode: "create" })}
          onDeactivate={() => handleAction("deactivate")}
          onReactivate={() => handleAction("reactivate")}
          actionLoading={actionLoading}
        />
      );
      case "anamnese": return <PlaceholderSection title="Anamnese" description="Formulário completo de anamnese com envio de link ao paciente. Em breve." />;
      case "fotos": return <PlaceholderSection title="Evolução Fotográfica" description="Upload e comparação lado a lado de fotos de progresso. Em breve." />;
      case "questionarios": return <PlaceholderSection title="Questionários" description="Envio e gestão de questionários personalizados ao paciente. Em breve." />;
      case "exames": return <PlaceholderSection title="Exames Laboratoriais" description="Upload e organização de resultados de exames. Em breve." />;
      case "orientacoes": return <PlaceholderSection title="Orientações e Materiais" description="Biblioteca de orientações enviadas ao paciente. Em breve." />;
      case "prontuario": return <PlaceholderSection title="Prontuário" description="Linha do tempo cronológica de todo o acompanhamento. Em breve." />;
      default: return null;
    }
  };

  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-3.5rem)]">
      <PacienteHeader
        paciente={paciente}
        activeSection={activeSection}
        sectionLabel={sectionLabel}
        onCreateAccess={() => setAccessModal({ open: true, mode: "create" })}
        onDeactivate={() => handleAction("deactivate")}
        onReactivate={() => handleAction("reactivate")}
        onDelete={() => setDeleteModal(true)}
        onEdit={() => navigate(`/pacientes/novo?edit=${paciente.id}`)}
        actionLoading={actionLoading}
      />

      <div className="flex flex-1 overflow-hidden">
        <PacienteSidebar active={activeSection} onSelect={setActiveSection} />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {renderSection()}
        </main>
      </div>

      <PacienteAccessModal
        open={accessModal.open}
        onOpenChange={(v) => setAccessModal(s => ({ ...s, open: v }))}
        pacienteId={paciente.id}
        pacienteNome={paciente.nome_completo}
        pacienteEmail={paciente.email}
        mode={accessModal.mode}
        onSuccess={loadPaciente}
      />
      <DeleteConfirmModal
        open={deleteModal}
        onOpenChange={setDeleteModal}
        pacienteNome={paciente.nome_completo}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
}
