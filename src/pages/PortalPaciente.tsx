import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, Home, Utensils, BookMarked, Target, MoreHorizontal,
  ChevronDown, ChevronUp, Clock, Download, User, Activity,
  UtensilsCrossed, FolderOpen, MessageSquare,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type PortalTab = "inicio" | "plano" | "diario" | "metas" | "mais";
type MoreTab = "avaliacoes" | "receitas" | "materiais" | "mensagens" | "perfil";

const tipoRefeicaoLabels: Record<string, string> = {
  cafe_da_manha: "Café da Manhã", lanche_da_manha: "Lanche da Manhã", almoco: "Almoço",
  lanche_da_tarde: "Lanche da Tarde", jantar: "Jantar", ceia: "Ceia",
};

export default function PortalPaciente() {
  const { user, signOut } = useAuth();
  const [paciente, setPaciente] = useState<any>(null);
  const [plano, setPlano] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PortalTab>("inicio");
  const [moreTab, setMoreTab] = useState<MoreTab | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

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
    if (moreTab) {
      return renderMoreContent();
    }
    switch (activeTab) {
      case "inicio": return renderInicio();
      case "plano": return renderPlano();
      case "diario": return renderPlaceholder("Diário Alimentar", "Em breve você poderá registrar suas refeições aqui.");
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

      {/* Quick stats */}
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

      {/* Active plan card */}
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

      {/* Fase */}
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

        {/* Macro summary */}
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
                    <div><p className="text-lg font-bold text-blue-500">{Math.round(p)}g</p><p className="text-[10px] text-muted-foreground">Proteína</p></div>
                    <div><p className="text-lg font-bold text-orange-500">{Math.round(c)}g</p><p className="text-[10px] text-muted-foreground">Carb</p></div>
                    <div><p className="text-lg font-bold text-yellow-500">{Math.round(g)}g</p><p className="text-[10px] text-muted-foreground">Gordura</p></div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Meals */}
        {sortedRefeicoes.map((ref: any) => {
          const isExp = expandedMeal === ref.id;
          const mealKcal = ref.alimentos_plano?.reduce((a: number, al: any) => a + (al.energia_kcal || 0), 0) || 0;
          return (
            <Card key={ref.id} className="rounded-2xl overflow-hidden">
              <button
                className="w-full text-left p-4 flex items-center justify-between"
                onClick={() => setExpandedMeal(isExp ? null : ref.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Utensils className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{tipoRefeicaoLabels[ref.tipo] || ref.tipo}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {(ref as any).horario_sugerido && (
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {(ref as any).horario_sugerido}</span>
                      )}
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

  const renderMoreContent = () => {
    switch (moreTab) {
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
        moreTab === "avaliacoes" ? "Avaliações" :
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
      {/* Header */}
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

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {renderContent()}
      </main>

      {/* Bottom navigation */}
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
