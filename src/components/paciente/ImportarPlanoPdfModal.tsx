import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId?: string;
  mode?: "paciente" | "template";
  onImported: (data: { nome: string; observacoes: string; refeicoes: any[] }) => void;
}

const STAGES = [
  "Lendo o PDF e preservando o layout...",
  "Enviando para a IA com leitura visual...",
  "Identificando refeições, horários e opções (A/B/C)...",
  "Separando alimentos e substituições por item...",
  "Casando com a base TACO e calculando macros...",
];

export function ImportarPlanoPdfModal({ open, onOpenChange, pacienteId, mode = "paciente", onImported }: Props) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState("Plano Importado");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);

  const reset = () => { setFile(null); setNome("Plano Importado"); setLoading(false); setStage(0); };

  const handleSubmit = async () => {
    if (!file) { toast({ title: "Selecione um PDF", variant: "destructive" }); return; }
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Arquivo muito grande (máx 10 MB)", variant: "destructive" }); return; }

    setLoading(true);
    setStage(0);
    const interval = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4000);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("import-plano-pdf", {
        body: { paciente_id: pacienteId, pdf_base64: base64, mode },
      });

      clearInterval(interval);

      if (error || (data as any)?.error) {
        const msg = (data as any)?.error || error?.message || "Falha ao importar";
        toast({ title: "Erro na importação", description: msg, variant: "destructive" });
        setLoading(false);
        return;
      }

      const stats = (data as any)?.stats;
      const descricao = stats
        ? `${stats.refeicoes} refeições · ${stats.opcoes} opções · ${stats.alimentos} alimentos · ${stats.substituicoes} substituições${stats.precisam_revisao ? ` · ${stats.precisam_revisao} p/ revisar` : ""}`
        : "Revise as informações antes de ativar.";

      toast({ title: "PDF importado!", description: descricao });
      onImported({
        nome: nome.trim() || "Plano Importado",
        observacoes: data.observacoes || "",
        refeicoes: data.refeicoes || [],
      });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      clearInterval(interval);
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar plano alimentar de PDF</DialogTitle>
          <DialogDescription>
            A IA vai ler o PDF e estruturar as refeições, alimentos e quantidades automaticamente. Você poderá revisar antes de ativar.
          </DialogDescription>
        </DialogHeader>

        {!loading ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do plano</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Arquivo PDF (até 10 MB)</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && <p className="text-xs text-muted-foreground">{file.name} • {(file.size / 1024).toFixed(0)} KB</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              Suporta PDFs com texto selecionável e também PDFs escaneados (OCR automático).
            </p>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{STAGES[stage]}</p>
            <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos...</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !file}>
            <FileUp className="h-4 w-4 mr-1" /> Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
