import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const normalizeConfirmationText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({ open, onOpenChange, pacienteNome, onConfirm, loading }: DeleteConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const canConfirm = normalizeConfirmationText(confirmText) === normalizeConfirmationText(pacienteNome);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canConfirm || loading) return;
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setConfirmText(""); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Excluir Paciente</DialogTitle>
            <DialogDescription>
              Tem certeza? Esta ação não pode ser desfeita. Todos os dados do paciente serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Digite <strong>{pacienteNome}</strong> para confirmar:</Label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={pacienteNome} autoComplete="off" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={!canConfirm || loading}>
              {loading ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
