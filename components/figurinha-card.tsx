"use client";

import type { Figurinha } from "@/lib/types";

import { QtySelector } from "@/components/qty-selector";
import { cn } from "@/lib/utils";

interface FigurinhaCardProps {
  figurinha: Figurinha;
  quantidade: number;
  disabled?: boolean;
  /** Modo cadastro rápido: toque decrementa (sem +/−). */
  quickTapMode?: boolean;
  onQuickTap?: () => void;
  onQuantidadeChange: (figurinhaId: string, next: number) => void;
}

function cardToneClass(quantidade: number): string {
  if (quantidade === 0) {
    return "border-border bg-muted/35";
  }
  if (quantidade === 1) {
    return "border-primary/40 bg-primary/[0.11]";
  }
  return "border-secondary/45 bg-secondary/[0.14]";
}

/**
 * Cartão compacto de figurinha com número, nome e seletor de quantidade.
 */
export function FigurinhaCard({
  figurinha,
  quantidade,
  disabled = false,
  quickTapMode = false,
  onQuickTap,
  onQuantidadeChange,
}: FigurinhaCardProps) {
  const numLabel =
    figurinha.numero != null ? `#${figurinha.numero}` : figurinha.id;

  const interactive = quickTapMode && quantidade > 0 && !disabled;

  return (
    <article
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3 shadow-sm transition-colors",
        cardToneClass(quantidade),
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
      <div className="min-w-0 space-y-0.5">
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wide">
          <span>{numLabel}</span>
          <span className="truncate normal-case">{figurinha.tipo}</span>
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
    </article>
  );
}
