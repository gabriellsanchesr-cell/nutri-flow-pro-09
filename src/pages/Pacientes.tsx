import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const faseLabels: Record<string, string> = {
  rotina: "Rotina",
  estrategia: "Estratégia",
  autonomia: "Autonomia",
  liberdade: "Liberdade",
};

const faseColors: Record<string, string> = {
  rotina: "bg-accent text-accent-foreground",
  estrategia: "bg-primary/10 text-primary",
  autonomia: "bg-success/10 text-success",
  liberdade: "bg-warning/10 text-warning",
};

export default function Pacientes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (user) loadPacientes();
  }, [user]);

  const loadPacientes = async () => {
    const { data } = await supabase
      .from("pacientes")
      .select("*")
      .eq("ativo", true)
      .order("nome_completo");
    setPacientes(data || []);
  };

  const filtered = pacientes.filter((p) =>
    p.nome_completo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Button onClick={() => navigate("/pacientes/novo")}>
          <Plus className="h-4 w-4 mr-2" /> Novo Paciente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/pacientes/${p.id}`)}
          >
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-foreground">{p.nome_completo}</h3>
                <Badge variant="secondary" className={faseColors[p.fase_real] || ""}>
                  {faseLabels[p.fase_real] || p.fase_real}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {p.telefone && <p>📞 {p.telefone}</p>}
                {p.email && <p>✉️ {p.email}</p>}
                {p.objetivo && (
                  <p className="capitalize">🎯 {p.objetivo.replace(/_/g, " ")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            Nenhum paciente encontrado
          </p>
        )}
      </div>
    </div>
  );
}
