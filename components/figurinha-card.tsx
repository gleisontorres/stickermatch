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

const CARD_BG_HAS = "linear-gradient(to right, #064e3b, #065f46)";
const CARD_BG_REPEATED = "linear-gradient(to right, #047857, #10b981)";
const CARD_BG_EMPTY = "linear-gradient(to right, #0a0a0a, #111111)";

/** Monocromático com acento único (verde) — igual para todos os tipos. */
function cardBackground(quantidade: number): string {
  if (quantidade === 0) {
    return CARD_BG_EMPTY;
  }
  if (quantidade >= 2) {
    return CARD_BG_REPEATED;
  }
  return CARD_BG_HAS;
}

/** Rótulo discreto do tipo (sem pill). */
function tipoLabel(figurinha: Figurinha): string {
  if (figurinha.tipo === "especial") {
    const sc = figurinha.selecao_codigo?.trim().toUpperCase() ?? "";
    if (sc === "CC") {
      return "CC";
    }
    if (sc === "FWC") {
      return "FWC";
    }
    return "Especial";
  }
  switch (figurinha.tipo) {
    case "jogador":
      return "👟 Jog";
    case "logo":
      return "🛡️ Logo";
    case "selecao":
      return "👥 Sel";
    default: {
      const _never: never = figurinha.tipo;
      return _never;
    }
  }
}

/** Fundo do pill do código — alinhado ao destaque do card (verde/azul/cinza). */
function codigoBadgeBg(figurinha: Figurinha, quantidade: number): string {
  if (quantidade === 0) {
    return "#52525b";
  }
  if (
    figurinha.tipo === "logo" ||
    figurinha.tipo === "selecao"
  ) {
    return "#3b82f6";
  }
  if (figurinha.tipo === "especial") {
    const sc = figurinha.selecao_codigo?.trim().toUpperCase() ?? "";
    if (sc === "CC") {
      return "#ef4444";
    }
    if (sc === "FWC") {
      return "#eab308";
    }
    return "#52525b";
  }
  return "#10b981";
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

  return (
    <article
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-xl border border-white/15 p-3 shadow-sm transition-[filter]",
        interactive &&
          "ring-ring cursor-pointer hover:brightness-110 active:brightness-95",
      )}
      style={{ background: cardBackground(quantidade) }}
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
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground shrink-0 text-[10px] font-medium tracking-normal">
            {tipoLabel(figurinha)}
          </span>
          <span
            className="max-w-[52%] shrink-0 truncate rounded-full px-2.5 py-1 text-xs font-bold tracking-normal text-white"
            style={{ backgroundColor: codigoBadgeBg(figurinha, quantidade) }}
          >
            {codigoDisplay}
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
