import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, FileDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ExportPdfModal } from "@/components/pdf/ExportPdfModal";

interface Props {
  paciente: any;
}

type FilterPeriod = "4w" | "3m" | "6m" | "all";

export function AcompanhamentoSection({ paciente }: Props) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterPeriod>("3m");
  const { toast } = useToast();
  const { session } = useAuth();
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [planoAtivo, setPlanoAtivo] = useState<any>(null);

  const [form, setForm] = useState({
    data_registro: new Date().toISOString().split("T")[0],
    peso: "",
    circunferencia_abdominal: "",
    circunferencia_quadril: "",
    nivel_energia: 3,
    qualidade_sono: 3,
    aderencia_plano: 70,
    observacoes_paciente: "",
    observacoes_nutricionista: "",
  });

  useEffect(() => { loadRecords(); loadExtras(); }, [paciente.id]);

  const loadRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("acompanhamentos")
      .select("*")
      .eq("paciente_id", paciente.id)
      .order("data_registro", { ascending: true });
    setRecords(data || []);
    setLoading(false);
  };

  const filterDate = () => {
    const now = new Date();
    if (filter === "4w") { now.setDate(now.getDate() - 28); return now; }
    if (filter === "3m") { now.setMonth(now.getMonth() - 3); return now; }
    if (filter === "6m") { now.setMonth(now.getMonth() - 6); return now; }
    return new Date(2000, 0, 1);
  };

  const filtered = records.filter(r => new Date(r.data_registro) >= filterDate());
  const chartData = filtered.map(r => ({
    data: new Date(r.data_registro).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    Peso: r.peso,
    Abdominal: r.circunferencia_abdominal,
    Quadril: r.circunferencia_quadril,
  }));

  const handleSave = async () => {
    if (!session?.user?.id) return;
    const { error } = await supabase.from("acompanhamentos").insert({
      paciente_id: paciente.id,
      user_id: session.user.id,
      data_registro: form.data_registro,
      peso: form.peso ? Number(form.peso) : null,
      circunferencia_abdominal: form.circunferencia_abdominal ? Number(form.circunferencia_abdominal) : null,
      circunferencia_quadril: form.circunferencia_quadril ? Number(form.circunferencia_quadril) : null,
      nivel_energia: form.nivel_energia,
      qualidade_sono: form.qualidade_sono,
      aderencia_plano: form.aderencia_plano,
      observacoes_paciente: form.observacoes_paciente || null,
      observacoes_nutricionista: form.observacoes_nutricionista || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Registro salvo." });
      setModalOpen(false);
      setForm({ data_registro: new Date().toISOString().split("T")[0], peso: "", circunferencia_abdominal: "", circunferencia_quadril: "", nivel_energia: 3, qualidade_sono: 3, aderencia_plano: 70, observacoes_paciente: "", observacoes_nutricionista: "" });
      loadRecords();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("acompanhamentos").delete().eq("id", id);
    if (!error) { toast({ title: "Registro removido" }); loadRecords(); }
  };

  const filters: { value: FilterPeriod; label: string }[] = [
    { value: "4w", label: "4 sem" }, { value: "3m", label: "3 meses" },
    { value: "6m", label: "6 meses" }, { value: "all", label: "Tudo" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {filters.map(f => (
            <Button key={f.value} size="sm" variant={filter === f.value ? "default" : "outline"} onClick={() => setFilter(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Registrar semana
        </Button>
      </div>

      {chartData.length > 1 && (
        <Card className="border-border rounded-xl">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Abdominal" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Quadril" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead className="hidden sm:table-cell">Abd.</TableHead>
              <TableHead className="hidden sm:table-cell">Quadril</TableHead>
              <TableHead className="hidden md:table-cell">Energia</TableHead>
              <TableHead className="hidden md:table-cell">Sono</TableHead>
              <TableHead className="hidden md:table-cell">Aderência</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
            ) : (
              [...filtered].reverse().map(r => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.data_registro).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{r.peso ? `${r.peso} kg` : "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{r.circunferencia_abdominal ? `${r.circunferencia_abdominal} cm` : "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{r.circunferencia_quadril ? `${r.circunferencia_quadril} cm` : "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.nivel_energia ?? "—"}/5</TableCell>
                  <TableCell className="hidden md:table-cell">{r.qualidade_sono ?? "—"}/5</TableCell>
                  <TableCell className="hidden md:table-cell">{r.aderencia_plano != null ? `${r.aderencia_plano}%` : "—"}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Semana</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={form.data_registro} onChange={e => setForm(f => ({ ...f, data_registro: e.target.value }))} /></div>
              <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Circ. Abdominal (cm)</Label><Input type="number" step="0.1" value={form.circunferencia_abdominal} onChange={e => setForm(f => ({ ...f, circunferencia_abdominal: e.target.value }))} /></div>
              <div><Label>Circ. Quadril (cm)</Label><Input type="number" step="0.1" value={form.circunferencia_quadril} onChange={e => setForm(f => ({ ...f, circunferencia_quadril: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Nível de Energia: {form.nivel_energia}/5</Label>
              <Slider min={1} max={5} step={1} value={[form.nivel_energia]} onValueChange={([v]) => setForm(f => ({ ...f, nivel_energia: v }))} className="mt-2" />
            </div>
            <div>
              <Label>Qualidade do Sono: {form.qualidade_sono}/5</Label>
              <Slider min={1} max={5} step={1} value={[form.qualidade_sono]} onValueChange={([v]) => setForm(f => ({ ...f, qualidade_sono: v }))} className="mt-2" />
            </div>
            <div>
              <Label>Aderência ao Plano: {form.aderencia_plano}%</Label>
              <Slider min={0} max={100} step={5} value={[form.aderencia_plano]} onValueChange={([v]) => setForm(f => ({ ...f, aderencia_plano: v }))} className="mt-2" />
            </div>
            <div><Label>Observações do Paciente</Label><Textarea value={form.observacoes_paciente} onChange={e => setForm(f => ({ ...f, observacoes_paciente: e.target.value }))} rows={2} /></div>
            <div><Label>Observações Clínicas (privado)</Label><Textarea value={form.observacoes_nutricionista} onChange={e => setForm(f => ({ ...f, observacoes_nutricionista: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
