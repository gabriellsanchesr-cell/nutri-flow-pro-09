import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const faseLabels: Record<string, string> = {
  rotina: "Rotina", estrategia: "Estratégia", autonomia: "Autonomia", liberdade: "Liberdade",
};

export default function PacienteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<any>(null);

  useEffect(() => {
    if (id) loadPaciente();
  }, [id]);

  const loadPaciente = async () => {
    const { data } = await supabase.from("pacientes").select("*").eq("id", id).single();
    setPaciente(data);
  };

  if (!paciente) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{paciente.nome_completo}</h1>
          <Badge variant="secondary">{faseLabels[paciente.fase_real] || paciente.fase_real}</Badge>
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
    </div>
  );
}
