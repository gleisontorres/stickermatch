"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const SNAP_MS = 300;

/** Classe glassmorphism por quantidade. */
function cardGlassClass(quantidade: number): string {
  return quantidade === 0 ?
      "figurinha-card-glass-empty"
    : "figurinha-card-glass-has";
}

/** Borda azul (logo) ou amarela (seleção) com figurinha única. */
function cardBorderStyle(
  figurinha: Figurinha,
  quantidade: number,
): { border: string } | undefined {
  if (quantidade === 0 || quantidade >= 2) {
    return undefined;
  }
  if (isFigurinhaTipoLogo(figurinha)) {
    return { border: "1.5px solid #60a5fa" };
  }
  if (isFigurinhaTipoSelecao(figurinha)) {
    return { border: "1.5px solid #fbbf24" };
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
  const borderStyle = cardBorderStyle(figurinha, quantidade);

  const [snap, setSnap] = useState(false);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSnap = useCallback(() => {
    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
    }
    setSnap(true);
    snapTimerRef.current = setTimeout(() => {
      setSnap(false);
      snapTimerRef.current = null;
    }, SNAP_MS);
  }, []);

  useEffect(
    () => () => {
      if (snapTimerRef.current) {
        clearTimeout(snapTimerRef.current);
      }
    },
    [],
  );

  const handleQuantidadeChange = useCallback(
    (next: number) => {
      if (next > quantidade) {
        triggerSnap();
      }
      onQuantidadeChange(figurinha.id, next);
    },
    [figurinha.id, onQuantidadeChange, quantidade, triggerSnap],
  );

  return (
    <article
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden p-3 transition-[filter]",
        cardGlassClass(quantidade),
        snap && "figurinha-card-snap figurinha-card-snap-glow",
        interactive &&
          "ring-ring cursor-pointer hover:brightness-110 active:brightness-95",
      )}
      style={borderStyle}
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
          onChange={handleQuantidadeChange}
        />
      )}
      </div>
    </article>
  );
}
