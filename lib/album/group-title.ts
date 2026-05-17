import type { Figurinha } from "@/lib/types";

/** Título do sub‑acordeão / chave das ações em massa das figurinhas FWC01–FWC20. */
export const ESPECIAIS_SELECTION_TITLE_FWC = "🏆 FWC — FIFA World Cup";

/** Título do sub‑acordeão / chave das ações em massa das figurinhas CC01–CC14. */
export const ESPECIAIS_SELECTION_TITLE_CC = "CC — Coca-Cola";

/**
 * Chave de agrupamento do álbum (seleção, FWC/CC ou outros "Especiais").
 */
export function albumGroupTitle(figurinha: Figurinha): string {
  if (figurinha.tipo === "especial") {
    const sc = figurinha.selecao_codigo?.trim().toUpperCase();
    if (sc === "FWC") {
      return ESPECIAIS_SELECTION_TITLE_FWC;
    }
    if (sc === "CC") {
      return ESPECIAIS_SELECTION_TITLE_CC;
    }
    return "Especiais";
  }
  return figurinha.selecao ?? "Outros";
}

/**
 * Lista todas as figurinhas de um grupo pelo título exibido na UI.
 */
export function figurinhasInGroup(
  figurinhas: Figurinha[],
  title: string,
): Figurinha[] {
  return figurinhas.filter((f) => albumGroupTitle(f) === title);
}
