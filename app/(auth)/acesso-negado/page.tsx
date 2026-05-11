"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Conta com cadastro recusado pelo administrador.
 */
export default function AcessoNegadoPage() {
  const router = useRouter();

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
            Acesso não autorizado
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            Sua solicitação foi recusada
          </h1>
          <p className="text-muted-foreground text-pretty text-sm leading-relaxed">
            Sua solicitação de acesso ao Stickermatch foi recusada. Se acha que é
            um engano, entre em contato com o administrador.
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
