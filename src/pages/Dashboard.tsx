import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Scale, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardData {
  totalPacientes: number;
  retornoPendente: number;
  semPesoSemana: number;
  proximasConsultas: Array<{ id: string; paciente_nome: string; data_hora: string; tipo: string }>;
  ultimosAcompanhamentos: Array<{ id: string; paciente_nome: string; data_registro: string; peso: number | null }>;
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

    // Retornos pendentes: pacientes sem consulta nos últimos 30 dias
    const trintaDias = subDays(new Date(), 30).toISOString();
    const { data: consultasRecentes } = await supabase
      .from("consultas")
      .select("paciente_id")
      .gte("data_hora", trintaDias)
      .eq("status", "realizado");

    const idsComConsulta = new Set((consultasRecentes || []).map((c: any) => c.paciente_id));
    const retornoPendente = pacientes.filter((p) => !idsComConsulta.has(p.id)).length;

    // Sem peso na semana
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
    { title: "Pacientes Ativos", value: data.totalPacientes, icon: Users, color: "text-primary" },
    { title: "Retorno Pendente", value: data.retornoPendente, icon: AlertTriangle, color: "text-warning" },
    { title: "Sem Peso na Semana", value: data.semPesoSemana, icon: Scale, color: "text-destructive" },
    { title: "Próximas Consultas", value: data.proximasConsultas.length, icon: Calendar, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-xl bg-accent p-3 ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximas Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            {data.proximasConsultas.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma consulta agendada</p>
            ) : (
              <div className="space-y-3">
                {data.proximasConsultas.map((c) => (
                  <div key={c.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{c.paciente_nome}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.tipo.replace("_", " ")}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(c.data_hora), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos Acompanhamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.ultimosAcompanhamentos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum acompanhamento registrado</p>
            ) : (
              <div className="space-y-3">
                {data.ultimosAcompanhamentos.map((a) => (
                  <div key={a.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{a.paciente_nome}</p>
                      <p className="text-xs text-muted-foreground">{a.data_registro}</p>
                    </div>
                    {a.peso && <span className="text-sm font-semibold">{a.peso} kg</span>}
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
