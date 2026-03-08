import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, KeyRound, UserX, UserCheck, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PacienteAccessModal } from "@/components/PacienteAccessModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

const faseLabels: Record<string, string> = {
  rotina: "Rotina", estrategia: "Estratégia", autonomia: "Autonomia", liberdade: "Liberdade",
};

const statusLabels: Record<string, { label: string; variant: "default" | "destructive" | "outline" }> = {
  ativo: { label: "Conta Ativa", variant: "default" },
  desativado: { label: "Conta Inativa", variant: "destructive" },
  sem_conta: { label: "Sem Conta", variant: "outline" },
};

export default function PacienteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paciente, setPaciente] = useState<any>(null);
  const [accessModal, setAccessModal] = useState<{ open: boolean; mode: "create" | "edit" }>({ open: false, mode: "create" });
  const [deleteModal, setDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadPaciente();
  }, [id]);

  const loadPaciente = async () => {
    const { data } = await supabase.from("pacientes").select("*").eq("id", id).single();
    setPaciente(data);
  };

  const handleAction = async (action: "deactivate" | "reactivate") => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-patient-auth", {
        body: { action, paciente_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sucesso", description: action === "deactivate" ? "Acesso desativado." : "Acesso reativado." });
      loadPaciente();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-patient-auth", {
        body: { action: "delete", paciente_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sucesso", description: "Paciente excluído." });
      navigate("/pacientes");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (!paciente) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  const status = paciente.account_status || "sem_conta";
  const statusCfg = statusLabels[status] || statusLabels.sem_conta;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{paciente.nome_completo}</h1>
          <div className="flex gap-2 mt-1">
            <Badge variant="secondary">{faseLabels[paciente.fase_real] || paciente.fase_real}</Badge>
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {status === "sem_conta" && (
            <Button size="sm" onClick={() => setAccessModal({ open: true, mode: "create" })}>
              <KeyRound className="h-4 w-4 mr-1" /> Criar Acesso
            </Button>
          )}
          {status === "ativo" && (
            <Button size="sm" variant="outline" onClick={() => handleAction("deactivate")} disabled={actionLoading}>
              <UserX className="h-4 w-4 mr-1" /> Desativar
            </Button>
          )}
          {status === "desativado" && (
            <Button size="sm" variant="outline" onClick={() => handleAction("reactivate")} disabled={actionLoading}>
              <UserCheck className="h-4 w-4 mr-1" /> Reativar
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={() => setDeleteModal(true)}>
            <Trash2 className="h-4 w-4 mr-1" /> Excluir
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="plano">Plano Alimentar</TabsTrigger>
          <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
          <TabsTrigger value="consultas">Consultas</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Informações Pessoais</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Nascimento:</span> {paciente.data_nascimento || "—"}</p>
                <p><span className="text-muted-foreground">Sexo:</span> {paciente.sexo || "—"}</p>
                <p><span className="text-muted-foreground">Telefone:</span> {paciente.telefone || "—"}</p>
                <p><span className="text-muted-foreground">E-mail:</span> {paciente.email || "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Antropometria</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Peso Inicial:</span> {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : "—"}</p>
                <p><span className="text-muted-foreground">Altura:</span> {paciente.altura ? `${paciente.altura} m` : "—"}</p>
                <p><span className="text-muted-foreground">Objetivo:</span> {paciente.objetivo?.replace(/_/g, " ") || "—"}</p>
                <p><span className="text-muted-foreground">Atividade:</span> {paciente.nivel_atividade?.replace(/_/g, " ") || "—"}</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Saúde e Histórico</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Restrições:</span> {paciente.restricoes_alimentares || "—"}</p>
                <p><span className="text-muted-foreground">Alergias:</span> {paciente.alergias || "—"}</p>
                <p><span className="text-muted-foreground">Patologias:</span> {paciente.historico_patologias || "—"}</p>
                <p><span className="text-muted-foreground">Medicamentos:</span> {paciente.medicamentos || "—"}</p>
                <p><span className="text-muted-foreground">Sono:</span> {paciente.rotina_sono || "—"}</p>
                <p><span className="text-muted-foreground">Observações:</span> {paciente.observacoes_comportamentais || "—"}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plano" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Acesse a seção de Planos Alimentares para criar um plano para este paciente.</p>
              <Button className="mt-4" onClick={() => navigate("/planos")}>Ir para Planos</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acompanhamento" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Acesse a seção de Acompanhamento para registrar evoluções.</p>
              <Button className="mt-4" onClick={() => navigate("/acompanhamento")}>Ir para Acompanhamento</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultas" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Acesse a Agenda para gerenciar consultas.</p>
              <Button className="mt-4" onClick={() => navigate("/agenda")}>Ir para Agenda</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PacienteAccessModal
        open={accessModal.open}
        onOpenChange={(v) => setAccessModal((s) => ({ ...s, open: v }))}
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
