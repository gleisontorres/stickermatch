"use client";

import type { Figurinha } from "@/lib/types";

import { QtySelector } from "@/components/qty-selector";
import { cn } from "@/lib/utils";

interface FigurinhaCardProps {
  figurinha: Figurinha;
  quantidade: number;
  disabled?: boolean;
  onQuantidadeChange: (figurinhaId: string, next: number) => void;
}

function cardToneClass(quantidade: number): string {
  if (quantidade === 0) {
    return "border-border bg-muted/35";
  }
  if (quantidade === 1) {
    return "border-emerald-500/35 bg-emerald-500/[0.09]";
  }
  return "border-amber-500/45 bg-amber-400/[0.14]";
}

/**
 * Cartão compacto de figurinha com número, nome e seletor de quantidade.
 */
export function FigurinhaCard({
  figurinha,
  quantidade,
  disabled = false,
  onQuantidadeChange,
}: FigurinhaCardProps) {
  const numLabel =
    figurinha.numero != null ? `#${figurinha.numero}` : figurinha.id;

  return (
    <article
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3 shadow-sm transition-colors",
        cardToneClass(quantidade),
      )}
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
      <QtySelector
        value={quantidade}
        disabled={disabled}
        onChange={(next) => onQuantidadeChange(figurinha.id, next)}
      />
    </article>
  );
}
