import { useEffect, useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, ArrowLeft, Save, Trash2, TrendingUp, TrendingDown, Minus,
  Scale, Ruler, Activity, BarChart3, ChevronRight, Calendar, Eye, FileDown,
} from "lucide-react";
import { ExportPdfModal } from "@/components/pdf/ExportPdfModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Props { paciente: any; }

// ─── Protocols & Formulas ───────────────────────────────────────────
const PROTOCOLS: Record<string, { label: string; fields: string[] }> = {
  pollock3: { label: "Pollock 3 dobras", fields: ["dobra_peitoral", "dobra_abdominal", "dobra_coxa"] },
  pollock7: { label: "Pollock 7 dobras", fields: ["dobra_peitoral", "dobra_axilar_media", "dobra_triceps", "dobra_subescapular", "dobra_abdominal", "dobra_suprailiaca", "dobra_coxa"] },
  petroski: { label: "Petroski", fields: ["dobra_subescapular", "dobra_triceps", "dobra_suprailiaca", "dobra_panturrilha"] },
  guedes: { label: "Guedes", fields: ["dobra_subescapular", "dobra_suprailiaca", "dobra_abdominal"] },
  durnin: { label: "Durnin & Womersley", fields: ["dobra_biceps", "dobra_triceps", "dobra_subescapular", "dobra_suprailiaca"] },
  faulkner: { label: "Faulkner", fields: ["dobra_triceps", "dobra_subescapular", "dobra_suprailiaca", "dobra_abdominal"] },
};

const FOLD_FIELDS: { key: string; label: string }[] = [
  { key: "dobra_triceps", label: "Tricipital" },
  { key: "dobra_biceps", label: "Bicipital" },
  { key: "dobra_abdominal", label: "Abdominal" },
  { key: "dobra_subescapular", label: "Subescapular" },
  { key: "dobra_axilar_media", label: "Axilar média" },
  { key: "dobra_coxa", label: "Coxa" },
  { key: "dobra_toracica", label: "Torácica" },
  { key: "dobra_suprailiaca", label: "Suprailíaca" },
  { key: "dobra_panturrilha", label: "Panturrilha" },
  { key: "dobra_supraespinhal", label: "Supraespinhal" },
  { key: "dobra_peitoral", label: "Peitoral" },
];

const CIRC_FIELDS: { key: string; label: string }[] = [
  { key: "circ_pescoco", label: "Pescoço" },
  { key: "circ_torax", label: "Tórax" },
  { key: "circ_ombro", label: "Ombro" },
  { key: "circ_cintura", label: "Cintura" },
  { key: "circ_quadril", label: "Quadril" },
  { key: "circ_abdomen", label: "Abdômen" },
  { key: "circ_braco_dir", label: "Braço relaxado D" },
  { key: "circ_braco_esq", label: "Braço relaxado E" },
  { key: "circ_braco_contraido", label: "Braço contraído" },
  { key: "circ_antebraco", label: "Antebraço" },
  { key: "circ_coxa_dir", label: "Coxa D" },
  { key: "circ_coxa_esq", label: "Coxa E" },
  { key: "circ_panturrilha", label: "Panturrilha" },
];

const BIO_FIELDS: { key: string; label: string; unit: string }[] = [
  { key: "bio_percentual_gordura", label: "% Gordura", unit: "%" },
  { key: "bio_percentual_ideal", label: "% Ideal de gordura", unit: "%" },
  { key: "bio_massa_gorda", label: "Massa de gordura", unit: "kg" },
  { key: "bio_percentual_massa_muscular", label: "% Massa muscular", unit: "%" },
  { key: "bio_massa_muscular", label: "Massa muscular", unit: "kg" },
  { key: "bio_agua_corporal", label: "Água corporal total", unit: "%" },
  { key: "bio_peso_osseo", label: "Peso ósseo", unit: "kg" },
  { key: "bio_massa_livre_gordura", label: "Massa livre de gordura", unit: "kg" },
  { key: "bio_gordura_visceral", label: "Gordura visceral", unit: "" },
  { key: "bio_idade_metabolica", label: "Idade metabólica", unit: "anos" },
  { key: "bio_metabolismo_basal", label: "Metabolismo basal", unit: "kcal" },
];

function calcAge(dob: string | null): number {
  if (!dob) return 30;
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}

function calcIMC(peso: number | null, alturaCm: number | null) {
  if (!peso || !alturaCm) return { imc: null, class: null, color: "text-muted-foreground" };
  const m = alturaCm / 100;
  const imc = peso / (m * m);
  let cl = "Normal", color = "text-success";
  if (imc < 18.5) { cl = "Baixo peso"; color = "text-warning"; }
  else if (imc >= 25 && imc < 30) { cl = "Sobrepeso"; color = "text-warning"; }
  else if (imc >= 30 && imc < 35) { cl = "Obesidade I"; color = "text-destructive"; }
  else if (imc >= 35 && imc < 40) { cl = "Obesidade II"; color = "text-destructive"; }
  else if (imc >= 40) { cl = "Obesidade III"; color = "text-destructive"; }
  return { imc: Math.round(imc * 100) / 100, class: cl, color };
}

function idealWeightRange(alturaCm: number | null) {
  if (!alturaCm) return null;
  const m = alturaCm / 100;
  return { min: Math.round(18.5 * m * m * 10) / 10, max: Math.round(24.9 * m * m * 10) / 10 };
}

function calcRCQ(cintura: number | null, quadril: number | null, sexo: string | null) {
  if (!cintura || !quadril) return { rcq: null, risk: null, color: "text-muted-foreground" };
  const rcq = Math.round((cintura / quadril) * 100) / 100;
  const isMale = sexo === "M" || sexo === "masculino";
  let risk = "Normal", color = "text-success";
  if (isMale && rcq > 0.90) { risk = "Elevado"; color = "text-destructive"; }
  else if (!isMale && rcq > 0.85) { risk = "Elevado"; color = "text-destructive"; }
  else if ((isMale && rcq > 0.85) || (!isMale && rcq > 0.80)) { risk = "Moderado"; color = "text-warning"; }
  return { rcq, risk, color };
}

function calcCMB(circBraco: number | null, dobraTriceps: number | null) {
  if (!circBraco || !dobraTriceps) return null;
  return Math.round((circBraco - Math.PI * (dobraTriceps / 10)) * 100) / 100;
}

function calcBodyFat(form: Record<string, any>, sexo: string | null, age: number) {
  const proto = form.protocolo_dobras;
  if (!proto || !form.peso) return { pctGordura: null, density: null };
  const isMale = sexo === "M" || sexo === "masculino";
  let density = 0;
  const g = (k: string) => Number(form[k]) || 0;

  switch (proto) {
    case "pollock3": {
      const sum = isMale
        ? g("dobra_peitoral") + g("dobra_abdominal") + g("dobra_coxa")
        : g("dobra_triceps") + g("dobra_suprailiaca") + g("dobra_coxa");
      if (!sum) return { pctGordura: null, density: null };
      density = isMale
        ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
        : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
      break;
    }
    case "pollock7": {
      const sum = g("dobra_peitoral") + g("dobra_axilar_media") + g("dobra_triceps") + g("dobra_subescapular") + g("dobra_abdominal") + g("dobra_suprailiaca") + g("dobra_coxa");
      if (!sum) return { pctGordura: null, density: null };
      density = isMale
        ? 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age
        : 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age;
      break;
    }
    case "petroski": {
      const sum = g("dobra_subescapular") + g("dobra_triceps") + g("dobra_suprailiaca") + g("dobra_panturrilha");
      if (!sum) return { pctGordura: null, density: null };
      density = isMale
        ? 1.10726863 - 0.00081201 * sum + 0.00000212 * sum * sum - 0.00041761 * age
        : 1.02902361 - 0.00067159 * sum + 0.00000242 * sum * sum - 0.00026073 * age;
      break;
    }
    case "guedes": {
      const sum = g("dobra_subescapular") + g("dobra_suprailiaca") + g("dobra_abdominal");
      if (!sum) return { pctGordura: null, density: null };
      density = isMale
        ? 1.17136 - 0.06706 * Math.log10(sum)
        : 1.16650 - 0.07063 * Math.log10(sum);
      break;
    }
    case "durnin": {
      const sum = g("dobra_biceps") + g("dobra_triceps") + g("dobra_subescapular") + g("dobra_suprailiaca");
      if (!sum) return { pctGordura: null, density: null };
      const logSum = Math.log10(sum);
      if (isMale) {
        if (age < 20) density = 1.1620 - 0.0630 * logSum;
        else if (age < 30) density = 1.1631 - 0.0632 * logSum;
        else if (age < 40) density = 1.1422 - 0.0544 * logSum;
        else if (age < 50) density = 1.1620 - 0.0700 * logSum;
        else density = 1.1715 - 0.0779 * logSum;
      } else {
        if (age < 20) density = 1.1549 - 0.0678 * logSum;
        else if (age < 30) density = 1.1599 - 0.0717 * logSum;
        else if (age < 40) density = 1.1423 - 0.0632 * logSum;
        else if (age < 50) density = 1.1333 - 0.0612 * logSum;
        else density = 1.1339 - 0.0645 * logSum;
      }
      break;
    }
    case "faulkner": {
      const sum = g("dobra_triceps") + g("dobra_subescapular") + g("dobra_suprailiaca") + g("dobra_abdominal");
      if (!sum) return { pctGordura: null, density: null };
      const pct = sum * 0.153 + 5.783;
      return { pctGordura: Math.round(pct * 10) / 10, density: null };
    }
    default:
      return { pctGordura: null, density: null };
  }

  if (density <= 0) return { pctGordura: null, density: null };
  const pct = (4.95 / density - 4.50) * 100; // Siri
  return { pctGordura: Math.round(pct * 10) / 10, density: Math.round(density * 10000) / 10000 };
}

function fatClassification(pct: number | null, sexo: string | null): { label: string; color: string } {
  if (pct === null) return { label: "—", color: "text-muted-foreground" };
  const isMale = sexo === "M" || sexo === "masculino";
  if (isMale) {
    if (pct < 6) return { label: "Muito baixo", color: "text-warning" };
    if (pct < 14) return { label: "Excelente", color: "text-success" };
    if (pct < 18) return { label: "Bom", color: "text-success" };
    if (pct < 25) return { label: "Acima da média", color: "text-warning" };
    return { label: "Elevado", color: "text-destructive" };
  }
  if (pct < 14) return { label: "Muito baixo", color: "text-warning" };
  if (pct < 21) return { label: "Excelente", color: "text-success" };
  if (pct < 25) return { label: "Bom", color: "text-success" };
  if (pct < 32) return { label: "Acima da média", color: "text-warning" };
  return { label: "Elevado", color: "text-destructive" };
}

// ─── Component ──────────────────────────────────────────────────────
export function AvaliacoesFisicasSection({ paciente }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [chartMetric, setChartMetric] = useState("peso");
  const [showPrevList, setShowPrevList] = useState(false);
  const [showExportPdf, setShowExportPdf] = useState(false);

  const age = calcAge(paciente.data_nascimento);

  useEffect(() => { loadAvaliacoes(); }, [paciente.id]);

  const loadAvaliacoes = async () => {
    const { data } = await supabase
      .from("avaliacoes_fisicas")
      .select("*")
      .eq("paciente_id", paciente.id)
      .order("data_avaliacao", { ascending: false });
    setAvaliacoes(data || []);
  };

  const newForm = () => {
    setForm({
      data_avaliacao: new Date().toISOString().split("T")[0],
      protocolo_dobras: null,
    });
    setEditId(null);
    setView("form");
  };

  const editForm = (av: any) => {
    setForm({ ...av });
    setEditId(av.id);
    setView("form");
  };

  const setField = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const previousAv = useMemo(() => {
    if (!editId) return avaliacoes[0] || null;
    const idx = avaliacoes.findIndex(a => a.id === editId);
    return idx >= 0 && idx < avaliacoes.length - 1 ? avaliacoes[idx + 1] : null;
  }, [avaliacoes, editId]);

  // Real-time calculations
  const imcCalc = calcIMC(Number(form.peso) || null, Number(form.altura) || null);
  const idealW = idealWeightRange(Number(form.altura) || null);
  const rcqCalc = calcRCQ(Number(form.circ_cintura) || null, Number(form.circ_quadril) || null, paciente.sexo);
  const cmb = calcCMB(Number(form.circ_braco_dir) || null, Number(form.dobra_triceps) || null);
  const bodyFat = calcBodyFat(form, paciente.sexo, age);
  const fatClass = fatClassification(bodyFat.pctGordura, paciente.sexo);
  const whr = (Number(form.circ_cintura) && Number(form.altura))
    ? Math.round((Number(form.circ_cintura) / Number(form.altura)) * 100) / 100
    : null;

  // Computed masses
  const massaGorda = (bodyFat.pctGordura && form.peso)
    ? Math.round(Number(form.peso) * bodyFat.pctGordura / 100 * 10) / 10 : null;
  const massaMagra = (massaGorda !== null && form.peso)
    ? Math.round((Number(form.peso) - massaGorda) * 10) / 10 : null;

  // Sum of folds
  const sumFolds = FOLD_FIELDS.reduce((s, f) => s + (Number(form[f.key]) || 0), 0);

  // ─── Save ─────────────────────────────────────────────────────────
  const saveAvaliacao = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = { ...form };
      // Computed fields
      if (imcCalc.imc) { payload.imc = imcCalc.imc; payload.classificacao_imc = imcCalc.class; }
      if (rcqCalc.rcq) payload.relacao_cintura_quadril = rcqCalc.rcq;
      if (bodyFat.pctGordura !== null) payload.percentual_gordura_dobras = bodyFat.pctGordura;
      if (massaGorda !== null) payload.massa_gorda_kg = massaGorda;
      if (massaMagra !== null) payload.massa_magra_kg = massaMagra;

      // Clean non-DB fields
      delete payload.id; delete payload.created_at; delete payload.updated_at;

      if (editId) {
        const { error } = await supabase.from("avaliacoes_fisicas").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        payload.paciente_id = paciente.id;
        payload.user_id = user.id;
        const { error } = await supabase.from("avaliacoes_fisicas").insert(payload as any);
        if (error) throw error;
      }
      toast({ title: "Avaliação salva!" });
      loadAvaliacoes();
      setView("list");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const deleteAvaliacao = async (id: string) => {
    await supabase.from("avaliacoes_fisicas").delete().eq("id", id);
    toast({ title: "Avaliação excluída" });
    loadAvaliacoes();
  };

  // ─── Chart data ───────────────────────────────────────────────────
  const chartData = useMemo(() =>
    [...avaliacoes].reverse().map(a => ({
      date: format(new Date(a.data_avaliacao), "dd/MM/yy"),
      value: a[chartMetric] ?? null,
    })).filter(d => d.value !== null),
    [avaliacoes, chartMetric]
  );

  const chartMetrics = [
    { value: "peso", label: "Peso" },
    { value: "imc", label: "IMC" },
    { value: "percentual_gordura_dobras", label: "% Gordura (dobras)" },
    { value: "massa_magra_kg", label: "Massa Magra" },
    { value: "circ_cintura", label: "Cintura" },
    { value: "circ_quadril", label: "Quadril" },
  ];

  // ─── LIST VIEW ────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" /> Avaliação Antropométrica
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCharts(true)}>
              <BarChart3 className="h-4 w-4 mr-1" /> Evolução
            </Button>
            <Button size="sm" onClick={newForm} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Nova Avaliação
            </Button>
          </div>
        </div>

        {avaliacoes.length === 0 ? (
          <Card className="border-border rounded-xl p-8 text-center">
            <Scale className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhuma avaliação registrada.</p>
            <Button className="mt-4" onClick={newForm}><Plus className="h-4 w-4 mr-1" /> Criar primeira</Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {avaliacoes.map((av, idx) => {
              const prev = idx < avaliacoes.length - 1 ? avaliacoes[idx + 1] : null;
              return (
                <Card key={av.id} className="border-border rounded-xl hover:shadow-md transition cursor-pointer" onClick={() => editForm(av)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-lg p-2">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{format(new Date(av.data_avaliacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {av.peso && <span>{av.peso} kg</span>}
                          {av.imc && <span>IMC {av.imc}</span>}
                          {av.percentual_gordura_dobras && <span>%GC {av.percentual_gordura_dobras}%</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {prev && av.peso && prev.peso && (
                        <DeltaBadge current={av.peso} previous={prev.peso} unit="kg" invert />
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Charts Modal */}
        <Dialog open={showCharts} onOpenChange={setShowCharts}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Gráficos de Evolução</DialogTitle></DialogHeader>
            <Select value={chartMetric} onValueChange={setChartMetric}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {chartMetrics.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-sm text-muted-foreground py-8">Sem dados para exibir.</p>}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── FORM VIEW (two-column) ───────────────────────────────────────
  const usedFields = form.protocolo_dobras ? PROTOCOLS[form.protocolo_dobras]?.fields || [] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView("list")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground">Avaliação Antropométrica</h2>
            <p className="text-xs text-muted-foreground">
              Data: {form.data_avaliacao ? format(new Date(form.data_avaliacao + "T12:00"), "dd/MM/yyyy") : "—"} | {paciente.nome_completo}, {age} anos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {editId && (
            <Button variant="destructive" size="sm" onClick={() => { deleteAvaliacao(editId); setView("list"); }}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          )}
          <Button size="sm" onClick={saveAvaliacao} disabled={saving} className="bg-primary text-primary-foreground">
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-3">
          <Accordion type="multiple" defaultValue={["dados-basicos"]} className="space-y-3">
            {/* Section 1 — Basic */}
            <AccordionItem value="dados-basicos" className="border border-border rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                  Dados Antropométricos Básicos
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <FormField label="Data" type="date" value={form.data_avaliacao || ""} onChange={v => setField("data_avaliacao", v)} />
                  <FormField label="Peso (kg)" value={form.peso || ""} onChange={v => setField("peso", v)} />
                  <FormField label="Altura (cm)" value={form.altura || ""} onChange={v => setField("altura", v)} />
                  <FormField label="Altura sentado (cm)" value={form.altura_sentado || ""} onChange={v => setField("altura_sentado", v)} hint="Opcional" />
                  <FormField label="Altura joelho (cm)" value={form.altura_joelho || ""} onChange={v => setField("altura_joelho", v)} hint="Opcional" />
                  <FormField label="Envergadura (cm)" value={form.envergadura || ""} onChange={v => setField("envergadura", v)} hint="Opcional" />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2 — Folds */}
            <AccordionItem value="dobras" className="border border-border rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                  Dobras Cutâneas (mm)
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Protocolo</Label>
                  <Select value={form.protocolo_dobras || ""} onValueChange={v => setField("protocolo_dobras", v)}>
                    <SelectTrigger className="h-11 rounded-lg bg-muted/50 mt-1">
                      <SelectValue placeholder="Selecione o protocolo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROTOCOLS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {FOLD_FIELDS.map(f => {
                    const isUsed = usedFields.includes(f.key);
                    return (
                      <div key={f.key} className={isUsed ? "ring-2 ring-primary/30 rounded-lg p-1" : ""}>
                        <FormField label={f.label} value={form[f.key] || ""} onChange={v => setField(f.key, v)}
                          highlight={isUsed} />
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3 — Circumferences */}
            <AccordionItem value="circunferencias" className="border border-border rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
                  Circunferências Corporais (cm)
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-xs text-muted-foreground mb-3">Importantes para calcular RCQ, CMB e outros indicadores.</p>
                <div className="grid grid-cols-2 gap-3">
                  {CIRC_FIELDS.map(f => (
                    <FormField key={f.key} label={f.label} value={form[f.key] || ""} onChange={v => setField(f.key, v)} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4 — Bone Diameter */}
            <AccordionItem value="diametro" className="border border-border rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
                  Diâmetro Ósseo (cm)
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Punho" value={form.diam_punho || ""} onChange={v => setField("diam_punho", v)} />
                  <FormField label="Fêmur" value={form.diam_femur || ""} onChange={v => setField("diam_femur", v)} />
                  <FormField label="Biacromial" value={form.diam_biacromial || ""} onChange={v => setField("diam_biacromial", v)} />
                  <FormField label="Bicrista ilíaca" value={form.diam_bicrista || ""} onChange={v => setField("diam_bicrista", v)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5 — Bioimpedance */}
            <AccordionItem value="bio" className="border border-border rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
                  Bioimpedância
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-xs text-muted-foreground mb-3">Preencha com os dados fornecidos pelo aparelho.</p>
                <div className="grid grid-cols-2 gap-3">
                  {BIO_FIELDS.map(f => (
                    <FormField key={f.key} label={`${f.label} (${f.unit})`} value={form[f.key] || ""} onChange={v => setField(f.key, v)} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 6 — Observations */}
            <AccordionItem value="obs" className="border border-border rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">6</span>
                  Observações
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <Textarea value={form.observacoes || ""} onChange={e => setField("observacoes", e.target.value)}
                  placeholder="Observações da avaliação..." rows={4} className="rounded-lg bg-muted/50" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Full-width save */}
          <Button onClick={saveAvaliacao} disabled={saving}
            className="w-full h-[52px] rounded-xl bg-primary text-primary-foreground text-base font-semibold mt-4">
            <Save className="h-5 w-5 mr-2" /> Salvar Avaliação
          </Button>
        </div>

        {/* RIGHT COLUMN — Results */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-4">
            {/* Pesos e Medidas */}
            <Card className="border-border rounded-xl shadow-sm border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" /> Pesos e Medidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <ResultRow label="Peso atual" value={form.peso ? `${form.peso} kg` : "—"} />
                <ResultRow label="Altura" value={form.altura ? `${form.altura} cm` : "—"} />
                <ResultRow label="IMC" value={imcCalc.imc ? String(imcCalc.imc) : "—"} />
                <ResultRow label="Classificação IMC" value={imcCalc.class || "—"} className={imcCalc.color} />
                <ResultRow label="Faixa de peso ideal" value={idealW ? `${idealW.min} a ${idealW.max} kg` : "—"} />
                <ResultRow label="RCQ" value={rcqCalc.rcq ? String(rcqCalc.rcq) : "—"} />
                <ResultRow label="Risco metabólico (RCQ)" value={rcqCalc.risk || "—"} className={rcqCalc.color} />
                <ResultRow label="CMB" value={cmb ? `${cmb} cm` : "—"} />
                <ResultRow label="Rel. Cintura/Estatura" value={whr ? String(whr) : "—"} />
              </CardContent>
            </Card>

            {/* Dobras */}
            <Card className="border-border rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Dobras e Composição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <ResultRow label="% Gordura" value={bodyFat.pctGordura !== null ? `${bodyFat.pctGordura}%` : "—"} />
                <ResultRow label="Classificação %GC" value={fatClass.label} className={fatClass.color} />
                <ResultRow label="Massa de gordura" value={massaGorda !== null ? `${massaGorda} kg` : "—"} />
                <ResultRow label="Massa magra" value={massaMagra !== null ? `${massaMagra} kg` : "—"} />
                <ResultRow label="Somatório de dobras" value={sumFolds > 0 ? `${sumFolds} mm` : "—"} />
                <ResultRow label="Densidade corporal" value={bodyFat.density ? String(bodyFat.density) : "—"} />
                <ResultRow label="Protocolo" value={form.protocolo_dobras ? PROTOCOLS[form.protocolo_dobras]?.label : "—"} small />
              </CardContent>
            </Card>

            {/* Bioimpedance */}
            {(form.bio_percentual_gordura || form.bio_massa_muscular) && (
              <Card className="border-border rounded-xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Bioimpedância
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {BIO_FIELDS.map(f => (
                    form[f.key] ? <ResultRow key={f.key} label={f.label} value={`${form[f.key]} ${f.unit}`} /> : null
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Comparison */}
            {previousAv && (
              <Card className="border-border rounded-xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Comparativo com Anterior</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(previousAv.data_avaliacao), "dd/MM/yyyy")}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {[
                      { label: "Peso", key: "peso", unit: "kg", invert: true },
                      { label: "IMC", key: "imc", unit: "", invert: true },
                      { label: "Cintura", key: "circ_cintura", unit: "cm", invert: true },
                      { label: "Quadril", key: "circ_quadril", unit: "cm", invert: false },
                      { label: "% Gordura", key: "percentual_gordura_dobras", unit: "%", invert: true },
                      { label: "Massa Magra", key: "massa_magra_kg", unit: "kg", invert: false },
                    ].map(({ label, key, unit, invert }) => {
                      const cur = Number(form[key]) || null;
                      const prev = Number(previousAv[key]) || null;
                      return (
                        <div key={key} className="flex items-center justify-between py-2 border-b border-border/30 text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground/60 w-14 text-right">{prev ?? "—"}</span>
                            <span className="font-medium w-14 text-right">{cur ?? "—"}</span>
                            {cur !== null && prev !== null && <DeltaBadge current={cur} previous={prev} unit={unit} invert={invert} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────
function FormField({ label, value, onChange, hint, type = "number", highlight }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; type?: string; highlight?: boolean;
}) {
  return (
    <div>
      <Label className={`text-xs font-medium ${highlight ? "text-primary" : "text-muted-foreground"}`}>
        {label}{hint && <span className="ml-1 text-[10px] opacity-60">({hint})</span>}
      </Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="h-11 rounded-lg bg-muted/50 border-border mt-1" />
    </div>
  );
}

function ResultRow({ label, value, className = "", small }: { label: string; value: string; className?: string; small?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0 hover:bg-accent/20 px-2 -mx-2 rounded transition">
      <span className={`${small ? "text-xs" : "text-xs"} text-muted-foreground`}>{label}</span>
      <span className={`font-medium text-xs ${className || "text-foreground"}`}>{value}</span>
    </div>
  );
}

function DeltaBadge({ current, previous, unit, invert }: { current: number; previous: number; unit: string; invert?: boolean }) {
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff === 0) return <Badge variant="secondary" className="text-[10px] px-1.5">= 0</Badge>;
  const isPositive = diff > 0;
  const isGood = invert ? !isPositive : isPositive;
  return (
    <Badge className={`text-[10px] px-1.5 ${isGood ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}`} variant="outline">
      {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
      {isPositive ? "+" : ""}{diff}{unit}
    </Badge>
  );
}
