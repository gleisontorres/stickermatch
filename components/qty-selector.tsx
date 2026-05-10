"use client";

import { Button } from "@/components/ui/button";

interface QtySelectorProps {
  /** Quantidade atual (inclui 0). */
  value: number;
  /** Valor mínimo inclusive (default 0). */
  min?: number;
  /** Valor máximo inclusive (default 99). */
  max?: number;
  disabled?: boolean;
  /** Chamado após clique em +/- com o novo valor já limitado a [min, max]. */
  onChange: (next: number) => void;
}

/**
 * Botões +/- para ajustar quantidade na coleção (mobile-friendly).
 */
export function QtySelector({
  value,
  min = 0,
  max = 99,
  disabled = false,
  onChange,
}: QtySelectorProps) {
  const canDec = value > min && !disabled;
  const canInc = value < max && !disabled;

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        disabled={!canDec}
        aria-label="Diminuir quantidade"
        onClick={() => onChange(value - 1)}
      >
        −
      </Button>
      <span
        className="text-muted-foreground min-w-[1.5rem] text-center text-sm font-medium tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        disabled={!canInc}
        aria-label="Aumentar quantidade"
        onClick={() => onChange(value + 1)}
      >
        +
      </Button>
    </div>
  );
}
