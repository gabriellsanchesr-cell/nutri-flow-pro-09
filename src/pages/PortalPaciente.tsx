import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalDiario } from "@/components/portal/PortalDiario";
import { PortalJornada } from "@/components/portal/PortalJornada";
import { PortalReceitas } from "@/components/portal/PortalReceitas";
import { PortalChat } from "@/components/portal/PortalChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LogOut, Home, Utensils, BookMarked, Target, MoreHorizontal,
  ChevronDown, ChevronUp, Clock, User, Activity, Sparkles,
  UtensilsCrossed, FolderOpen, MessageSquare, Scale, TrendingUp, TrendingDown, Minus, ArrowLeft, Pill, FlaskConical,
  Bell, Flame, Weight, Zap, CalendarDays, ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type PortalTab = "inicio" | "plano" | "diario" | "metas" | "mais";
type MoreTab = "avaliacoes" | "receitas" | "materiais" | "mensagens" | "perfil" | "jornada" | "suplementos";

const tipoRefeicaoLabels: Record<string, string> = {
  cafe_da_manha: "Café da Manhã", lanche_da_manha: "Lanche da Manhã", almoco: "Almoço",
  lanche_da_tarde: "Lanche da Tarde", jantar: "Jantar", ceia: "Ceia",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function PortalDeltaBadge({ current, previous, unit, inverse }: { current: number | null; previous: number | null; unit: string; inverse?: boolean }) {
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

export default function PortalPaciente() {
  const { user, signOut } = useAuth();
  const [paciente, setPaciente] = useState<any>(null);
  const [plano, setPlano] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PortalTab>("inicio");
  const [moreTab, setMoreTab] = useState<MoreTab | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [portalPresc, setPortalPresc] = useState<any[]>([]);
  const [prescLoaded, setPrescLoaded] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<any>(null);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    const { data: pac } = await supabase
      .from("pacientes").select("*").eq("auth_user_id", user!.id).single();
    setPaciente(pac);
    if (pac) {
      const { data: planoData } = await supabase
        .from("planos_alimentares")
        .select("*, refeicoes(*, alimentos_plano(*))")
        .eq("paciente_id", pac.id)
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      setPlano(planoData);

      const { data: avData } = await supabase
        .from("avaliacoes_fisicas")
        .select("*")
        .eq("paciente_id", pac.id)
        .order("data_avaliacao", { ascending: false });
      setAvaliacoes((avData as any) || []);
    }
    setLoading(false);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 py-3 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </header>
        <main className="flex-1 px-4 py-4 space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-sm w-full rounded-2xl">
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Seu perfil de paciente ainda não foi vinculado.</p>
            <p className="text-sm mt-2">Entre em contato com seu nutricionista.</p>
            <Button variant="outline" className="mt-4" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDiario = plano?.refeicoes?.reduce((acc: number, r: any) =>
    acc + (r.alimentos_plano?.reduce((a: number, al: any) => a + (al.energia_kcal || 0), 0) || 0), 0
  ) || 0;

  const firstName = paciente.nome_completo.split(" ")[0];
  const initials = getInitials(paciente.nome_completo);

  const renderContent = () => {
    if (moreTab) return renderMoreContent();
    switch (activeTab) {
      case "inicio": return renderInicio();
      case "plano": return renderPlano();
      case "diario": return <PortalDiario paciente={paciente} />;
      case "metas": return renderPlaceholder("Metas", "Suas metas aparecerão aqui quando o nutricionista configurá-las.");
      case "mais": return renderMoreContent();
      default: return null;
    }
  };

  const renderInicio = () => (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-5 text-primary-foreground">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary-foreground/10" />
        <div className="absolute -right-2 -bottom-8 h-20 w-20 rounded-full bg-primary-foreground/5" />
        <div className="relative">
          <p className="text-sm font-medium opacity-90">{getGreeting()} 👋</p>
          <h2 className="text-xl font-bold mt-0.5">{firstName}</h2>
          <p className="text-xs mt-1 opacity-80">Acompanhe seu progresso nutricional</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="mx-auto h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center mb-1.5">
              <Weight className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-foreground">{paciente.peso_inicial || "—"}</p>
            <p className="text-[10px] text-muted-foreground">Peso (kg)</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="mx-auto h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center mb-1.5">
              <Flame className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-lg font-bold text-foreground">{Math.round(totalDiario)}</p>
            <p className="text-[10px] text-muted-foreground">Kcal/dia</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="mx-auto h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center mb-1.5">
              <Sparkles className="h-4 w-4 text-violet-600" />
            </div>
            <p className="text-lg font-bold text-foreground capitalize">{paciente.fase_real || "—"}</p>
            <p className="text-[10px] text-muted-foreground">Fase R.E.A.L.</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => { setActiveTab("plano"); setMoreTab(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 transition-colors shrink-0"
        >
          <Utensils className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Ver Plano</span>
        </button>
        <button
          onClick={() => { setActiveTab("diario"); setMoreTab(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/80 transition-colors shrink-0"
        >
          <BookMarked className="h-4 w-4 text-accent-foreground" />
          <span className="text-xs font-semibold text-accent-foreground">Registrar Diário</span>
        </button>
        <button
          onClick={() => { setMoreTab("mensagens"); setActiveTab("mais"); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/80 transition-colors shrink-0"
        >
          <MessageSquare className="h-4 w-4 text-accent-foreground" />
          <span className="text-xs font-semibold text-accent-foreground">Mensagens</span>
        </button>
      </div>

      {/* Active plan card */}
      {plano ? (
        <Card className="rounded-2xl overflow-hidden border-primary/20 shadow-sm">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Utensils className="h-4 w-4 text-primary" />
                Plano Ativo
              </CardTitle>
              <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500 hover:bg-emerald-500">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="font-semibold text-foreground">{plano.nome}</p>
            <p className="text-xs text-muted-foreground mt-1">{plano.refeicoes?.length || 0} refeições • {Math.round(totalDiario)} kcal/dia</p>
            <Button size="sm" className="mt-3 w-full rounded-xl" onClick={() => { setActiveTab("plano"); setMoreTab(null); }}>
              Ver Plano Completo
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            <Utensils className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Seu plano alimentar será enviado em breve pelo nutricionista.
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPlano = () => {
    if (!plano) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Utensils className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum plano ativo</p>
          <p className="text-sm mt-1">Seu plano alimentar será enviado em breve.</p>
        </div>
      );
    }
    const sortedRefeicoes = [...(plano.refeicoes || [])].sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-foreground">{plano.nome}</h2>
            <p className="text-xs text-muted-foreground">{Math.round(totalDiario)} kcal/dia</p>
          </div>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              {(() => {
                let p = 0, c = 0, g = 0;
                plano.refeicoes?.forEach((r: any) => r.alimentos_plano?.forEach((a: any) => {
                  p += a.proteina_g || 0; c += a.carboidrato_g || 0; g += a.lipidio_g || 0;
                }));
                return (
                  <>
                    <div><p className="text-lg font-bold text-primary">{Math.round(totalDiario)}</p><p className="text-[10px] text-muted-foreground">Kcal</p></div>
                    <div><p className="text-lg font-bold" style={{ color: "hsl(217, 91%, 60%)" }}>{Math.round(p)}g</p><p className="text-[10px] text-muted-foreground">Proteína</p></div>
                    <div><p className="text-lg font-bold" style={{ color: "hsl(25, 95%, 53%)" }}>{Math.round(c)}g</p><p className="text-[10px] text-muted-foreground">Carb</p></div>
                    <div><p className="text-lg font-bold" style={{ color: "hsl(48, 96%, 53%)" }}>{Math.round(g)}g</p><p className="text-[10px] text-muted-foreground">Gordura</p></div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
        {sortedRefeicoes.map((ref: any) => {
          const isExp = expandedMeal === ref.id;
          const mealKcal = ref.alimentos_plano?.reduce((a: number, al: any) => a + (al.energia_kcal || 0), 0) || 0;
          return (
            <Card key={ref.id} className="rounded-2xl overflow-hidden">
              <button className="w-full text-left p-4 flex items-center justify-between" onClick={() => setExpandedMeal(isExp ? null : ref.id)}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Utensils className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{tipoRefeicaoLabels[ref.tipo] || ref.tipo}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {ref.horario_sugerido && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {ref.horario_sugerido}</span>}
                      <span>{Math.round(mealKcal)} kcal</span>
                    </div>
                  </div>
                </div>
                {isExp ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isExp && (
                <div className="px-4 pb-4 space-y-2">
                  {ref.alimentos_plano?.map((ali: any) => (
                    <div key={ali.id} className="flex justify-between items-center py-1.5 border-t text-sm">
                      <div>
                        <p className="text-foreground">{ali.nome_alimento}</p>
                        <p className="text-xs text-muted-foreground">{ali.quantidade}g • {ali.medida_caseira}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{Math.round(ali.energia_kcal || 0)} kcal</span>
                    </div>
                  ))}
                  {ref.substituicoes_sugeridas && (
                    <div className="bg-muted/50 rounded-lg p-3 text-xs">
                      <p className="font-medium text-foreground mb-1">🔄 Substituições</p>
                      <p className="text-muted-foreground">{ref.substituicoes_sugeridas}</p>
                    </div>
                  )}
                  {ref.observacoes && (
                    <div className="bg-primary/5 rounded-lg p-3 text-xs">
                      <p className="font-medium text-foreground mb-1">📝 Observações</p>
                      <p className="text-muted-foreground">{ref.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {plano.observacoes && (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-foreground mb-1">Observações do nutricionista</p>
              <p className="text-sm text-muted-foreground">{plano.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderAvaliacoes = () => {
    if (selectedAvaliacao) {
      const av = selectedAvaliacao;
      const idx = avaliacoes.findIndex(a => a.id === av.id);
      const prev = idx < avaliacoes.length - 1 ? avaliacoes[idx + 1] : null;

      return (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedAvaliacao(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h2 className="text-lg font-bold text-foreground">
            Avaliação — {format(new Date(av.data_avaliacao), "dd/MM/yyyy")}
          </h2>

          <Card className="rounded-2xl">
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Peso</p>
                <p className="font-bold text-lg">{av.peso ?? "—"} kg</p>
                <PortalDeltaBadge current={av.peso} previous={prev?.peso} unit="kg" inverse />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">IMC</p>
                <p className="font-bold text-lg">{av.imc ?? "—"}</p>
                <Badge variant="outline" className="text-xs">{av.classificacao_imc || "—"}</Badge>
              </div>
              {av.circ_cintura && (
                <div><p className="text-muted-foreground text-xs">Cintura</p><p className="font-semibold">{av.circ_cintura} cm</p>
                  <PortalDeltaBadge current={av.circ_cintura} previous={prev?.circ_cintura} unit="cm" inverse />
                </div>
              )}
              {av.circ_quadril && (
                <div><p className="text-muted-foreground text-xs">Quadril</p><p className="font-semibold">{av.circ_quadril} cm</p></div>
              )}
              {(av.percentual_gordura_dobras != null || av.bio_percentual_gordura != null) && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">% Gordura Corporal</p>
                  <p className="font-bold text-lg">{av.percentual_gordura_dobras ?? av.bio_percentual_gordura}%</p>
                  <PortalDeltaBadge current={av.percentual_gordura_dobras ?? av.bio_percentual_gordura} previous={prev ? (prev.percentual_gordura_dobras ?? prev.bio_percentual_gordura) : null} unit="%" inverse />
                </div>
              )}
              {av.massa_magra_kg && (
                <div><p className="text-muted-foreground text-xs">Massa Magra</p><p className="font-semibold">{av.massa_magra_kg} kg</p></div>
              )}
              {av.massa_gorda_kg && (
                <div><p className="text-muted-foreground text-xs">Massa Gorda</p><p className="font-semibold">{av.massa_gorda_kg} kg</p></div>
              )}
            </CardContent>
          </Card>

          {av.observacoes && (
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-sm">
                <p className="text-muted-foreground text-xs mb-1">Observações</p>
                <p className="text-foreground">{av.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    const chartData = [...avaliacoes].reverse().map(a => ({
      data: format(new Date(a.data_avaliacao), "dd/MM", { locale: ptBR }),
      peso: a.peso,
    })).filter(d => d.peso != null);

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Minhas Avaliações</h2>

        {avaliacoes.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              <Scale className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Nenhuma avaliação registrada ainda.</p>
              <p className="text-xs mt-1">Seu nutricionista registrará suas avaliações aqui.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {chartData.length > 1 && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm">Evolução do Peso</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="data" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={["dataMin - 1", "dataMax + 1"]} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                        <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {avaliacoes.length >= 2 && (
              <Card className="rounded-2xl border-primary/20">
                <CardHeader className="pb-1"><CardTitle className="text-sm">Última vs Anterior</CardTitle></CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    {[
                      { l: "Peso", k: "peso", u: "kg" },
                      { l: "IMC", k: "imc", u: "" },
                      { l: "% Gordura", k: "percentual_gordura_dobras", u: "%" },
                    ].map(({ l, k, u }) => (
                      <div key={k}>
                        <p className="text-muted-foreground text-xs">{l}</p>
                        <p className="font-bold">{avaliacoes[0][k] ?? "—"}{u}</p>
                        <PortalDeltaBadge current={avaliacoes[0][k]} previous={avaliacoes[1][k]} unit={u} inverse />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {avaliacoes.map(av => (
              <Card key={av.id} className="rounded-2xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedAvaliacao(av)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Scale className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{format(new Date(av.data_avaliacao), "dd/MM/yyyy")}</p>
                      <p className="text-xs text-muted-foreground">
                        {av.peso && `${av.peso}kg`} {av.imc && `• IMC ${av.imc}`} {av.percentual_gordura_dobras != null && `• ${av.percentual_gordura_dobras}% gord.`}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    );
  };

  const loadPrescricoes = async () => {
    if (prescLoaded || !paciente) return;
    const { data } = await (supabase as any)
      .from("prescricoes_suplementos")
      .select("*, suplementos_banco(nome, tipo, categoria, apresentacao, manipulado_ativos(*))")
      .eq("paciente_id", paciente.id)
      .eq("ativa", true)
      .order("created_at", { ascending: false });
    setPortalPresc(data || []);
    setPrescLoaded(true);
  };

  const renderPortalSuplemenos = () => {
    if (!prescLoaded) { loadPrescricoes(); return <div className="text-center py-8 text-muted-foreground">Carregando...</div>; }
    if (portalPresc.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Pill className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium">Nenhum suplemento prescrito</p>
          <p className="text-sm mt-1">Seu nutricionista adicionará suas prescrições aqui.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Meus Suplementos</h2>
        {portalPresc.map((p: any) => {
          const sup = p.suplementos_banco;
          const remaining = p.data_fim ? differenceInDays(new Date(p.data_fim), new Date()) : null;
          const totalDays = p.data_fim && p.data_inicio ? differenceInDays(new Date(p.data_fim), new Date(p.data_inicio)) : null;
          const progress = remaining != null && totalDays ? Math.max(0, Math.min(100, ((totalDays - remaining) / totalDays) * 100)) : null;
          return (
            <Card key={p.id} className="rounded-2xl">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {sup?.tipo === "manipulado" ? <FlaskConical className="h-4 w-4 text-violet-500" /> : <Pill className="h-4 w-4 text-primary" />}
                  <span className="font-semibold text-foreground">{sup?.nome}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{p.dose_prescrita} {p.unidade_dose} — {p.frequencia}</p>
                <p className="text-sm text-muted-foreground">{p.momento_uso} • {p.duracao}</p>
                {remaining != null && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{remaining > 0 ? `${remaining} dias restantes` : "Encerrada"}</span>
                      {progress != null && <span>{Math.round(progress)}%</span>}
                    </div>
                    {progress != null && (
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                )}
                {p.observacoes_paciente && <p className="text-xs text-muted-foreground italic">{p.observacoes_paciente}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMoreContent = () => {
    switch (moreTab) {
      case "avaliacoes": return renderAvaliacoes();
      case "perfil": return renderPerfil();
      case "receitas": return <PortalReceitas paciente={paciente} />;
      case "mensagens": return <PortalChat paciente={paciente} />;
      case "jornada": return <PortalJornada paciente={paciente} />;
      case "suplementos": return renderPortalSuplemenos();
      default: return renderPlaceholder("Materiais", "Este recurso estará disponível em breve.");
    }
  };

  const renderPerfil = () => (
    <div className="space-y-5">
      {/* Avatar header */}
      <div className="flex flex-col items-center pt-2">
        <Avatar className="h-20 w-20 mb-3">
          <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-bold text-foreground">{paciente.nome_completo}</h2>
        <p className="text-sm text-muted-foreground">{paciente.email || ""}</p>
      </div>

      {/* Personal data card */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telefone</span>
            <span className="font-medium text-foreground">{paciente.telefone || "—"}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <span className="text-muted-foreground">Objetivo</span>
            <span className="font-medium text-foreground capitalize">{paciente.objetivo?.replace(/_/g, " ") || "—"}</span>
          </div>
          {paciente.data_nascimento && (
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Nascimento</span>
              <span className="font-medium text-foreground">{format(new Date(paciente.data_nascimento), "dd/MM/yyyy")}</span>
            </div>
          )}
          {paciente.sexo && (
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Sexo</span>
              <span className="font-medium text-foreground capitalize">{paciente.sexo}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="outline" className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" /> Sair da conta
      </Button>
    </div>
  );

  const renderPlaceholder = (title: string, desc: string) => (
    <div className="text-center py-12 text-muted-foreground">
      <p className="font-medium text-lg">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
    </div>
  );

  const moreItems: { id: MoreTab; label: string; icon: any; desc: string; color: string }[] = [
    { id: "avaliacoes", label: "Avaliações", icon: Activity, desc: "Medidas e composição", color: "bg-blue-100 text-blue-600" },
    { id: "receitas", label: "Receitas", icon: UtensilsCrossed, desc: "Receitas saudáveis", color: "bg-orange-100 text-orange-600" },
    { id: "suplementos", label: "Suplementos", icon: Pill, desc: "Prescrições ativas", color: "bg-violet-100 text-violet-600" },
    { id: "jornada", label: "Jornada", icon: Sparkles, desc: "Seu progresso", color: "bg-emerald-100 text-emerald-600" },
    { id: "mensagens", label: "Mensagens", icon: MessageSquare, desc: "Fale com o nutri", color: "bg-sky-100 text-sky-600" },
    { id: "perfil", label: "Perfil", icon: User, desc: "Seus dados", color: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header premium with glassmorphism */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">{getGreeting()}</p>
              <h1 className="text-sm font-bold text-foreground leading-tight">{firstName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {moreTab && (
              <Button variant="ghost" size="icon" onClick={() => setMoreTab(null)} className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {renderContent()}
      </main>

      {/* Bottom nav refined */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom z-50">
        <div className="flex items-center justify-around py-1.5 pb-2">
          <NavBtn icon={Home} label="Início" active={activeTab === "inicio" && !moreTab} onClick={() => { setActiveTab("inicio"); setMoreTab(null); }} />
          <NavBtn icon={Utensils} label="Plano" active={activeTab === "plano" && !moreTab} onClick={() => { setActiveTab("plano"); setMoreTab(null); }} />
          <NavBtn icon={BookMarked} label="Diário" active={activeTab === "diario" && !moreTab} onClick={() => { setActiveTab("diario"); setMoreTab(null); }} />
          <NavBtn icon={Target} label="Metas" active={activeTab === "metas" && !moreTab} onClick={() => { setActiveTab("metas"); setMoreTab(null); }} />
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[48px]">
                <MoreHorizontal className="h-[22px] w-[22px] text-muted-foreground transition-colors" />
                <span className="text-[10px] text-muted-foreground">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8">
              <SheetHeader className="pb-1">
                <SheetTitle className="text-base">Menu</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-3 pt-3">
                {moreItems.map(item => (
                  <button
                    key={item.id}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                    onClick={() => { setMoreTab(item.id); setActiveTab("mais"); }}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className="flex flex-col items-center gap-1 px-3 py-1.5 min-w-[48px] relative" onClick={onClick}>
      <Icon className={`h-[22px] w-[22px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
      <span className={`text-[10px] transition-colors ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>{label}</span>
      {active && (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
      )}
    </button>
  );
}
