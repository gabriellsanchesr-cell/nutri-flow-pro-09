import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PacienteForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome_completo: "",
    data_nascimento: "",
    sexo: "",
    telefone: "",
    email: "",
    peso_inicial: "",
    altura: "",
    objetivo: "outro" as string,
    objetivo_outro: "",
    restricoes_alimentares: "",
    alergias: "",
    historico_patologias: "",
    medicamentos: "",
    nivel_atividade: "sedentario" as string,
    rotina_sono: "",
    observacoes_comportamentais: "",
    fase_real: "rotina" as string,
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("pacientes").insert({
      user_id: user.id,
      nome_completo: form.nome_completo,
      data_nascimento: form.data_nascimento || null,
      sexo: form.sexo || null,
      telefone: form.telefone || null,
      email: form.email || null,
      peso_inicial: form.peso_inicial ? parseFloat(form.peso_inicial) : null,
      altura: form.altura ? parseFloat(form.altura) : null,
      objetivo: form.objetivo as any,
      objetivo_outro: form.objetivo_outro || null,
      restricoes_alimentares: form.restricoes_alimentares || null,
      alergias: form.alergias || null,
      historico_patologias: form.historico_patologias || null,
      medicamentos: form.medicamentos || null,
      nivel_atividade: form.nivel_atividade as any,
      rotina_sono: form.rotina_sono || null,
      observacoes_comportamentais: form.observacoes_comportamentais || null,
      fase_real: form.fase_real as any,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Paciente cadastrado!" });
      navigate("/pacientes");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate("/pacientes")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Nome Completo *</Label>
              <Input value={form.nome_completo} onChange={(e) => set("nome_completo", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input type="date" value={form.data_nascimento} onChange={(e) => set("data_nascimento", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={form.sexo} onValueChange={(v) => set("sexo", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Antropometria e Objetivo</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Peso Inicial (kg)</Label>
              <Input type="number" step="0.1" value={form.peso_inicial} onChange={(e) => set("peso_inicial", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Altura (m)</Label>
              <Input type="number" step="0.01" value={form.altura} onChange={(e) => set("altura", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Objetivo Principal</Label>
              <Select value={form.objetivo} onValueChange={(v) => set("objetivo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="ganho_de_massa">Ganho de Massa</SelectItem>
                  <SelectItem value="saude_intestinal">Saúde Intestinal</SelectItem>
                  <SelectItem value="controle_ansiedade_alimentar">Controle de Ansiedade Alimentar</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.objetivo === "outro" && (
              <div className="space-y-2">
                <Label>Qual objetivo?</Label>
                <Input value={form.objetivo_outro} onChange={(e) => set("objetivo_outro", e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Fase do Método R.E.A.L.</Label>
              <Select value={form.fase_real} onValueChange={(v) => set("fase_real", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rotina">Rotina</SelectItem>
                  <SelectItem value="estrategia">Estratégia</SelectItem>
                  <SelectItem value="autonomia">Autonomia</SelectItem>
                  <SelectItem value="liberdade">Liberdade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Saúde e Histórico</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Restrições Alimentares</Label>
              <Textarea value={form.restricoes_alimentares} onChange={(e) => set("restricoes_alimentares", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alergias</Label>
              <Textarea value={form.alergias} onChange={(e) => set("alergias", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Histórico de Patologias</Label>
              <Textarea value={form.historico_patologias} onChange={(e) => set("historico_patologias", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Uso de Medicamentos</Label>
              <Textarea value={form.medicamentos} onChange={(e) => set("medicamentos", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nível de Atividade Física</Label>
              <Select value={form.nivel_atividade} onValueChange={(v) => set("nivel_atividade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentario">Sedentário</SelectItem>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="intenso">Intenso</SelectItem>
                  <SelectItem value="muito_intenso">Muito Intenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rotina de Sono</Label>
              <Textarea value={form.rotina_sono} onChange={(e) => set("rotina_sono", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observações Comportamentais</Label>
              <Textarea value={form.observacoes_comportamentais} onChange={(e) => set("observacoes_comportamentais", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Cadastrar Paciente"}
        </Button>
      </form>
    </div>
  );
}
