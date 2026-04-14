import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, ExternalLink, Mail, Lock } from "lucide-react";

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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/30 to-transparent" />
        {/* Tagline pill */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
            <span className="text-white font-semibold text-lg tracking-wide">
              Sua evolução começa aqui
            </span>
          </div>
        </div>
      </div>

      {/* Login Column */}
      <div
        className="flex items-center justify-center px-6 py-12"
        style={{
          background: "radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.06) 0%, hsl(var(--background)) 70%)",
        }}
      >
        {/* Glassmorphism card */}
        <div
          className="w-full max-w-sm space-y-7 bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-8 animate-fade-in"
        >
          {/* Logo */}
          <div className="text-center animate-fade-in" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
            <img
              src="/logo.png"
              alt="Gabriel Sanches"
              className="h-24 mx-auto mb-5 drop-shadow-md"
            />
            <h1 className="text-xl font-bold tracking-wide uppercase bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Entrar no Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse seu acompanhamento nutricional
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-11 rounded-xl pl-10 transition-all duration-200 focus:bg-white focus:shadow-sm"
                />
              </div>
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
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 rounded-xl pl-10 transition-all duration-200 focus:bg-white focus:shadow-sm"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              disabled={loading}
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</> : "Entrar"}
            </Button>
          </form>

          {/* Separator */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.25s", animationFillMode: "both" }}>
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/70 dark:bg-card/70 px-3 py-0.5 rounded-full text-muted-foreground border border-border/30 text-[11px]">
                ou
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
            <p className="text-sm text-muted-foreground">Ainda não é paciente?</p>
            <a
              href="https://www.gabrielnutri.com.br/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="w-full rounded-xl gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
              >
                Conheça meu trabalho
                <ExternalLink className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
