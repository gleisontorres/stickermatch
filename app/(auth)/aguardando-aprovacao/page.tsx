"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Tela de espera após login Google: polling até o administrador aprovar ou rejeitar.
 */
export default function AguardandoAprovacaoPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        return;
      }
      setUserId(user.id);

      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const metaNome =
        typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
      const nome =
        metaNome ||
        user.email?.split("@")[0] ||
        user.email ||
        "Visitante";
      setDisplayName(nome);
      setEmail(user.email ?? "");

      const { data: perfil } = await supabase
        .from("perfis")
        .select("nome, email, status, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (perfil?.nome?.trim()) {
        setDisplayName(perfil.nome.trim());
      }
      if (perfil?.email?.trim()) {
        setEmail(perfil.email.trim());
      }

      const st = typeof perfil?.status === "string" ? perfil.status.trim() : "";
      if (perfil?.is_admin || st === "aprovado") {
        router.replace("/dashboard");
        return;
      }
      if (st === "rejeitado") {
        router.replace("/acesso-negado");
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = createClient();

    const tick = async () => {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("status, is_admin")
        .eq("id", userId)
        .maybeSingle();

      const st =
        typeof perfil?.status === "string" ? perfil.status.trim() : "";

      if (perfil?.is_admin || st === "aprovado") {
        router.replace("/dashboard");
      } else if (st === "rejeitado") {
        router.replace("/acesso-negado");
      }
    };

    void tick();
    const interval = setInterval(() => void tick(), 10000);

    return () => clearInterval(interval);
  }, [router, userId]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleSwitchAccount() {
    await handleSignOut();
  }

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <div className="max-w-md space-y-6 text-center">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Aguardando aprovação
        </p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight">
          Olá{displayName ? `, ${displayName}` : ""}!
        </h1>
        <p className="text-muted-foreground text-pretty text-sm leading-relaxed">
          Sua conta está sendo analisada pelo administrador. Assim que for
          aprovada, você entrará automaticamente sem precisar fazer nada.
        </p>

        <div className="flex justify-center gap-2 pt-2" aria-hidden>
          <span
            className={cn(
              "bg-primary size-2 rounded-full motion-safe:animate-pulse",
            )}
          />
          <span
            className={cn(
              "bg-primary/70 size-2 rounded-full motion-safe:animate-pulse motion-safe:[animation-delay:150ms]",
            )}
          />
          <span
            className={cn(
              "bg-primary/40 size-2 rounded-full motion-safe:animate-pulse motion-safe:[animation-delay:300ms]",
            )}
          />
        </div>

        <p className="text-muted-foreground text-xs">
          Logado como:{" "}
          <span className="text-foreground font-medium">{email || "…"}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => void handleSwitchAccount()}
        >
          Entrar com outra conta
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => void handleSignOut()}
        >
          Sair
        </Button>
      </div>
      </div>
    </div>
  );
}
