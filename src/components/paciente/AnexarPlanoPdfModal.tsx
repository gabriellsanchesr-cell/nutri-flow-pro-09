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
import { Paperclip, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  /** Quando definido, edita o plano existente (somente metadados/arquivo opcional). */
  planoExistente?: { id: string; nome: string; observacoes?: string | null; status?: string; pdf_path?: string | null } | null;
  onSaved: () => void;
}

export function AnexarPlanoPdfModal({ open, onOpenChange, pacienteId, planoExistente, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!planoExistente;
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState("Plano (PDF anexado)");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState<"ativo" | "rascunho">("ativo");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFile(null);
      setNome(planoExistente?.nome || "Plano (PDF anexado)");
      setObservacoes(planoExistente?.observacoes || "");
      setStatus((planoExistente?.status as any) || "ativo");
      setSaving(false);
    }
  }, [open, planoExistente]);

  const handleSave = async () => {
    if (!user) return;
    if (!isEdit && !file) {
      toast({ title: "Selecione um PDF", variant: "destructive" });
      return;
    }
    if (file && file.type !== "application/pdf") {
      toast({ title: "Arquivo deve ser PDF", variant: "destructive" });
      return;
    }
    if (file && file.size > 25 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande (máx 25 MB)", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let pdf_path = planoExistente?.pdf_path || null;
      let pdf_nome: string | null = null;

      if (file) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `planos/${pacienteId}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("documentos-pdf")
          .upload(path, file, { contentType: "application/pdf", upsert: false });
        if (upErr) throw upErr;

        // Apaga o anterior se estiver substituindo
        if (isEdit && planoExistente?.pdf_path && planoExistente.pdf_path !== path) {
          await supabase.storage.from("documentos-pdf").remove([planoExistente.pdf_path]);
        }
        pdf_path = path;
        pdf_nome = file.name;
      }

      if (isEdit) {
        const update: any = { nome: nome.trim(), observacoes, status };
        if (file) {
          update.pdf_path = pdf_path;
          update.pdf_nome = pdf_nome;
        }
        const { error } = await supabase.from("planos_alimentares").update(update).eq("id", planoExistente!.id);
        if (error) throw error;
        toast({ title: "Plano atualizado!" });
      } else {
        const { error } = await supabase.from("planos_alimentares").insert({
          user_id: user.id,
          paciente_id: pacienteId,
          nome: nome.trim() || "Plano (PDF anexado)",
          observacoes,
          status,
          is_template: false,
          tipo: "anexo",
          pdf_path,
          pdf_nome,
        } as any);
        if (error) throw error;
        toast({ title: "PDF anexado!", description: "O plano em PDF está disponível no portal do paciente." });
      }

      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar plano anexado" : "Anexar PDF do plano alimentar"}</DialogTitle>
          <DialogDescription>
            O PDF é exibido exatamente como foi enviado, sem alterações de layout. Ideal para planos já formatados em outras ferramentas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Nome do plano</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)} disabled={saving}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo (visível para o paciente)</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Observações (opcional)</Label>
            <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label>{isEdit ? "Substituir PDF (opcional)" : "Arquivo PDF (até 25 MB)"}</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={saving}
            />
            {file && <p className="text-xs text-muted-foreground">{file.name} • {(file.size / 1024).toFixed(0)} KB</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || (!isEdit && !file)}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Paperclip className="h-4 w-4 mr-1" />}
            {isEdit ? "Salvar" : "Anexar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
