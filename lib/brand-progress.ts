/**
 * Estilos de preenchimento para barras de progresso da marca CollectHub.
 */
import type { CSSProperties } from "react";

/**
 * Estilo da parte preenchida das barras de progresso da marca:
 * gradiente horizontal até completar; ao chegar em 100%, dourado com brilho.
 */
export function brandProgressBarStyle(percent: number): CSSProperties {
  const pct = Math.min(100, Math.max(0, percent));
  if (pct >= 100) {
    return {
      width: "100%",
      background: "#f59e0b",
      boxShadow: "0 0 8px rgba(245, 158, 11, 0.6)",
    };
  }
  return {
    width: `${pct}%`,
    background: "linear-gradient(90deg, #10b981, #f59e0b)",
  };
}
