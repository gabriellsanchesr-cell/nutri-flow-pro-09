import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Scale, Calendar, Utensils, TrendingUp } from "lucide-react";
import { format, subDays, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardData {
  totalPacientes: number;
  retornoPendente: number;
  semPesoSemana: number;
  proximasConsultas: Array<{ id: string; paciente_nome: string; data_hora: string; tipo: string }>;
  ultimosAcompanhamentos: Array<{ id: string; paciente_nome: string; data_registro: string; peso: number | null }>;
}

const cardStyles = [
  { gradient: "from-primary/20 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary" },
  { gradient: "from-warning/20 to-warning/5", iconBg: "bg-warning/15", iconColor: "text-warning" },
  { gradient: "from-destructive/20 to-destructive/5", iconBg: "bg-destructive/15", iconColor: "text-destructive" },
  { gradient: "from-success/20 to-success/5", iconBg: "bg-success/15", iconColor: "text-success" },
];

function formatRelativeDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Hoje, ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Amanhã, ${format(d, "HH:mm")}`;
  return format(d, "dd/MM HH:mm", { locale: ptBR });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    totalPacientes: 0,
    retornoPendente: 0,
    semPesoSemana: 0,
    proximasConsultas: [],
    ultimosAcompanhamentos: [],
  });

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    const [pacientesRes, consultasRes, acompRes] = await Promise.all([
      supabase.from("pacientes").select("id, nome_completo").eq("ativo", true),
      supabase.from("consultas").select("id, data_hora, tipo, paciente_id, pacientes(nome_completo)").gte("data_hora", new Date().toISOString()).eq("status", "agendado").order("data_hora").limit(5),
      supabase.from("acompanhamentos").select("id, data_registro, peso, paciente_id, pacientes(nome_completo)").order("created_at", { ascending: false }).limit(5),
    ]);

    const pacientes = pacientesRes.data || [];
    const consultas = consultasRes.data || [];
    const acompanhamentos = acompRes.data || [];

    const trintaDias = subDays(new Date(), 30).toISOString();
    const { data: consultasRecentes } = await supabase
      .from("consultas")
      .select("paciente_id")
      .gte("data_hora", trintaDias)
      .eq("status", "realizado");

    const idsComConsulta = new Set((consultasRecentes || []).map((c: any) => c.paciente_id));
    const retornoPendente = pacientes.filter((p) => !idsComConsulta.has(p.id)).length;

    const inicioSemana = subDays(new Date(), 7).toISOString().split("T")[0];
    const { data: pesosRecentes } = await supabase
      .from("acompanhamentos")
      .select("paciente_id")
      .gte("data_registro", inicioSemana);
    const idsComPeso = new Set((pesosRecentes || []).map((a: any) => a.paciente_id));
    const semPesoSemana = pacientes.filter((p) => !idsComPeso.has(p.id)).length;

    setData({
      totalPacientes: pacientes.length,
      retornoPendente,
      semPesoSemana,
      proximasConsultas: consultas.map((c: any) => ({
        id: c.id,
        paciente_nome: c.pacientes?.nome_completo || "—",
        data_hora: c.data_hora,
        tipo: c.tipo,
      })),
      ultimosAcompanhamentos: acompanhamentos.map((a: any) => ({
        id: a.id,
        paciente_nome: a.pacientes?.nome_completo || "—",
        data_registro: a.data_registro,
        peso: a.peso,
      })),
    });
  };

  const cards = [
    { title: "Pacientes Ativos", value: data.totalPacientes, icon: Users },
    { title: "Retorno Pendente", value: data.retornoPendente, icon: AlertTriangle },
    { title: "Sem Peso na Semana", value: data.semPesoSemana, icon: Scale },
    { title: "Próximas Consultas", value: data.proximasConsultas.length, icon: Calendar },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting}! 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Card key={card.title} className="hover-card border-0 shadow-sm overflow-hidden">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${cardStyles[i].iconBg}`}>
                <card.icon className={`h-5 w-5 ${cardStyles[i].iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Próximas Consultas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.proximasConsultas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma consulta agendada</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.proximasConsultas.map((c) => (
                  <div key={c.id} className="flex justify-between items-center py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-foreground">{c.paciente_nome}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.tipo.replace("_", " ")}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">
                      {formatRelativeDate(c.data_hora)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Últimos Acompanhamentos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.ultimosAcompanhamentos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum acompanhamento registrado</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.ultimosAcompanhamentos.map((a) => (
                  <div key={a.id} className="flex justify-between items-center py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-foreground">{a.paciente_nome}</p>
                      <p className="text-xs text-muted-foreground">{a.data_registro}</p>
                    </div>
                    {a.peso && (
                      <span className="text-sm font-semibold text-foreground bg-primary/10 px-2 py-1 rounded-md">
                        {a.peso} kg
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
