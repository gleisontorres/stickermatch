"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

const PIX_KEY = "11942454514";
const STORAGE_KEY = "hide_pix_banner";

/**
 * Banner discreto de apoio via PIX; visibilidade após hidratação + localStorage.
 */
export function DashboardPixBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const hidden = localStorage.getItem(STORAGE_KEY) === "true";
      if (!hidden) {
        setShow(true);
      }
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div
      className="flex items-start gap-3 rounded-xl p-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(245,158,11,0.05))",
        border: "1px solid rgba(16,185,129,0.2)",
      }}
    >
      <span className="text-xl">💚</span>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-sm leading-relaxed">
          O app foi feito com carinho pra facilitar a vida de quem coleciona. Se
          curtiu, apoie o projeto com qualquer valor via PIX, totalmente opcional!
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="text-primary bg-primary/10 rounded px-2 py-1 font-mono text-sm font-bold">
            {PIX_KEY}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(PIX_KEY).then(
                () => {
                  toast.success("Chave PIX copiada!");
                },
                () => {
                  toast.error("Não foi possível copiar.");
                },
              );
            }}
            className="text-muted-foreground hover:text-primary text-xs transition-colors"
          >
            copiar
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "true");
          } catch {
            /* ignore quota / private mode */
          }
          setShow(false);
        }}
        className="text-muted-foreground hover:text-foreground text-lg leading-none transition-colors"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}
