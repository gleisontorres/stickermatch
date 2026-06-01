"use client";

import type { Figurinha } from "@/lib/types";

import { QtySelector } from "@/components/qty-selector";
import {
  isFigurinhaTipoLogo,
  isFigurinhaTipoSelecao,
  normalizeFigurinhaTipo,
} from "@/lib/album/figurinha-tipo";
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

const CARD_BG_HAS =
  "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #d97706 100%)";
const CARD_BG_REPEATED =
  "linear-gradient(135deg, #14532d 0%, #166534 60%, #b45309 100%)";
const CARD_BG_EMPTY =
  "linear-gradient(135deg, #111827 0%, #1f2937 100%)";

/** Tema CollectHub (verde / âmbar) por quantidade. */
function cardBackground(quantidade: number): string {
  if (quantidade === 0) {
    return CARD_BG_EMPTY;
  }
  if (quantidade >= 2) {
    return CARD_BG_REPEATED;
  }
  return CARD_BG_HAS;
}

/** Borda logo/seleção com figurinha (não em repetidas). */
function cardBorder(
  figurinha: Figurinha,
  quantidade: number,
): string | undefined {
  if (quantidade === 0 || quantidade >= 2) {
    return undefined;
  }
  if (isFigurinhaTipoLogo(figurinha)) {
    return "1.5px solid #60a5fa";
  }
  if (isFigurinhaTipoSelecao(figurinha)) {
    return "1.5px solid #fbbf24";
  }
  return undefined;
}

/** Rótulo discreto do tipo (sem pill). */
function tipoLabel(figurinha: Figurinha): string {
  const tipo = normalizeFigurinhaTipo(figurinha.tipo);
  if (tipo === "especial") {
    const sc = figurinha.selecao_codigo?.trim().toUpperCase() ?? "";
    if (sc === "CC") {
      return "CC";
    }
    if (sc === "FWC") {
      return "FWC";
    }
    return "Especial";
  }
  switch (tipo) {
    case "jogador":
      return "👟 Jog";
    case "logo":
      return "🛡️ Logo";
    case "selecao":
      return "👥 Sel";
    default:
      return figurinha.tipo;
  }
}

/** Fundo do pill do código — alinhado ao destaque do card (verde/azul/cinza). */
function codigoBadgeBg(figurinha: Figurinha, quantidade: number): string {
  if (quantidade === 0) {
    return "#52525b";
  }
  if (isFigurinhaTipoLogo(figurinha)) {
    return "#3b82f6";
  }
  if (isFigurinhaTipoSelecao(figurinha)) {
    return "#f59e0b";
  }
  const tipo = normalizeFigurinhaTipo(figurinha.tipo);
  if (tipo === "especial") {
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
  const border = cardBorder(figurinha, quantidade);

  return (
    <article
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-xl p-3 shadow-sm transition-[filter]",
        interactive &&
          "ring-ring cursor-pointer hover:brightness-110 active:brightness-95",
      )}
      style={{
        background: cardBackground(quantidade),
        ...(border ? { border } : {}),
      }}
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
      <div className="flex min-w-0 flex-col gap-2">
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
