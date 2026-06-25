import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, Loader2, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  planoExistente?: { id: string; nome: string; observacoes?: string | null; status?: string; pdf_path?: string | null } | null;
  onSaved: () => void;
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}

async function upsertResumoRefeicao(planoId: string, totals: {
  kcal: number | null; proteina_g: number | null; carboidrato_g: number | null; gordura_g: number | null; fibra_g: number | null;
}) {
  const { data: refsExist } = await supabase.from("refeicoes").select("id").eq("plano_id", planoId);
  if (refsExist?.length) {
    await supabase.from("refeicoes").delete().eq("plano_id", planoId);
  }
  const hasAny = (totals.kcal ?? 0) > 0 || (totals.proteina_g ?? 0) > 0 || (totals.carboidrato_g ?? 0) > 0 || (totals.gordura_g ?? 0) > 0 || (totals.fibra_g ?? 0) > 0;
  if (!hasAny) return false;
  const { data: ref, error: refErr } = await supabase.from("refeicoes").insert({
    plano_id: planoId,
    tipo: "cafe_da_manha" as any,
    nome_customizado: "Resumo do PDF",
    ordem: 0,
    horario_sugerido: null,
    totais_opcao: { A: {
      kcal: totals.kcal ?? 0, proteina_g: totals.proteina_g ?? 0,
      carboidrato_g: totals.carboidrato_g ?? 0, lipidio_g: totals.gordura_g ?? 0, fibra_g: totals.fibra_g ?? 0,
    } } as any,
  } as any).select("id").single();
  if (refErr) throw refErr;
  await supabase.from("alimentos_plano").insert({
    refeicao_id: ref.id,
    nome_alimento: "Resumo nutricional do PDF",
    quantidade: 1,
    medida_caseira: "plano/dia",
    energia_kcal: totals.kcal ?? 0,
    proteina_g: totals.proteina_g ?? 0,
    carboidrato_g: totals.carboidrato_g ?? 0,
    lipidio_g: totals.gordura_g ?? 0,
    fibra_g: totals.fibra_g ?? 0,
    opcao: "A",
    ordem: 0,
  } as any);
  return true;
}

const parseNum = (v: string): number | null => {
  if (v === "" || v == null) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
};

export function AnexarPlanoPdfModal({ open, onOpenChange, pacienteId, planoExistente, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!planoExistente;
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState("Plano (PDF anexado)");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState<"ativo" | "rascunho">("ativo");
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<string>("");

  // Editable extracted totals (strings to allow empty)
  const [kcal, setKcal] = useState("");
  const [prot, setProt] = useState("");
  const [carb, setCarb] = useState("");
  const [gord, setGord] = useState("");
  const [fibra, setFibra] = useState("");
  const [resumoObs, setResumoObs] = useState("");

  useEffect(() => {
    if (open) {
      setFile(null);
      setNome(planoExistente?.nome || "Plano (PDF anexado)");
      setObservacoes(planoExistente?.observacoes || "");
      setStatus((planoExistente?.status as any) || "ativo");
      setSaving(false);
      setReading(false);
      setProgress("");
      setKcal(""); setProt(""); setCarb(""); setGord(""); setFibra(""); setResumoObs("");
    }
  }, [open, planoExistente]);

  const handleFileChange = async (f: File | null) => {
    setFile(f);
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast({ title: "Arquivo deve ser PDF", variant: "destructive" }); return;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande (máx 25 MB)", variant: "destructive" }); return;
    }
    // Auto-extract totals
    await runExtraction(f);
  };

  const runExtraction = async (f: File) => {
    setReading(true);
    setProgress("Lendo totais nutricionais do PDF...");
    try {
      const b64 = await fileToBase64(f);
      const { data, error } = await supabase.functions.invoke("parse-plano-pdf-totais", {
        body: { fileBase64: b64, mimeType: "application/pdf" },
      });
      if (error) throw error;
      if (data?.kcal != null) setKcal(String(Math.round(data.kcal)));
      if (data?.proteina_g != null) setProt(String(Math.round(data.proteina_g)));
      if (data?.carboidrato_g != null) setCarb(String(Math.round(data.carboidrato_g)));
      if (data?.gordura_g != null) setGord(String(Math.round(data.gordura_g)));
      if (data?.fibra_g != null) setFibra(String(Math.round(data.fibra_g)));
      if (data?.observacoes) setResumoObs(data.observacoes);
      const anyRead = data?.kcal || data?.proteina_g || data?.carboidrato_g || data?.gordura_g;
      toast({
        title: anyRead ? "Totais lidos!" : "Não identifiquei totais",
        description: anyRead ? "Revise e ajuste os valores antes de salvar." : "Preencha manualmente os campos antes de salvar.",
      });
    } catch (e: any) {
      console.warn("Falha ao ler totais", e);
      toast({ title: "Não consegui ler o PDF automaticamente", description: "Preencha os totais manualmente.", variant: "destructive" });
    } finally {
      setReading(false);
      setProgress("");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!isEdit && !file) {
      toast({ title: "Selecione um PDF", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let pdf_path = planoExistente?.pdf_path || null;
      let pdf_nome: string | null = null;

      if (file) {
        setProgress("Enviando PDF...");
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `planos/${pacienteId}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("documentos-pdf")
          .upload(path, file, { contentType: "application/pdf", upsert: false });
        if (upErr) throw upErr;

        if (isEdit && planoExistente?.pdf_path && planoExistente.pdf_path !== path) {
          await supabase.storage.from("documentos-pdf").remove([planoExistente.pdf_path]);
        }
        pdf_path = path;
        pdf_nome = file.name;
      }

      const finalObs = [observacoes, resumoObs].filter(Boolean).join("\n\n").trim();

      let planoId = planoExistente?.id;
      if (isEdit) {
        const update: any = { nome: nome.trim(), observacoes: finalObs, status };
        if (file) { update.pdf_path = pdf_path; update.pdf_nome = pdf_nome; }
        const { error } = await supabase.from("planos_alimentares").update(update).eq("id", planoExistente!.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from("planos_alimentares").insert({
          user_id: user.id, paciente_id: pacienteId,
          nome: nome.trim() || "Plano (PDF anexado)",
          observacoes: finalObs, status, is_template: false,
          tipo: "anexo", pdf_path, pdf_nome,
        } as any).select("id").single();
        if (error) throw error;
        planoId = inserted!.id;
      }

      if (planoId) {
        setProgress("Salvando resumo nutricional...");
        await upsertResumoRefeicao(planoId, {
          kcal: parseNum(kcal),
          proteina_g: parseNum(prot),
          carboidrato_g: parseNum(carb),
          gordura_g: parseNum(gord),
          fibra_g: parseNum(fibra),
        });
      }

      toast({ title: isEdit ? "Plano atualizado!" : "PDF anexado!" });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setProgress("");
    }
  };

  const busy = saving || reading;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar plano anexado" : "Anexar PDF do plano alimentar"}</DialogTitle>
          <DialogDescription>
            O PDF é armazenado como referência interna. Os totais nutricionais abaixo são o que aparece para o paciente — revise antes de salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Nome do plano</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={busy} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)} disabled={busy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo (visível para o paciente)</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{isEdit ? "Substituir PDF (opcional)" : "Arquivo PDF (até 25 MB)"}</Label>
            <Input
              type="file" accept="application/pdf"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              disabled={busy}
            />
            {file && <p className="text-xs text-muted-foreground">{file.name} • {(file.size / 1024).toFixed(0)} KB</p>}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Resumo nutricional (visível ao paciente)</Label>
              {file && (
                <Button type="button" size="sm" variant="ghost" onClick={() => runExtraction(file)} disabled={busy}>
                  {reading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  Ler novamente
                </Button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Kcal/dia</Label>
                <Input value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="0" disabled={busy} inputMode="decimal" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Prot (g)</Label>
                <Input value={prot} onChange={(e) => setProt(e.target.value)} placeholder="0" disabled={busy} inputMode="decimal" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Carb (g)</Label>
                <Input value={carb} onChange={(e) => setCarb(e.target.value)} placeholder="0" disabled={busy} inputMode="decimal" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Gord (g)</Label>
                <Input value={gord} onChange={(e) => setGord(e.target.value)} placeholder="0" disabled={busy} inputMode="decimal" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Fibra (g)</Label>
                <Input value={fibra} onChange={(e) => setFibra(e.target.value)} placeholder="0" disabled={busy} inputMode="decimal" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Observações do resumo (opcional)</Label>
              <Textarea rows={2} value={resumoObs} onChange={(e) => setResumoObs(e.target.value)} disabled={busy} placeholder="Ex: Totais retirados da seção 'Resumo Nutricional'" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações gerais do plano (opcional)</Label>
            <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} disabled={busy} />
          </div>

          {busy && progress && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> {progress}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={handleSave} disabled={busy || (!isEdit && !file)}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Paperclip className="h-4 w-4 mr-1" />}
            {isEdit ? "Salvar" : "Anexar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
