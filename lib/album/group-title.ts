import type { Figurinha } from "@/lib/types";

/**
 * Chave de agrupamento do álbum (seleção ou "Especiais").
 */
export function albumGroupTitle(figurinha: Figurinha): string {
  if (figurinha.tipo === "especial") {
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
