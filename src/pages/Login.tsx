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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Banner Column ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(235,50%,30%)] to-[hsl(235,60%,15%)]">
        {/* Background image layer */}
        <img
          src="/banner-login.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
        />

        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-72 h-72 rounded-full bg-[hsl(var(--primary))]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-10">
          {/* Top logo area */}
          <div>
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 w-auto object-contain brightness-0 invert drop-shadow-lg"
            />
          </div>

          {/* Center text */}
          <div className="space-y-4 max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Sua evolução{" "}
              <span className="text-white/80">começa aqui.</span>
            </h2>
            <p className="text-white/60 text-base leading-relaxed">
              Acompanhamento nutricional personalizado para transformar sua saúde e alcançar seus objetivos.
            </p>
          </div>

          {/* Bottom tagline pill */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-white/40 text-xs tracking-widest uppercase">
              Gabriel Sanches · Nutricionista
            </span>
            <div className="h-px flex-1 bg-white/15" />
          </div>
        </div>
      </div>

      {/* ── Login Column ── */}
      <div className="flex-1 flex items-center justify-center bg-background overflow-y-auto">
        <div className="w-full max-w-sm px-6 py-10 space-y-8">
          {/* Logo */}
          <div className="text-center">
            <img
              src="/logo.png"
              alt="Gabriel Sanches"
              className="h-16 w-auto max-w-[160px] object-contain mx-auto mb-4"
            />
            <h1 className="text-xl font-bold tracking-wide text-foreground">
              Entrar no Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse seu acompanhamento nutricional
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-11 rounded-xl pl-10 border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Senha
                </Label>
                <Link
                  to="/esqueci-senha"
                  className="text-xs text-primary hover:text-primary/80 transition-colors hover:underline font-medium"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 rounded-xl pl-10 border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Ainda não é paciente?</p>
            <a
              href="https://www.gabrielnutri.com.br/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="w-full rounded-xl gap-2 h-11 border-border/60 hover:bg-accent transition-all group"
              >
                Conheça meu trabalho
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
