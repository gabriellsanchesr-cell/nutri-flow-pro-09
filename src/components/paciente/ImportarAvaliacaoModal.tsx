import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onExtracted: (data: Record<string, any>) => void;
}

export function ImportarAvaliacaoModal({ open, onOpenChange, onExtracted }: Props) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setFile(null);
    setDataAvaliacao(new Date().toISOString().split("T")[0]);
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({ title: "Selecione um arquivo", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 15 MB", variant: "destructive" });
      return;
    }
    setLoading(true);
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

      const { data, error } = await supabase.functions.invoke("parse-avaliacao-fisica", {
        body: { fileBase64: base64, mimeType: file.type || "application/octet-stream" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const extracted = (data?.extracted || {}) as Record<string, any>;
      const prefill = { ...extracted, data_avaliacao: dataAvaliacao, origem: "importado_ia" };

      toast({
        title: "Avaliação interpretada!",
        description: `${Object.keys(extracted).length} campos preenchidos. Revise antes de salvar.`,
      });
      onExtracted(prefill);
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao processar", description: e?.message || "Tente novamente", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) { if (!o) reset(); onOpenChange(o); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importar avaliação por IA
          </DialogTitle>
          <DialogDescription>
            Envie o PDF ou foto de uma avaliação física (InBody, Tanita, planilha, etc). A IA vai ler e preencher o formulário automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Data da avaliação</Label>
            <Input
              type="date"
              value={dataAvaliacao}
              onChange={(e) => setDataAvaliacao(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Arquivo (PDF ou imagem)</Label>
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            {file && (
              <p className="text-xs text-muted-foreground truncate">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <Button onClick={handleAnalyze} disabled={loading || !file} className="w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Lendo avaliação com IA…</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Analisar e preencher</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
