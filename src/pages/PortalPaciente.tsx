import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PortalDiario } from "@/components/portal/PortalDiario";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, Home, Utensils, BookMarked, Target, MoreHorizontal,
  ChevronDown, ChevronUp, Clock, User, Activity,
  UtensilsCrossed, FolderOpen, MessageSquare, Scale, TrendingUp, TrendingDown, Minus, ArrowLeft,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type PortalTab = "inicio" | "plano" | "diario" | "metas" | "mais";
type MoreTab = "avaliacoes" | "receitas" | "materiais" | "mensagens" | "perfil";

const tipoRefeicaoLabels: Record<string, string> = {
  cafe_da_manha: "Café da Manhã", lanche_da_manha: "Lanche da Manhã", almoco: "Almoço",
  lanche_da_tarde: "Lanche da Tarde", jantar: "Jantar", ceia: "Ceia",
};

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

  // Avaliacoes state
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
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

  const renderContent = () => {
    if (moreTab) return renderMoreContent();
    switch (activeTab) {
      case "inicio": return renderInicio();
      case "plano": return renderPlano();
      case "diario": return <PortalDiario paciente={paciente} />;
      case "metas": return renderPlaceholder("Metas", "Suas metas aparecerão aqui quando o nutricionista configurá-las.");
      default: return null;
    }
  };

  const renderInicio = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Olá, {paciente.nome_completo.split(" ")[0]}! 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seu progresso nutricional</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{paciente.peso_inicial || "—"}</p>
            <p className="text-xs text-muted-foreground">Peso inicial (kg)</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{Math.round(totalDiario)}</p>
            <p className="text-xs text-muted-foreground">Kcal/dia no plano</p>
          </CardContent>
        </Card>
      </div>
      {plano ? (
        <Card className="rounded-2xl border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Plano Ativo</CardTitle>
              <Badge className="text-xs">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-foreground">{plano.nome}</p>
            <p className="text-xs text-muted-foreground mt-1">{plano.refeicoes?.length || 0} refeições configuradas</p>
            <Button size="sm" className="mt-3 w-full rounded-lg" onClick={() => { setActiveTab("plano"); setMoreTab(null); }}>
              <Utensils className="h-3.5 w-3.5 mr-1" /> Ver Plano Completo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="py-6 text-center text-muted-foreground text-sm">
            <Utensils className="h-6 w-6 mx-auto mb-2 opacity-40" />
            Seu plano alimentar será enviado em breve pelo nutricionista.
          </CardContent>
        </Card>
      )}
      {paciente.fase_real && (
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Fase Atual</p>
            <p className="font-semibold text-foreground capitalize mt-1">{paciente.fase_real}</p>
            <p className="text-xs text-muted-foreground mt-1">Método R.E.A.L.</p>
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

    // Weight evolution chart data
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
            {/* Weight chart */}
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

            {/* Comparison card: latest vs previous */}
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

            {/* List */}
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

  const renderMoreContent = () => {
    switch (moreTab) {
      case "avaliacoes": return renderAvaliacoes();
      case "perfil": return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Meu Perfil</h2>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-sm space-y-2">
              <p><span className="text-muted-foreground">Nome:</span> {paciente.nome_completo}</p>
              <p><span className="text-muted-foreground">E-mail:</span> {paciente.email || "—"}</p>
              <p><span className="text-muted-foreground">Telefone:</span> {paciente.telefone || "—"}</p>
              <p><span className="text-muted-foreground">Objetivo:</span> {paciente.objetivo?.replace(/_/g, " ") || "—"}</p>
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      );
      default: return renderPlaceholder(
        moreTab === "receitas" ? "Receitas" :
        moreTab === "materiais" ? "Materiais" : "Mensagens",
        "Este recurso estará disponível em breve."
      );
    }
  };

  const renderPlaceholder = (title: string, desc: string) => (
    <div className="text-center py-12 text-muted-foreground">
      <p className="font-medium text-lg">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
    </div>
  );

  const moreItems = [
    { id: "avaliacoes" as MoreTab, label: "Avaliações", icon: Activity },
    { id: "receitas" as MoreTab, label: "Receitas", icon: UtensilsCrossed },
    { id: "materiais" as MoreTab, label: "Materiais", icon: FolderOpen },
    { id: "mensagens" as MoreTab, label: "Mensagens", icon: MessageSquare },
    { id: "perfil" as MoreTab, label: "Perfil", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <h1 className="text-sm font-bold text-foreground">Gabriel Sanches</h1>
            <p className="text-[10px] text-muted-foreground">Nutrição Individualizada</p>
          </div>
        </div>
        {moreTab && (
          <Button variant="ghost" size="sm" onClick={() => setMoreTab(null)} className="text-xs">
            ← Voltar
          </Button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-50">
        <div className="flex items-center justify-around py-2">
          <NavBtn icon={Home} label="Início" active={activeTab === "inicio" && !moreTab} onClick={() => { setActiveTab("inicio"); setMoreTab(null); }} />
          <NavBtn icon={Utensils} label="Plano" active={activeTab === "plano" && !moreTab} onClick={() => { setActiveTab("plano"); setMoreTab(null); }} />
          <NavBtn icon={BookMarked} label="Diário" active={activeTab === "diario" && !moreTab} onClick={() => { setActiveTab("diario"); setMoreTab(null); }} />
          <NavBtn icon={Target} label="Metas" active={activeTab === "metas" && !moreTab} onClick={() => { setActiveTab("metas"); setMoreTab(null); }} />
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-0.5 px-3 py-1">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
              <div className="grid grid-cols-3 gap-4 py-4">
                {moreItems.map(item => (
                  <button
                    key={item.id}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    onClick={() => { setMoreTab(item.id); setActiveTab("mais"); }}
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
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
    <button className="flex flex-col items-center gap-0.5 px-3 py-1" onClick={onClick}>
      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <span className={`text-[10px] ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>{label}</span>
    </button>
  );
}
