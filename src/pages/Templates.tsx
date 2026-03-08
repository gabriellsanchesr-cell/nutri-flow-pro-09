import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const objetivoLabels: Record<string, string> = {
  emagrecimento: "Emagrecimento",
  ganho_de_massa: "Ganho de Massa",
  saude_intestinal: "Saúde Intestinal",
  controle_ansiedade_alimentar: "Controle de Ansiedade",
  performance: "Performance",
  outro: "Outro",
};

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [form, setForm] = useState({ nome: "", objetivo_template: "emagrecimento", observacoes: "" });

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadPacientes();
    }
  }, [user]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("planos_alimentares")
      .select("*")
      .eq("is_template", true)
      .order("created_at", { ascending: false });
    setTemplates(data || []);
  };

  const loadPacientes = async () => {
    const { data } = await supabase.from("pacientes").select("id, nome_completo").eq("ativo", true).order("nome_completo");
    setPacientes(data || []);
  };

  const createTemplate = async () => {
    if (!user) return;
    const { error } = await supabase.from("planos_alimentares").insert({
      user_id: user.id,
      nome: form.nome || "Template",
      is_template: true,
      objetivo_template: form.objetivo_template as any,
      observacoes: form.observacoes || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template criado!" });
      setDialogOpen(false);
      setForm({ nome: "", objetivo_template: "emagrecimento", observacoes: "" });
      loadTemplates();
    }
  };

  const duplicateForPaciente = async () => {
    if (!user || !selectedTemplate || !selectedPaciente) return;
    const { error } = await supabase.from("planos_alimentares").insert({
      user_id: user.id,
      paciente_id: selectedPaciente,
      nome: selectedTemplate.nome,
      observacoes: selectedTemplate.observacoes,
      is_template: false,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plano duplicado para o paciente!" });
      setDuplicateDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates de Plano</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Template</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select value={form.objetivo_template} onValueChange={(v) => setForm((f) => ({ ...f, objetivo_template: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(objetivoLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} />
              </div>
              <Button onClick={createTemplate} className="w-full">Criar Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Duplicar para Paciente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Template: <strong>{selectedTemplate?.nome}</strong></p>
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={selectedPaciente} onValueChange={setSelectedPaciente}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={duplicateForPaciente} className="w-full">Duplicar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {t.nome}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p className="capitalize">{objetivoLabels[t.objetivo_template] || "—"}</p>
              <p>{format(new Date(t.created_at), "dd/MM/yyyy")}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => { setSelectedTemplate(t); setDuplicateDialogOpen(true); }}
              >
                <Copy className="h-3 w-3 mr-2" /> Duplicar para Paciente
              </Button>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">Nenhum template criado ainda</p>
        )}
      </div>
    </div>
  );
}
