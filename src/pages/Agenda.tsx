import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  agendado: "bg-primary/10 text-primary",
  realizado: "bg-success/10 text-success",
  cancelado: "bg-destructive/10 text-destructive",
};

const tipoLabels: Record<string, string> = {
  primeira_consulta: "1ª Consulta",
  retorno: "Retorno",
  online: "Online",
  presencial: "Presencial",
};

export default function Agenda() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consultas, setConsultas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<"month" | "week">("month");
  const [form, setForm] = useState({ paciente_id: "", data: "", hora: "", tipo: "retorno", anotacoes: "" });

  useEffect(() => {
    if (user) {
      loadConsultas();
      loadPacientes();
    }
  }, [user, currentDate]);

  const loadConsultas = async () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const { data } = await supabase
      .from("consultas")
      .select("*, pacientes(nome_completo)")
      .gte("data_hora", start.toISOString())
      .lte("data_hora", end.toISOString())
      .order("data_hora");
    setConsultas(data || []);
  };

  const loadPacientes = async () => {
    const { data } = await supabase.from("pacientes").select("id, nome_completo").eq("ativo", true).order("nome_completo");
    setPacientes(data || []);
  };

  const createConsulta = async () => {
    if (!user || !form.paciente_id || !form.data || !form.hora) return;
    const data_hora = `${form.data}T${form.hora}:00`;
    const { error } = await supabase.from("consultas").insert({
      user_id: user.id,
      paciente_id: form.paciente_id,
      data_hora,
      tipo: form.tipo as any,
      anotacoes: form.anotacoes || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Consulta agendada!" });
      setDialogOpen(false);
      setForm({ paciente_id: "", data: "", hora: "", tipo: "retorno", anotacoes: "" });
      loadConsultas();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("consultas").update({ status: status as any }).eq("id", id);
    loadConsultas();
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { locale: ptBR });
  const calEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex gap-2">
          <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>Mês</Button>
          <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>Semana</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Nova Consulta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agendar Consulta</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <Select value={form.paciente_id} onValueChange={(v) => setForm((f) => ({ ...f, paciente_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {pacientes.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nome_completo}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora *</Label>
                    <Input type="time" value={form.hora} onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primeira_consulta">1ª Consulta</SelectItem>
                      <SelectItem value="retorno">Retorno</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Anotações</Label>
                  <Textarea value={form.anotacoes} onChange={(e) => setForm((f) => ({ ...f, anotacoes: e.target.value }))} />
                </div>
                <Button onClick={createConsulta} className="w-full">Agendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>← Anterior</Button>
        <h2 className="text-lg font-semibold capitalize">{format(currentDate, "MMMM yyyy", { locale: ptBR })}</h2>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>Próximo →</Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
        {days.map((day) => {
          const dayConsultas = consultas.filter((c) => isSameDay(new Date(c.data_hora), day));
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          return (
            <div key={day.toISOString()} className={`min-h-[80px] p-1 border rounded-md ${isCurrentMonth ? "bg-card" : "bg-muted/30"}`}>
              <p className={`text-xs font-medium mb-1 ${isCurrentMonth ? "" : "text-muted-foreground"}`}>{day.getDate()}</p>
              {dayConsultas.slice(0, 2).map((c) => (
                <div key={c.id} className="text-xs truncate mb-0.5 px-1 rounded bg-primary/10 text-primary">
                  {format(new Date(c.data_hora), "HH:mm")} {(c as any).pacientes?.nome_completo?.split(" ")[0]}
                </div>
              ))}
              {dayConsultas.length > 2 && (
                <p className="text-xs text-muted-foreground">+{dayConsultas.length - 2}</p>
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Consultas do Mês</CardTitle></CardHeader>
        <CardContent>
          {consultas.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma consulta neste mês</p>
          ) : (
            <div className="space-y-3">
              {consultas.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{(c as any).pacientes?.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(c.data_hora), "dd/MM/yyyy HH:mm")} · {tipoLabels[c.tipo] || c.tipo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={statusColors[c.status] || ""}>{c.status}</Badge>
                    {c.status === "agendado" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "realizado")}>✓</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "cancelado")}>✗</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
