"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const KNOWN_ERRORS: Record<string, string> = {
  missing_code: "O login não foi concluído. Tente entrar novamente.",
  exchange_failed: "Não foi possível validar o login com o Google.",
  oauth: "O provedor recusou ou cancelou o login.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  const errorMessage = useMemo(() => {
    const code = searchParams.get("error");
    if (!code) {
      return null;
    }
    const detail = searchParams.get("detail");
    if (code === "oauth" && detail) {
      return detail;
    }
    return KNOWN_ERRORS[code] ?? "Não foi possível entrar. Tente novamente.";
  }, [searchParams]);

  async function handleGoogleLogin() {
    const supabase = createClient();
    setPending(true);

    const origin = window.location.origin;
    const nextRaw = searchParams.get("next");
    const callbackParams = new URLSearchParams();
    if (
      nextRaw &&
      nextRaw.startsWith("/") &&
      !nextRaw.startsWith("//")
    ) {
      callbackParams.set("next", nextRaw);
    }

    const query = callbackParams.toString();
    const callbackUrl = `${origin}/callback${query ? `?${query}` : ""}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setPending(false);
      console.error(error.message);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
    } else {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <h1 className="text-xl font-semibold">Entrar</h1>
      <p className="text-muted-foreground max-w-sm text-center text-sm">
        Use sua conta Google para acessar o CollectHub (mesmo grupo / empresa).
      </p>

      {errorMessage ? (
        <p
          className="border-destructive/30 bg-destructive/5 text-destructive max-w-md rounded-lg border px-3 py-2 text-center text-sm"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="min-w-[220px]"
        disabled={pending}
        aria-busy={pending}
        onClick={() => void handleGoogleLogin()}
      >
        {pending ? "Redirecionando…" : "Entrar com Google"}
      </Button>

      <Link
        href="/"
        className="text-muted-foreground text-sm underline-offset-4 hover:underline"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
