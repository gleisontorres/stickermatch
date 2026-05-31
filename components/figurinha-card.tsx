"use client";

import type { Figurinha } from "@/lib/types";

import { QtySelector } from "@/components/qty-selector";
import { WavingFlag } from "@/components/waving-flag";
import { cn, formatCodigo } from "@/lib/utils";

interface FigurinhaCardProps {
  figurinha: Figurinha;
  quantidade: number;
  disabled?: boolean;
  /** Modo cadastro rápido: toque decrementa (sem +/−). */
  quickTapMode?: boolean;
  onQuickTap?: () => void;
  onQuantidadeChange: (figurinhaId: string, next: number) => void;
}

/** Fundo do card no álbum (estilo Panini: vazio = cinza, preenchido = colorido). */
function cardToneClass(figurinha: Figurinha, quantidade: number): string {
  if (quantidade === 0) {
    return "border-zinc-500/35 bg-zinc-600/20 dark:border-zinc-600 dark:bg-zinc-800/75";
  }
  if (
    quantidade >= 1 &&
    (figurinha.tipo === "logo" || figurinha.tipo === "selecao")
  ) {
    return "border-accent/45 bg-accent/[0.14]";
  }
  return "border-primary/40 bg-primary/[0.11]";
}

type TipoBadge =
  | { variant: "text"; text: string; bg: string }
  | { variant: "cc"; bg: string };

/** Aparência do badge de tipo (fundo sólido + rótulo curto ou ícone CC). */
function tipoBadgeStyle(figurinha: Figurinha): TipoBadge {
  if (figurinha.tipo === "especial") {
    const sc = figurinha.selecao_codigo?.trim().toUpperCase() ?? "";
    if (sc === "CC") {
      return { variant: "cc", bg: "#ef4444" };
    }
    if (sc === "FWC") {
      return { variant: "text", text: "⭐ FWC", bg: "#eab308" };
    }
    return { variant: "text", text: "⭐ Esp", bg: "#eab308" };
  }
  switch (figurinha.tipo) {
    case "jogador":
      return { variant: "text", text: "👟 Jog", bg: "#10b981" };
    case "logo":
      return { variant: "text", text: "🛡️ Logo", bg: "#6366f1" };
    case "selecao":
      return { variant: "text", text: "👥 Sel", bg: "#f59e0b" };
    default: {
      const _never: never = figurinha.tipo;
      return _never;
    }
  }
}

/**
 * Cartão compacto de figurinha com código/número catálogo, nome e seletor de quantidade.
 */
export function FigurinhaCard({
  figurinha,
  quantidade,
  disabled = false,
  quickTapMode = false,
  onQuickTap,
  onQuantidadeChange,
}: FigurinhaCardProps) {
  /** Código Panini quando a API envia `codigo`; caso contrário o `id` do catálogo. */
  const f = figurinha as Figurinha & { codigo?: string | null };
  const codigoLabel =
    typeof f.codigo === "string" && f.codigo.trim() ? f.codigo.trim()
    : f.id;
  const codigoDisplay = formatCodigo(codigoLabel);

  const interactive = quickTapMode && quantidade > 0 && !disabled;
  const tipoBadge = tipoBadgeStyle(figurinha);

  return (
    <article
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-xl border p-3 shadow-sm transition-colors",
        cardToneClass(figurinha, quantidade),
        interactive && "ring-ring cursor-pointer hover:bg-muted/25 active:bg-muted/40",
      )}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={
        interactive ?
          () => {
            onQuickTap?.();
          }
        : undefined
      }
      onKeyDown={
        interactive ?
          (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onQuickTap?.();
            }
          }
        : undefined
      }
    >
      <WavingFlag selecaoCodigo={figurinha.selecao_codigo} />
      <div className="relative z-10 flex min-w-0 flex-col gap-2">
      <div className="min-w-0 space-y-0.5">
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wide">
          <span>{codigoDisplay}</span>
          <span
            className={cn(
              "max-w-[52%] shrink-0 truncate rounded-full px-2.5 py-1 text-xs font-bold tracking-normal text-white normal-case",
              tipoBadge.variant === "cc" && "inline-flex items-center gap-1",
            )}
            style={{ backgroundColor: tipoBadge.bg }}
          >
            {tipoBadge.variant === "cc" ?
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/bottle.png"
                  alt="garrafa"
                  className="shrink-0"
                  style={{
                    width: "10px",
                    height: "16px",
                    filter: "invert(1)",
                  }}
                />
                <span>CC</span>
              </>
            : tipoBadge.text}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {figurinha.nome}
        </h3>
      </div>
      {quickTapMode ?
        <div className="text-muted-foreground space-y-1 text-center text-xs">
          <p className="text-foreground text-base font-semibold tabular-nums">
            {quantidade === 0 ? "Não tenho" : quantidade === 1 ? "Tenho 1" : `${quantidade} repetidas`}
          </p>
          {quantidade > 0 ?
            <p>Toque para registrar falta (−1)</p>
          : null}
        </div>
      : (
        <QtySelector
          value={quantidade}
          disabled={disabled}
          onChange={(next) => onQuantidadeChange(figurinha.id, next)}
        />
      )}
      </div>
    </article>
  );
}
