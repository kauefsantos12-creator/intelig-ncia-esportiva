import { useEffect, useState, type ReactNode } from "react";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isAuthenticationFresh } from "@/integrations/supabase/session-policy";

type AuthState = "loading" | "signed-out" | "authorized";

function currentReturnUrl() {
  const destination = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return new URL(destination || "/", window.location.origin).toString();
}

function decodeTokenClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const padding = "=".repeat((4 - (payload.length % 4)) % 4);
    const base64 = (payload + padding).replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(window.atob(base64), (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function applySession(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      if (!active) return;
      if (!session) {
        setState("signed-out");
        return;
      }

      // The browser gate is UX only. The actual allowlist and absolute session
      // lifetime are enforced on the trusted server boundary before every serverFn.
      const provider = String(session.user.app_metadata?.provider ?? "");
      if (provider !== "google") {
        setMessage("Esta sessão não tem acesso ao painel.");
        await supabase.auth.signOut();
        if (active) setState("signed-out");
        return;
      }

      const claims = decodeTokenClaims(session.access_token);
      if (!claims || !isAuthenticationFresh(claims)) {
        await supabase.auth.signOut();
        if (active) {
          setMessage("Sua sessão de 30 dias terminou. Entre novamente com o Google para continuar.");
          setState("signed-out");
        }
        return;
      }

      setMessage(null);
      setState("authorized");
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMessage("Não foi possível verificar sua sessão. Tente entrar novamente.");
        setState("signed-out");
        return;
      }
      void applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    setSigningIn(true);
    setMessage(null);

    try {
      // Google gerenciado pelo Lovable Cloud: as credenciais OAuth vivem no broker
      // gerenciado, por isso o fluxo passa por ele e a sessão Supabase é definida no fim.
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: currentReturnUrl(),
        extraParams: { prompt: "select_account" },
      });

      if (result.error) {
        setSigningIn(false);
        setMessage("Não foi possível abrir o login do Google. Tente novamente.");
      }
    } catch {
      setSigningIn(false);
      setMessage("Não foi possível abrir o login do Google. Tente novamente.");
    }
  }

  if (state === "authorized") return <>{children}</>;

  if (state === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Verificando acesso…
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent_32rem)]" />
      <main className="panel relative z-10 w-full max-w-md overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden />

        <div className="flex items-center justify-between gap-4">
          <img
            src="/icons/icon-192.png"
            alt=""
            className="size-14 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10"
            aria-hidden
          />
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-secondary/35 px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden />
            Acesso privado
          </div>
        </div>

        <p className="label-eyebrow mt-6">Motor de Inteligência Esportiva</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Seu painel de futebol, Elo e análise
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Entre com a conta Google autorizada para acessar Noticiário, jogos de hoje, rankings Elo, Analytics e suas Anotações.
        </p>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-border/70 bg-secondary/30 p-3.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-xs leading-relaxed text-muted-foreground">
            A sessão tem prazo máximo de 30 dias e continua sendo validada no servidor antes de operações com os dados.
          </p>
        </div>

        {message && (
          <div className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning" role="alert">
            {message}
          </div>
        )}

        <Button className="mt-6 min-h-12 w-full" onClick={() => void signIn()} disabled={signingIn}>
          {signingIn ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
          Entrar com Google
        </Button>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          Ao entrar, consulte como os dados são tratados no <a href="/privacidade" className="font-medium text-primary underline underline-offset-4">Aviso de Privacidade</a>.
        </p>
      </main>
    </div>
  );
}
