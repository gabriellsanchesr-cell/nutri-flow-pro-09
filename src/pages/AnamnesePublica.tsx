import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";

const SECTIONS = [
  { key: "objetivos_motivacoes", label: "Objetivos e Motivações", placeholder: "Descreva seus objetivos e o que te motiva..." },
  { key: "historico_treino", label: "Histórico de Treino e Rotina", placeholder: "Pratica algum exercício? Com que frequência?" },
  { key: "historico_alimentar", label: "Histórico Alimentar", placeholder: "Como é sua alimentação no dia a dia?" },
  { key: "saude_intestinal", label: "Saúde Intestinal", placeholder: "Como funciona seu intestino?" },
  { key: "sono_estresse", label: "Sono e Estresse", placeholder: "Como está seu sono e nível de estresse?" },
  { key: "historico_medico", label: "Histórico Médico", placeholder: "Possui alguma condição médica, usa medicamentos?" },
  { key: "espaco_livre", label: "Espaço Livre", placeholder: "Algo mais que gostaria de compartilhar?" },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

export default function AnamnesePublica() {
  const { token } = useParams();
  const [anamnese, setAnamnese] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState<Record<SectionKey, string>>({
    objetivos_motivacoes: "",
    historico_treino: "",
    historico_alimentar: "",
    saude_intestinal: "",
    sono_estresse: "",
    historico_medico: "",
    espaco_livre: "",
  });

  useEffect(() => {
    if (token) loadAnamnese();
  }, [token]);

  const loadAnamnese = async () => {
    const { data, error } = await supabase
      .from("anamneses")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (!data || error) {
      setNotFound(true);
    } else if (data.respondido) {
      setSaved(true);
      setAnamnese(data);
    } else {
      setAnamnese(data);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!anamnese) return;
    setSaving(true);
    const { error } = await supabase
      .from("anamneses")
      .update({
        ...formData,
        respondido: true,
        preenchido_por: "paciente",
        updated_at: new Date().toISOString(),
      })
      .eq("token", token)
      .eq("respondido", false);
    setSaving(false);
    if (!error) setSaved(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5FA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B3990]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5FA]">
        <Card className="max-w-md rounded-xl border-[#E2E5F0]">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-[#1A1F3C]">Link inválido ou expirado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5FA]">
        <Card className="max-w-md rounded-xl border-[#E2E5F0]">
          <CardContent className="py-12 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-lg font-medium text-[#1A1F3C]">Anamnese enviada com sucesso!</p>
            <p className="text-sm text-muted-foreground">Obrigado por preencher. Seu nutricionista receberá as respostas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5FA] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Logo" className="h-10 mx-auto" />
          <h1 className="text-2xl font-bold text-[#1A1F3C]">Anamnese Nutricional</h1>
          <p className="text-muted-foreground">Preencha com calma cada seção abaixo.</p>
        </div>

        {SECTIONS.map(({ key, label, placeholder }) => (
          <Card key={key} className="rounded-xl border-[#E2E5F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#1A1F3C]">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData[key]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                placeholder={placeholder}
                rows={4}
              />
            </CardContent>
          </Card>
        ))}

        <Button onClick={handleSubmit} disabled={saving} className="w-full bg-[#2B3990] hover:bg-[#2B3990]/90 h-12 text-base">
          {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          Enviar Anamnese
        </Button>
      </div>
    </div>
  );
}
