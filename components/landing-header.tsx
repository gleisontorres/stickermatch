"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Barra fixa no topo da landing: marca + entrada Google (mesmo fluxo OAuth da página /login).
 */
export function LandingHeader() {
  const [pending, setPending] = useState(false);

  async function handleGoogleLogin() {
    const supabase = createClient();
    setPending(true);

    const origin = window.location.origin;
    const params = new URLSearchParams(window.location.search);
    const nextRaw = params.get("next");
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
    <header
      className="fixed top-0 right-0 left-0 z-50 flex flex-nowrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="flex min-w-0 shrink items-center gap-2.5">
        <Image
          src="/icons/icon-192.png"
          alt="CollectHub"
          width={36}
          height={36}
          className="size-9 shrink-0"
        />
        <span className="brand-gradient-text truncate font-bold text-lg leading-none">
          CollectHub
        </span>
      </div>

      <Button
        type="button"
        variant="gradient"
        size="sm"
        disabled={pending}
        aria-busy={pending}
        className="shrink-0 gap-1 font-semibold"
        onClick={() => void handleGoogleLogin()}
      >
        <span className="hidden sm:inline">
          {pending ? "Redirecionando…" : "Entrar com Google"}
        </span>
        <span className="sm:hidden">{pending ? "…" : "Entrar"}</span>
        {!pending ?
          <ArrowRight className="size-3.5 shrink-0 sm:size-4" aria-hidden />
        : null}
      </Button>
    </header>
  );
}
