import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookMarked, Plus, ArrowLeft, Camera, ChevronLeft, ChevronRight,
  Clock, MessageSquare, Image as ImageIcon, Send, X,
} from "lucide-react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoLabels: Record<string, string> = {
  cafe_da_manha: "Café da Manhã",
  lanche_da_manha: "Lanche da Manhã",
  almoco: "Almoço",
  lanche_da_tarde: "Lanche da Tarde",
  jantar: "Jantar",
  ceia: "Ceia",
  outro: "Outro Momento",
};

type DiarioRegistro = {
  id: string;
  data_registro: string;
  tipo_refeicao: string;
  horario: string | null;
  descricao: string;
  foto_path: string | null;
  sentimento: string | null;
  feedback_nutri: string | null;
  feedback_data: string | null;
  created_at: string;
};

export function PortalDiario({ paciente }: { paciente: any }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [registros, setRegistros] = useState<DiarioRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"home" | "form" | "history">("home");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formTipo, setFormTipo] = useState("almoco");
  const [formHorario, setFormHorario] = useState(format(new Date(), "HH:mm"));
  const [formDescricao, setFormDescricao] = useState("");
  const [formSentimento, setFormSentimento] = useState("");
  const [formFoto, setFormFoto] = useState<File | null>(null);
  const [formFotoPreview, setFormFotoPreview] = useState<string | null>(null);

  useState(() => { loadRegistros(); });

  async function loadRegistros() {
    const { data } = await supabase
      .from("diario_registros")
      .select("*")
      .eq("paciente_id", paciente.id)
      .order("data_registro", { ascending: false })
      .order("created_at", { ascending: false });
    setRegistros((data as any) || []);
    setLoading(false);
  }

  const todayRegistros = registros.filter(r => r.data_registro === selectedDate);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFoto(file);
      setFormFotoPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormTipo("almoco");
    setFormHorario(format(new Date(), "HH:mm"));
    setFormDescricao("");
    setFormSentimento("");
    setFormFoto(null);
    setFormFotoPreview(null);
  };

  const handleSave = async () => {
    if (!formDescricao.trim()) {
      toast({ title: "Descreva o que você comeu", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let fotoPath: string | null = null;
      if (formFoto) {
        const ext = formFoto.name.split(".").pop() || "jpg";
        const path = `${paciente.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("diario-fotos").upload(path, formFoto);
        if (upErr) throw upErr;
        fotoPath = path;
      }

      const { error } = await supabase.from("diario_registros").insert({
        paciente_id: paciente.id,
        paciente_user_id: user!.id,
        data_registro: selectedDate,
        tipo_refeicao: formTipo,
        horario: formHorario + ":00",
        descricao: formDescricao.trim(),
        foto_path: fotoPath,
        sentimento: formSentimento.trim() || null,
      } as any);
      if (error) throw error;

      toast({ title: "Refeição registrada! ✅" });
      resetForm();
      await loadRegistros();
      setView("home");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("diario-fotos").getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Carregando...</div>;

  // ===== FORM VIEW =====
  if (view === "form") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { resetForm(); setView("home"); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-lg font-bold text-foreground">Registrar Refeição</h2>

        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Qual refeição?</Label>
              <Select value={formTipo} onValueChange={setFormTipo}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Horário</Label>
              <Input type="time" value={formHorario} onChange={e => setFormHorario(e.target.value)} className="h-9" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">O que você comeu? 🍽️</Label>
              <Textarea
                placeholder="Descreva com suas palavras..."
                value={formDescricao}
                onChange={e => setFormDescricao(e.target.value)}
                rows={3}
              />
            </div>

            {/* Photo */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Foto (opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              {formFotoPreview ? (
                <div className="relative max-w-xs">
                  <img src={formFotoPreview} alt="Preview" className="rounded-xl w-full h-auto" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full"
                    onClick={() => { setFormFoto(null); setFormFotoPreview(null); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full rounded-xl h-20 border-dashed" onClick={() => fileInputRef.current?.click()}>
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Tirar foto ou escolher da galeria</span>
                  </div>
                </Button>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Como você se sentiu depois? (opcional)</Label>
              <Input
                placeholder="Ex: satisfeito, com fome ainda, culpado..."
                value={formSentimento}
                onChange={e => setFormSentimento(e.target.value)}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
          {saving ? "Salvando..." : "Salvar Registro"}
        </Button>
      </div>
    );
  }

  // ===== HISTORY VIEW =====
  if (view === "history") {
    const sortedDates = [...new Set(registros.map(r => r.data_registro))].sort().reverse();
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setView("home")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h2 className="text-lg font-bold text-foreground">Histórico</h2>

        {sortedDates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhum registro ainda.</div>
        ) : (
          sortedDates.map(date => {
            const dayRegs = registros.filter(r => r.data_registro === date);
            return (
              <div key={date} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {format(parseISO(date), "EEEE, dd/MM", { locale: ptBR })}
                </p>
                {dayRegs.map(reg => (
                  <Card key={reg.id} className="rounded-2xl">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{tipoLabels[reg.tipo_refeicao] || reg.tipo_refeicao}</Badge>
                        {reg.horario && <span className="text-xs text-muted-foreground">{reg.horario.slice(0, 5)}</span>}
                      </div>
                      {reg.foto_path && (
                        <img src={getPhotoUrl(reg.foto_path)} alt="Refeição" className="rounded-xl w-full max-w-xs h-auto" />
                      )}
                      <p className="text-sm text-foreground">{reg.descricao}</p>
                      {reg.sentimento && <p className="text-xs text-muted-foreground">💭 {reg.sentimento}</p>}
                      {reg.feedback_nutri && (
                        <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10">
                          <p className="text-xs font-medium text-primary flex items-center gap-1 mb-0.5">
                            <MessageSquare className="h-3 w-3" /> Feedback do nutricionista
                          </p>
                          <p className="text-sm text-foreground">{reg.feedback_nutri}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ===== HOME VIEW =====
  const totalExpected = 4; // simplified — ideally from config
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Diário Alimentar</h2>

      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setSelectedDate(subDays(parseISO(selectedDate), 1).toISOString().split("T")[0])}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold text-foreground">
          {format(parseISO(selectedDate), "EEEE, dd/MM", { locale: ptBR })}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(parseISO(selectedDate), 1).toISOString().split("T")[0])}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Refeições do dia</p>
            <p className="text-xs text-muted-foreground">{todayRegistros.length} registrada{todayRegistros.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{todayRegistros.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Register button */}
      <Button className="w-full rounded-xl h-12" onClick={() => setView("form")}>
        <Plus className="h-4 w-4 mr-2" /> Registrar Refeição
      </Button>

      {/* Today's records */}
      {todayRegistros.length > 0 ? (
        <div className="space-y-2">
          {todayRegistros.map(reg => (
            <Card key={reg.id} className="rounded-2xl">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{tipoLabels[reg.tipo_refeicao] || reg.tipo_refeicao}</Badge>
                  {reg.horario && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {reg.horario.slice(0, 5)}
                    </span>
                  )}
                </div>
                {reg.foto_path && (
                  <img src={getPhotoUrl(reg.foto_path)} alt="Refeição" className="rounded-xl w-full max-w-xs h-auto" />
                )}
                <p className="text-sm text-foreground">{reg.descricao}</p>
                {reg.sentimento && <p className="text-xs text-muted-foreground">💭 {reg.sentimento}</p>}
                {reg.feedback_nutri && (
                  <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10">
                    <p className="text-xs font-medium text-primary flex items-center gap-1 mb-0.5">
                      <MessageSquare className="h-3 w-3" /> Feedback do nutricionista
                    </p>
                    <p className="text-sm text-foreground">{reg.feedback_nutri}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <BookMarked className="h-6 w-6 mx-auto mb-2 opacity-40" />
          Nenhum registro para este dia.
        </div>
      )}

      {/* History link */}
      <Button variant="outline" className="w-full rounded-xl" onClick={() => setView("history")}>
        Ver histórico completo
      </Button>
    </div>
  );
}
