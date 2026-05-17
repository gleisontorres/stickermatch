"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "install-banner-dismissed";

function isPwaStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const mq = window.matchMedia("(display-mode: standalone)");
  if (mq.matches) {
    return true;
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

/**
 * Banner único no dashboard com instruções de instalação PWA.
 * Oculto após dismiss (localStorage) ou quando já está em modo standalone.
 */
export function DashboardInstallBanner() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (isPwaStandalone()) {
        setVisible(false);
        setReady(true);
        return;
      }
      const dismissed =
        window.localStorage.getItem(STORAGE_KEY) === "true";
      setVisible(!dismissed);
    } catch {
      setVisible(true);
    }
    setReady(true);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!ready || !visible) {
    return null;
  }

  return (
    <section
      className="border-[#10b981]/45 bg-white/[0.05] dark:bg-zinc-900/45 relative mb-6 w-full rounded-2xl border p-4 pr-24 shadow-sm ring-1 ring-[#10b981]/20 dark:ring-[#10b981]/25 sm:p-5 sm:pr-28"
      role="region"
      aria-label="Instalar o app no celular"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar instruções de instalação"
        className="text-muted-foreground hover:text-foreground absolute right-3 top-3 rounded-md px-2 py-1 text-xs font-medium transition-colors sm:right-4 sm:top-4 sm:text-sm"
      >
        Entendi ✕
      </button>

      <h2 className="text-foreground pr-2 text-center text-sm font-semibold sm:text-base md:text-left">
        <span aria-hidden>📲</span> Instale o app no seu celular!
      </h2>

      <div className="mt-3 grid gap-4 md:grid-cols-2 md:gap-5">
        <div className="bg-background/45 dark:bg-black/25 space-y-2 rounded-xl p-3">
          <p className="text-foreground text-sm font-medium">
            <span aria-hidden>🤖</span> Android
          </p>
          <ol className="text-muted-foreground list-decimal space-y-1.5 pl-4 text-xs leading-snug sm:text-sm">
            <li>Abra no Chrome</li>
            <li>
              Menu (⋮) → &quot;Adicionar à tela inicial&quot;
            </li>
          </ol>
        </div>
        <div className="bg-background/45 dark:bg-black/25 space-y-2 rounded-xl p-3">
          <p className="text-foreground text-sm font-medium">
            <span aria-hidden>🍎</span> iPhone
          </p>
          <ol className="text-muted-foreground list-decimal space-y-1.5 pl-4 text-xs leading-snug sm:text-sm">
            <li>Abra no Safari</li>
            <li>
              Compartilhar (⬆️) → &quot;Adicionar à Tela de Início&quot;
            </li>
          </ol>
        </div>
      </div>

      <p className="text-[#10b981] dark:text-emerald-400 mt-4 border-t border-[#10b981]/35 pt-3 text-center text-xs font-medium sm:text-sm">
        ✅ Quem já conectou com o Google entra direto, sem tela de login!
      </p>
    </section>
  );
}
