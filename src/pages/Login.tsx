import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, ExternalLink } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      let message = "E-mail ou senha incorretos.";
      if (error.message?.toLowerCase().includes("banned") || error.message?.toLowerCase().includes("ban")) {
        message = "Seu acesso está temporariamente suspenso. Entre em contato com seu nutricionista.";
      }
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[55fr_45fr]">
      {/* Banner Column */}
      <div className="hidden lg:block relative overflow-hidden">
        <img
          src="/banner-login.jpg"
          alt="Nutrição e saúde"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
      </div>

      {/* Login Column */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="text-center">
            <img src="/logo.png" alt="Gabriel Sanches" className="h-20 mx-auto mb-6 drop-shadow-sm" />
            <h1 className="text-xl font-bold text-foreground tracking-wide uppercase">
              Entrar no Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse seu acompanhamento nutricional
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/esqueci-senha"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</> : "Entrar"}
            </Button>
          </form>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Ainda não é paciente?</p>
            <a
              href="https://www.gabrielnutri.com.br/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full rounded-xl gap-2">
                Conheça meu trabalho <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
