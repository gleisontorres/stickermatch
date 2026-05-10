"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hide_matches_tip";

/**
 * Banner no dashboard lembrando de cadastrar faltas para melhorar matches.
 * O pai só monta quando o servidor indica poucas linhas em colecao; aqui respeita localStorage.
 */
export function DashboardMatchesTipBanner() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, []);

  if (!ready || dismissed) {
    return null;
  }

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <section
      className="border-primary/25 bg-primary/[0.07] rounded-2xl border px-4 py-4 shadow-sm"
      role="status"
      aria-label="Dica para mais matches"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">💡 Quer mais matches?</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Marque também suas <strong className="text-foreground font-medium">faltas</strong>{" "}
            (figurinhas que não tem). O app só sugere trocas para você dar quando os outros
            sabem o que precisam — e você também aparece como quem pode dar quando eles ainda
            não cadastraram tudo.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <Link
            href="/album?bulk=1"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "inline-flex")}
          >
            Modo Cadastro Rápido
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={dismiss}>
            Não mostrar mais
          </Button>
        </div>
      </div>
    </section>
  );
}
