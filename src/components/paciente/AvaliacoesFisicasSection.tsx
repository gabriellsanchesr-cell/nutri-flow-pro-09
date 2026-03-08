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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, ArrowLeft, Save, Trash2, TrendingUp, TrendingDown, Minus,
  Scale, Ruler, Activity, BarChart3, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Avaliacao = {
  id: string;
  paciente_id: string;
  user_id: string;
  data_avaliacao: string;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  classificacao_imc: string | null;
  circ_cintura: number | null;
  circ_quadril: number | null;
  relacao_cintura_quadril: number | null;
  circ_braco_dir: number | null;
  circ_braco_esq: number | null;
  circ_coxa_dir: number | null;
  circ_coxa_esq: number | null;
  circ_panturrilha: number | null;
  circ_torax: number | null;
  dobra_subescapular: number | null;
  dobra_triceps: number | null;
  dobra_biceps: number | null;
  dobra_peitoral: number | null;
  dobra_abdominal: number | null;
  dobra_suprailiaca: number | null;
  dobra_coxa: number | null;
  protocolo_dobras: string | null;
  percentual_gordura_dobras: number | null;
  massa_gorda_kg: number | null;
  massa_magra_kg: number | null;
  bio_percentual_gordura: number | null;
  bio_massa_gorda: number | null;
  bio_massa_muscular: number | null;
  bio_agua_corporal: number | null;
  bio_metabolismo_basal: number | null;
  bio_idade_metabolica: number | null;
  observacoes: string | null;
  created_at: string;
};

const emptyForm = (): Partial<Avaliacao> => ({
  data_avaliacao: new Date().toISOString().split("T")[0],
  peso: null, altura: null,
  circ_cintura: null, circ_quadril: null,
  circ_braco_dir: null, circ_braco_esq: null,
  circ_coxa_dir: null, circ_coxa_esq: null,
  circ_panturrilha: null, circ_torax: null,
  dobra_subescapular: null, dobra_triceps: null, dobra_biceps: null,
  dobra_peitoral: null, dobra_abdominal: null, dobra_suprailiaca: null, dobra_coxa: null,
  protocolo_dobras: null,
  bio_percentual_gordura: null, bio_massa_gorda: null, bio_massa_muscular: null,
  bio_agua_corporal: null, bio_metabolismo_basal: null, bio_idade_metabolica: null,
  observacoes: null,
});

function calcIMC(peso: number | null, alturaCm: number | null) {
  if (!peso || !alturaCm) return { imc: null, classificacao: null };
  const alturaM = alturaCm / 100;
  const imc = peso / (alturaM * alturaM);
  let classificacao = "Normal";
  if (imc < 18.5) classificacao = "Baixo peso";
  else if (imc < 25) classificacao = "Normal";
  else if (imc < 30) classificacao = "Sobrepeso";
  else if (imc < 35) classificacao = "Obesidade I";
  else if (imc < 40) classificacao = "Obesidade II";
  else classificacao = "Obesidade III";
  return { imc: Math.round(imc * 100) / 100, classificacao };
}

function calcBodyFat(form: Partial<Avaliacao>, sexo: string | null) {
  const proto = form.protocolo_dobras;
  if (!proto || !form.peso) return { pctGordura: null, massaGorda: null, massaMagra: null };

  let somaDobras = 0;
  let density = 0;
  const isMale = sexo === "masculino" || sexo === "M";
  // Age approximation - would need birthdate for precision
  const age = 30;

  if (proto === "pollock_3") {
    if (isMale) {
      const t = (form.dobra_peitoral || 0) + (form.dobra_abdominal || 0) + (form.dobra_coxa || 0);
      if (!t) return { pctGordura: null, massaGorda: null, massaMagra: null };
      somaDobras = t;
      density = 1.10938 - 0.0008267 * somaDobras + 0.0000016 * somaDobras * somaDobras - 0.0002574 * age;
    } else {
      const t = (form.dobra_triceps || 0) + (form.dobra_suprailiaca || 0) + (form.dobra_coxa || 0);
      if (!t) return { pctGordura: null, massaGorda: null, massaMagra: null };
      somaDobras = t;
      density = 1.0994921 - 0.0009929 * somaDobras + 0.0000023 * somaDobras * somaDobras - 0.0001392 * age;
    }
  } else if (proto === "pollock_7") {
    const t = (form.dobra_peitoral || 0) + (form.dobra_abdominal || 0) + (form.dobra_coxa || 0) +
      (form.dobra_triceps || 0) + (form.dobra_subescapular || 0) + (form.dobra_suprailiaca || 0) + (form.dobra_biceps || 0);
    if (!t) return { pctGordura: null, massaGorda: null, massaMagra: null };
    somaDobras = t;
    if (isMale) {
      density = 1.112 - 0.00043499 * somaDobras + 0.00000055 * somaDobras * somaDobras - 0.00028826 * age;
    } else {
      density = 1.097 - 0.00046971 * somaDobras + 0.00000056 * somaDobras * somaDobras - 0.00012828 * age;
    }
  } else if (proto === "durnin") {
    const t = (form.dobra_biceps || 0) + (form.dobra_triceps || 0) + (form.dobra_subescapular || 0) + (form.dobra_suprailiaca || 0);
    if (!t) return { pctGordura: null, massaGorda: null, massaMagra: null };
    somaDobras = t;
    const logS = Math.log10(somaDobras);
    if (isMale) {
      density = 1.1765 - 0.0744 * logS;
    } else {
      density = 1.1567 - 0.0717 * logS;
    }
  } else {
    return { pctGordura: null, massaGorda: null, massaMagra: null };
  }

  const pctGordura = Math.round(((4.95 / density) - 4.5) * 1000) / 10;
  const massaGorda = Math.round(form.peso * (pctGordura / 100) * 10) / 10;
  const massaMagra = Math.round((form.peso - massaGorda) * 10) / 10;
  return { pctGordura, massaGorda, massaMagra };
}

function DeltaBadge({ current, previous, unit, inverse }: { current: number | null; previous: number | null; unit: string; inverse?: boolean }) {
  if (current == null || previous == null) return null;
  const diff = Math.round((current - previous) * 100) / 100;
  if (diff === 0) return <Badge variant="outline" className="text-xs gap-1"><Minus className="h-3 w-3" /> 0 {unit}</Badge>;
  const positive = diff > 0;
  const isGood = inverse ? !positive : positive;
  return (
    <Badge variant="outline" className={`text-xs gap-1 ${isGood ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-red-500 border-red-200 bg-red-50"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{diff} {unit}
    </Badge>
  );
}

function NumField({ label, value, onChange, suffix }: { label: string; value: number | null; onChange: (v: number | null) => void; suffix?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}{suffix ? ` (${suffix})` : ""}</Label>
      <Input
        type="number"
        step="0.1"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
        className="h-9"
      />
    </div>
  );
}

export function AvaliacoesFisicasSection({ paciente }: { paciente: any }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form" | "detail" | "charts">("list");
  const [form, setForm] = useState<Partial<Avaliacao>>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Avaliacao | null>(null);
  const [chartMetric, setChartMetric] = useState("peso");

  useEffect(() => { loadAvaliacoes(); }, [paciente.id]);

  const loadAvaliacoes = async () => {
    const { data } = await supabase
      .from("avaliacoes_fisicas")
      .select("*")
      .eq("paciente_id", paciente.id)
      .order("data_avaliacao", { ascending: false });
    setAvaliacoes((data as any) || []);
    setLoading(false);
  };

  // Auto-fill height from patient
  const openNewForm = () => {
    const f = emptyForm();
    f.altura = paciente.altura || null;
    setForm(f);
    setEditingId(null);
    setView("form");
  };

  const openEditForm = (av: Avaliacao) => {
    setForm({ ...av });
    setEditingId(av.id);
    setView("form");
  };

  // Auto-calc IMC
  const updateForm = (patch: Partial<Avaliacao>) => {
    setForm(prev => {
      const next = { ...prev, ...patch };
      const { imc, classificacao } = calcIMC(next.peso ?? null, next.altura ?? null);
      next.imc = imc;
      next.classificacao_imc = classificacao;

      // Auto-calc body fat from skinfolds
      if (next.protocolo_dobras) {
        const { pctGordura, massaGorda, massaMagra } = calcBodyFat(next, paciente.sexo);
        next.percentual_gordura_dobras = pctGordura;
        next.massa_gorda_kg = massaGorda;
        next.massa_magra_kg = massaMagra;
      }

      // Auto-calc waist-hip ratio
      if (next.circ_cintura && next.circ_quadril) {
        next.relacao_cintura_quadril = Math.round((next.circ_cintura / next.circ_quadril) * 100) / 100;
      }

      return next;
    });
  };

  const handleSave = async () => {
    if (!form.data_avaliacao) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        paciente_id: paciente.id,
        user_id: user!.id,
      };
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;

      if (editingId) {
        const { error } = await supabase.from("avaliacoes_fisicas").update(payload as any).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("avaliacoes_fisicas").insert(payload as any);
        if (error) throw error;
      }
      toast({ title: "Sucesso", description: "Avaliação salva." });
      await loadAvaliacoes();
      setView("list");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("avaliacoes_fisicas").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Excluída" });
      await loadAvaliacoes();
      setView("list");
    }
  };

  // Find previous avaliacao for comparison
  const getPrevious = (av: Avaliacao) => {
    const idx = avaliacoes.findIndex(a => a.id === av.id);
    return idx < avaliacoes.length - 1 ? avaliacoes[idx + 1] : null;
  };

  const chartData = useMemo(() => {
    return [...avaliacoes].reverse().map(a => ({
      data: format(new Date(a.data_avaliacao), "dd/MM", { locale: ptBR }),
      valor: (a as any)[chartMetric] ?? null,
    })).filter(d => d.valor !== null);
  }, [avaliacoes, chartMetric]);

  const metricOptions = [
    { value: "peso", label: "Peso (kg)" },
    { value: "imc", label: "IMC" },
    { value: "circ_cintura", label: "Cintura (cm)" },
    { value: "circ_quadril", label: "Quadril (cm)" },
    { value: "percentual_gordura_dobras", label: "% Gordura (Dobras)" },
    { value: "bio_percentual_gordura", label: "% Gordura (Bio)" },
    { value: "massa_magra_kg", label: "Massa Magra (kg)" },
  ];

  if (loading) return <div className="py-8 text-center text-muted-foreground">Carregando...</div>;

  // ========== DETAIL VIEW ==========
  if (view === "detail" && selectedDetail) {
    const prev = getPrevious(selectedDetail);
    const av = selectedDetail;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
          <h3 className="text-lg font-semibold text-foreground">
            Avaliação — {format(new Date(av.data_avaliacao), "dd/MM/yyyy")}
          </h3>
        </div>

        {/* Dados básicos */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Dados Básicos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Peso</p><p className="font-semibold">{av.peso ?? "—"} kg</p><DeltaBadge current={av.peso} previous={prev?.peso ?? null} unit="kg" inverse /></div>
            <div><p className="text-muted-foreground text-xs">Altura</p><p className="font-semibold">{av.altura ?? "—"} cm</p></div>
            <div><p className="text-muted-foreground text-xs">IMC</p><p className="font-semibold">{av.imc ?? "—"}</p><DeltaBadge current={av.imc} previous={prev?.imc ?? null} unit="" inverse /></div>
            <div><p className="text-muted-foreground text-xs">Classificação</p><Badge variant="outline" className="text-xs mt-0.5">{av.classificacao_imc || "—"}</Badge></div>
          </CardContent>
        </Card>

        {/* Medidas */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> Medidas Antropométricas</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { l: "Cintura", k: "circ_cintura" }, { l: "Quadril", k: "circ_quadril" }, { l: "Relação C/Q", k: "relacao_cintura_quadril" },
              { l: "Braço Dir.", k: "circ_braco_dir" }, { l: "Braço Esq.", k: "circ_braco_esq" },
              { l: "Coxa Dir.", k: "circ_coxa_dir" }, { l: "Coxa Esq.", k: "circ_coxa_esq" },
              { l: "Panturrilha", k: "circ_panturrilha" }, { l: "Tórax", k: "circ_torax" },
            ].map(({ l, k }) => (
              <div key={k}>
                <p className="text-muted-foreground text-xs">{l}</p>
                <p className="font-semibold">{(av as any)[k] ?? "—"} {k !== "relacao_cintura_quadril" ? "cm" : ""}</p>
                <DeltaBadge current={(av as any)[k]} previous={prev ? (prev as any)[k] : null} unit={k !== "relacao_cintura_quadril" ? "cm" : ""} inverse />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Dobras */}
        {av.protocolo_dobras && (
          <Card className="rounded-xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Dobras Cutâneas — {av.protocolo_dobras?.replace("_", " ")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  { l: "Subescapular", k: "dobra_subescapular" }, { l: "Tríceps", k: "dobra_triceps" },
                  { l: "Bíceps", k: "dobra_biceps" }, { l: "Peitoral", k: "dobra_peitoral" },
                  { l: "Abdominal", k: "dobra_abdominal" }, { l: "Suprailíaca", k: "dobra_suprailiaca" },
                  { l: "Coxa", k: "dobra_coxa" },
                ].map(({ l, k }) => (av as any)[k] != null ? (
                  <div key={k}><p className="text-muted-foreground text-xs">{l}</p><p className="font-semibold">{(av as any)[k]} mm</p></div>
                ) : null)}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t text-sm">
                <div><p className="text-muted-foreground text-xs">% Gordura</p><p className="font-bold text-lg">{av.percentual_gordura_dobras ?? "—"}%</p>
                  <DeltaBadge current={av.percentual_gordura_dobras} previous={prev?.percentual_gordura_dobras ?? null} unit="%" inverse />
                </div>
                <div><p className="text-muted-foreground text-xs">Massa Gorda</p><p className="font-semibold">{av.massa_gorda_kg ?? "—"} kg</p></div>
                <div><p className="text-muted-foreground text-xs">Massa Magra</p><p className="font-semibold">{av.massa_magra_kg ?? "—"} kg</p></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bio */}
        {av.bio_percentual_gordura != null && (
          <Card className="rounded-xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Bioimpedância</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-muted-foreground text-xs">% Gordura</p><p className="font-semibold">{av.bio_percentual_gordura}%</p></div>
              <div><p className="text-muted-foreground text-xs">Massa Gorda</p><p className="font-semibold">{av.bio_massa_gorda ?? "—"} kg</p></div>
              <div><p className="text-muted-foreground text-xs">Massa Muscular</p><p className="font-semibold">{av.bio_massa_muscular ?? "—"} kg</p></div>
              <div><p className="text-muted-foreground text-xs">Água Corporal</p><p className="font-semibold">{av.bio_agua_corporal ?? "—"}%</p></div>
              <div><p className="text-muted-foreground text-xs">Met. Basal</p><p className="font-semibold">{av.bio_metabolismo_basal ?? "—"} kcal</p></div>
              <div><p className="text-muted-foreground text-xs">Idade Metabólica</p><p className="font-semibold">{av.bio_idade_metabolica ?? "—"}</p></div>
            </CardContent>
          </Card>
        )}

        {av.observacoes && (
          <Card className="rounded-xl">
            <CardContent className="p-4 text-sm"><p className="text-muted-foreground text-xs mb-1">Observações</p><p>{av.observacoes}</p></CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditForm(av)}>Editar</Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(av.id)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir</Button>
        </div>
      </div>
    );
  }

  // ========== CHARTS VIEW ==========
  if (view === "charts") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
          <h3 className="text-lg font-semibold text-foreground">Gráficos de Evolução</h3>
        </div>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Evolução</CardTitle>
              <Select value={chartMetric} onValueChange={setChartMetric}>
                <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {metricOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 1 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="data" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">Necessário ao menos 2 avaliações para gerar gráfico.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== FORM VIEW ==========
  if (view === "form") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
          <h3 className="text-lg font-semibold text-foreground">{editingId ? "Editar" : "Nova"} Avaliação</h3>
        </div>

        <Tabs defaultValue="basico" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="basico" className="text-xs">Básico</TabsTrigger>
            <TabsTrigger value="medidas" className="text-xs">Medidas</TabsTrigger>
            <TabsTrigger value="dobras" className="text-xs">Dobras</TabsTrigger>
            <TabsTrigger value="bio" className="text-xs">Bio</TabsTrigger>
          </TabsList>

          <TabsContent value="basico" className="space-y-4 mt-4">
            <Card className="rounded-xl">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Data da Avaliação</Label>
                  <Input type="date" value={form.data_avaliacao || ""} onChange={e => updateForm({ data_avaliacao: e.target.value })} className="h-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Peso" value={form.peso ?? null} onChange={v => updateForm({ peso: v })} suffix="kg" />
                  <NumField label="Altura" value={form.altura ?? null} onChange={v => updateForm({ altura: v })} suffix="cm" />
                </div>
                {form.imc != null && (
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                    <div><p className="text-xs text-muted-foreground">IMC Calculado</p><p className="font-bold text-lg">{form.imc}</p></div>
                    <Badge variant="outline">{form.classificacao_imc}</Badge>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Observações clínicas</Label>
                  <Textarea value={form.observacoes || ""} onChange={e => updateForm({ observacoes: e.target.value })} rows={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medidas" className="space-y-4 mt-4">
            <Card className="rounded-xl">
              <CardContent className="p-4 grid grid-cols-2 gap-3">
                <NumField label="Cintura" value={form.circ_cintura ?? null} onChange={v => updateForm({ circ_cintura: v })} suffix="cm" />
                <NumField label="Quadril" value={form.circ_quadril ?? null} onChange={v => updateForm({ circ_quadril: v })} suffix="cm" />
                {form.relacao_cintura_quadril != null && (
                  <div className="col-span-2 bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Relação Cintura/Quadril</p>
                    <p className="font-bold">{form.relacao_cintura_quadril}</p>
                  </div>
                )}
                <NumField label="Braço Dir." value={form.circ_braco_dir ?? null} onChange={v => updateForm({ circ_braco_dir: v })} suffix="cm" />
                <NumField label="Braço Esq." value={form.circ_braco_esq ?? null} onChange={v => updateForm({ circ_braco_esq: v })} suffix="cm" />
                <NumField label="Coxa Dir." value={form.circ_coxa_dir ?? null} onChange={v => updateForm({ circ_coxa_dir: v })} suffix="cm" />
                <NumField label="Coxa Esq." value={form.circ_coxa_esq ?? null} onChange={v => updateForm({ circ_coxa_esq: v })} suffix="cm" />
                <NumField label="Panturrilha" value={form.circ_panturrilha ?? null} onChange={v => updateForm({ circ_panturrilha: v })} suffix="cm" />
                <NumField label="Tórax" value={form.circ_torax ?? null} onChange={v => updateForm({ circ_torax: v })} suffix="cm" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dobras" className="space-y-4 mt-4">
            <Card className="rounded-xl">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Protocolo de Cálculo</Label>
                  <Select value={form.protocolo_dobras || ""} onValueChange={v => updateForm({ protocolo_dobras: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar protocolo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pollock_3">Pollock 3 Dobras</SelectItem>
                      <SelectItem value="pollock_7">Pollock 7 Dobras</SelectItem>
                      <SelectItem value="durnin">Durnin & Womersley</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Subescapular" value={form.dobra_subescapular ?? null} onChange={v => updateForm({ dobra_subescapular: v })} suffix="mm" />
                  <NumField label="Tríceps" value={form.dobra_triceps ?? null} onChange={v => updateForm({ dobra_triceps: v })} suffix="mm" />
                  <NumField label="Bíceps" value={form.dobra_biceps ?? null} onChange={v => updateForm({ dobra_biceps: v })} suffix="mm" />
                  <NumField label="Peitoral" value={form.dobra_peitoral ?? null} onChange={v => updateForm({ dobra_peitoral: v })} suffix="mm" />
                  <NumField label="Abdominal" value={form.dobra_abdominal ?? null} onChange={v => updateForm({ dobra_abdominal: v })} suffix="mm" />
                  <NumField label="Suprailíaca" value={form.dobra_suprailiaca ?? null} onChange={v => updateForm({ dobra_suprailiaca: v })} suffix="mm" />
                  <NumField label="Coxa" value={form.dobra_coxa ?? null} onChange={v => updateForm({ dobra_coxa: v })} suffix="mm" />
                </div>
                {form.percentual_gordura_dobras != null && (
                  <div className="bg-muted/50 rounded-lg p-3 grid grid-cols-3 gap-3">
                    <div><p className="text-xs text-muted-foreground">% Gordura</p><p className="font-bold text-lg">{form.percentual_gordura_dobras}%</p></div>
                    <div><p className="text-xs text-muted-foreground">Massa Gorda</p><p className="font-bold">{form.massa_gorda_kg} kg</p></div>
                    <div><p className="text-xs text-muted-foreground">Massa Magra</p><p className="font-bold">{form.massa_magra_kg} kg</p></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bio" className="space-y-4 mt-4">
            <Card className="rounded-xl">
              <CardContent className="p-4 grid grid-cols-2 gap-3">
                <NumField label="% Gordura" value={form.bio_percentual_gordura ?? null} onChange={v => updateForm({ bio_percentual_gordura: v })} suffix="%" />
                <NumField label="Massa Gorda" value={form.bio_massa_gorda ?? null} onChange={v => updateForm({ bio_massa_gorda: v })} suffix="kg" />
                <NumField label="Massa Muscular" value={form.bio_massa_muscular ?? null} onChange={v => updateForm({ bio_massa_muscular: v })} suffix="kg" />
                <NumField label="Água Corporal" value={form.bio_agua_corporal ?? null} onChange={v => updateForm({ bio_agua_corporal: v })} suffix="%" />
                <NumField label="Met. Basal" value={form.bio_metabolismo_basal ?? null} onChange={v => updateForm({ bio_metabolismo_basal: v })} suffix="kcal" />
                <NumField label="Idade Metabólica" value={form.bio_idade_metabolica ?? null} onChange={v => updateForm({ bio_idade_metabolica: v })} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="rounded-lg">
            <Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : "Salvar Avaliação"}
          </Button>
          <Button variant="outline" onClick={() => setView("list")}>Cancelar</Button>
        </div>
      </div>
    );
  }

  // ========== LIST VIEW ==========
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Avaliações Físicas</h3>
        <div className="flex gap-2">
          {avaliacoes.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setView("charts")}>
              <BarChart3 className="h-4 w-4 mr-1" /> Gráficos
            </Button>
          )}
          <Button size="sm" onClick={openNewForm} className="rounded-lg">
            <Plus className="h-4 w-4 mr-1" /> Nova Avaliação
          </Button>
        </div>
      </div>

      {avaliacoes.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Scale className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma avaliação registrada</p>
            <p className="text-sm mt-1">Clique em "Nova Avaliação" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {avaliacoes.map((av, idx) => {
            const prev = idx < avaliacoes.length - 1 ? avaliacoes[idx + 1] : null;
            return (
              <Card key={av.id} className="rounded-xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedDetail(av); setView("detail"); }}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Scale className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {format(new Date(av.data_avaliacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {av.peso && <span>{av.peso} kg</span>}
                        {av.imc && <span>IMC {av.imc}</span>}
                        {av.percentual_gordura_dobras != null && <span>{av.percentual_gordura_dobras}% gord.</span>}
                        {av.circ_cintura && <span>Cintura {av.circ_cintura}cm</span>}
                      </div>
                      {prev && av.peso && prev.peso && (
                        <div className="mt-1">
                          <DeltaBadge current={av.peso} previous={prev.peso} unit="kg" inverse />
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
