import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Download, Trash2, FileText, Search, Upload, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  paciente: any;
}

export function ExamesSection({ paciente }: Props) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [exames, setExames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome_exame: "", data_coleta: new Date().toISOString().split("T")[0], observacoes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [viewingExame, setViewingExame] = useState<any | null>(null);

  useEffect(() => { loadExames(); }, [paciente.id]);

  const loadExames = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exames_laboratoriais")
      .select("*")
      .eq("paciente_id", paciente.id)
      .order("data_coleta", { ascending: false });
    setExames(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!file || !form.nome_exame) {
      toast({ title: "Erro", description: "Preencha o nome e selecione um arquivo.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${paciente.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("exames-laboratoriais").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { error } = await supabase.from("exames_laboratoriais").insert({
        paciente_id: paciente.id,
        user_id: session!.user.id,
        nome_exame: form.nome_exame,
        data_coleta: form.data_coleta,
        arquivo_path: path,
        observacoes: form.observacoes || null,
      });
      if (error) throw error;

      toast({ title: "Sucesso", description: "Exame adicionado." });
      setDialogOpen(false);
      setForm({ nome_exame: "", data_coleta: new Date().toISOString().split("T")[0], observacoes: "" });
      setFile(null);
      loadExames();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (exame: any) => {
    await supabase.storage.from("exames-laboratoriais").remove([exame.arquivo_path]);
    await supabase.from("exames_laboratoriais").delete().eq("id", exame.id);
    toast({ title: "Exame removido" });
    loadExames();
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("exames-laboratoriais").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDownload = (exame: any) => {
    window.open(getPublicUrl(exame.arquivo_path), "_blank");
  };

  const isImage = (path: string) => /\.(jpg|jpeg|png|webp)$/i.test(path);

  const filtered = exames.filter(e => e.nome_exame.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar exame..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Exame
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum exame cadastrado.</p>
            <Button variant="outline" className="mt-3" onClick={() => setDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-1" /> Upload do primeiro exame
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exame</TableHead>
                <TableHead>Data Coleta</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(exame => (
                <TableRow key={exame.id}>
                  <TableCell className="font-medium">{exame.nome_exame}</TableCell>
                  <TableCell>{format(new Date(exame.data_coleta + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{exame.observacoes || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewingExame(exame)} title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(exame)} title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(exame)} title="Excluir" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Exame</DialogTitle>
            <DialogDescription>Faça upload de PDF ou imagem do exame laboratorial.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do exame *</Label>
              <Input value={form.nome_exame} onChange={e => setForm(f => ({ ...f, nome_exame: e.target.value }))} placeholder="Ex: Hemograma completo" />
            </div>
            <div>
              <Label>Data da coleta *</Label>
              <Input type="date" value={form.data_coleta} onChange={e => setForm(f => ({ ...f, data_coleta: e.target.value }))} />
            </div>
            <div>
              <Label>Arquivo (PDF/Imagem) *</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Anotações sobre o exame..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
