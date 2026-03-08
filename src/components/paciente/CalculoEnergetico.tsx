import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props { paciente: any; }

const activityFactors: Record<string, number> = {
  sedentario: 1.2, leve: 1.375, moderado: 1.55, intenso: 1.725, muito_intenso: 1.9,
};

function calcAge(dob: string | null): number {
  if (!dob) return 30;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function CalculoEnergetico({ paciente }: Props) {
  const [peso, setPeso] = useState(String(paciente.peso_inicial || ""));
  const [altura, setAltura] = useState(String(paciente.altura ? paciente.altura * 100 : ""));
  const [idade, setIdade] = useState(String(calcAge(paciente.data_nascimento)));
  const [sexo, setSexo] = useState(paciente.sexo === "F" ? "F" : "M");
  const [atividade, setAtividade] = useState(paciente.nivel_atividade || "sedentario");
  const [objetivo, setObjetivo] = useState<"deficit" | "manutencao" | "superavit">("manutencao");

  const results = useMemo(() => {
    const p = Number(peso); const h = Number(altura); const i = Number(idade);
    if (!p || !h || !i) return null;

    const harrisBenedict = sexo === "M"
      ? 88.362 + 13.397 * p + 4.799 * h - 5.677 * i
      : 447.593 + 9.247 * p + 3.098 * h - 4.330 * i;

    const mifflin = sexo === "M"
      ? 10 * p + 6.25 * h - 5 * i + 5
      : 10 * p + 6.25 * h - 5 * i - 161;

    const factor = activityFactors[atividade] || 1.2;
    const get = mifflin * factor;

    const adjustments: Record<string, number> = { deficit: -500, manutencao: 0, superavit: 300 };
    const meta = get + (adjustments[objetivo] || 0);

    const protPerKg = objetivo === "ganho_de_massa" || objetivo === "superavit" ? 2.0 : 1.8;
    const protG = p * protPerKg;
    const protKcal = protG * 4;
    const fatKcal = meta * 0.25;
    const fatG = fatKcal / 9;
    const carbKcal = meta - protKcal - fatKcal;
    const carbG = carbKcal / 4;

    return {
      harrisBenedict: Math.round(harrisBenedict),
      mifflin: Math.round(mifflin),
      get: Math.round(get),
      meta: Math.round(meta),
      macros: {
        protG: Math.round(protG), protPct: Math.round((protKcal / meta) * 100),
        carbG: Math.round(carbG), carbPct: Math.round((carbKcal / meta) * 100),
        fatG: Math.round(fatG), fatPct: Math.round((fatKcal / meta) * 100),
      },
    };
  }, [peso, altura, idade, sexo, atividade, objetivo]);

  return (
    <div className="space-y-4">
      <Card className="border-border rounded-xl">
        <CardHeader><CardTitle className="text-base">Parâmetros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><Label>Peso (kg)</Label><Input type="number" value={peso} onChange={e => setPeso(e.target.value)} /></div>
            <div><Label>Altura (cm)</Label><Input type="number" value={altura} onChange={e => setAltura(e.target.value)} /></div>
            <div><Label>Idade</Label><Input type="number" value={idade} onChange={e => setIdade(e.target.value)} /></div>
            <div>
              <Label>Sexo</Label>
              <Select value={sexo} onValueChange={setSexo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Atividade</Label>
              <Select value={atividade} onValueChange={setAtividade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentario">Sedentário</SelectItem>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="intenso">Intenso</SelectItem>
                  <SelectItem value="muito_intenso">Muito Intenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objetivo</Label>
              <Select value={objetivo} onValueChange={v => setObjetivo(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deficit">Déficit</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="superavit">Superávit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {results && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard label="TMB (Harris-Benedict)" value={`${results.harrisBenedict} kcal`} />
            <ResultCard label="TMB (Mifflin-St Jeor)" value={`${results.mifflin} kcal`} />
            <ResultCard label="GET" value={`${results.get} kcal`} />
            <ResultCard label="Meta Calórica" value={`${results.meta} kcal`} highlight />
          </div>

          <Card className="border-border rounded-xl">
            <CardHeader><CardTitle className="text-base">Distribuição de Macronutrientes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{results.macros.protG}g</p>
                  <p className="text-xs text-muted-foreground">Proteína ({results.macros.protPct}%)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{results.macros.carbG}g</p>
                  <p className="text-xs text-muted-foreground">Carboidrato ({results.macros.carbPct}%)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{results.macros.fatG}g</p>
                  <p className="text-xs text-muted-foreground">Gordura ({results.macros.fatPct}%)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={`border-border rounded-xl ${highlight ? "ring-2 ring-primary/20" : ""}`}>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
