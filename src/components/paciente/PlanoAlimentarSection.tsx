import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Utensils, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tipoRefeicaoLabels: Record<string, string> = {
  cafe_da_manha: "Café da Manhã", lanche_da_manha: "Lanche da Manhã", almoco: "Almoço",
  lanche_da_tarde: "Lanche da Tarde", jantar: "Jantar", ceia: "Ceia",
};

interface Props {
  paciente: any;
}

export function PlanoAlimentarSection({ paciente }: Props) {
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refeicoes, setRefeicoes] = useState<Record<string, any[]>>({});
  const navigate = useNavigate();

  useEffect(() => { loadPlanos(); }, [paciente.id]);

  const loadPlanos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("planos_alimentares")
      .select("*")
      .eq("paciente_id", paciente.id)
      .eq("is_template", false)
      .order("created_at", { ascending: false });
    setPlanos(data || []);
    setLoading(false);
  };

  const toggleExpand = async (planoId: string) => {
    if (expanded === planoId) { setExpanded(null); return; }
    setExpanded(planoId);
    if (!refeicoes[planoId]) {
      const { data: refs } = await supabase
        .from("refeicoes")
        .select("*, alimentos_plano(*)")
        .eq("plano_id", planoId)
        .order("ordem", { ascending: true });
      setRefeicoes(prev => ({ ...prev, [planoId]: refs || [] }));
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando planos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Planos Alimentares</h3>
        <Button size="sm" onClick={() => navigate("/planos")}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Novo Plano
        </Button>
      </div>

      {planos.length === 0 ? (
        <Card className="border-border rounded-xl">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum plano alimentar cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        planos.map(plano => (
          <Card key={plano.id} className="border-border rounded-xl">
            <CardHeader className="cursor-pointer pb-3" onClick={() => toggleExpand(plano.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{plano.nome}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(plano.created_at).toLocaleDateString("pt-BR")}
                  </Badge>
                </div>
                {expanded === plano.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {plano.observacoes && <p className="text-xs text-muted-foreground mt-1">{plano.observacoes}</p>}
            </CardHeader>
            {expanded === plano.id && refeicoes[plano.id] && (
              <CardContent className="pt-0 space-y-3">
                {refeicoes[plano.id].map((ref: any) => {
                  const alimentos = ref.alimentos_plano || [];
                  const totalKcal = alimentos.reduce((a: number, al: any) => a + (al.energia_kcal || 0), 0);
                  return (
                    <div key={ref.id} className="border border-border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{tipoRefeicaoLabels[ref.tipo] || ref.tipo}</span>
                        <span className="text-xs text-muted-foreground">{Math.round(totalKcal)} kcal</span>
                      </div>
                      {alimentos.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem alimentos cadastrados.</p>
                      ) : (
                        <div className="space-y-1">
                          {alimentos.map((al: any) => (
                            <div key={al.id} className="flex justify-between text-xs">
                              <span>{al.nome_alimento} — {al.quantidade}g ({al.medida_caseira})</span>
                              <span className="text-muted-foreground">{Math.round(al.energia_kcal || 0)} kcal</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
