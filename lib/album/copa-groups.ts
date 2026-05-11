import type { Figurinha } from "@/lib/types";

/** Ordem dos grupos no álbum físico Panini (Copa 2026). */
export const GRUPOS_ORDEM = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

/** Chave da seção externa para especiais e itens fora de A–L. */
export const ESPECIAIS_BUCKET = "Especiais";

/** Cor de destaque por grupo (hex) — usar com `style` para não depender de classes Tailwind dinâmicas. */
export const GRUPO_CORES: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
  E: "#8b5cf6",
  F: "#06b6d4",
  G: "#ec4899",
  H: "#f97316",
  I: "#84cc16",
  J: "#6366f1",
  K: "#14b8a6",
  L: "#d97706",
  [ESPECIAIS_BUCKET]: "#94a3b8",
};

const GRUPO_SET = new Set<string>(GRUPOS_ORDEM);

/**
 * Cor de acento para o cabeçalho do grupo no álbum.
 */
export function copaGroupAccentHex(copaKey: string): string {
  return GRUPO_CORES[copaKey] ?? "#94a3b8";
}

/**
 * Retorna a chave da seção do álbum (A–L ou bloco de especiais).
 * Qualquer `grupo` que não esteja em GRUPOS_ORDEM cai em Especiais.
 */
export function copaBucketForFigurinha(f: Pick<Figurinha, "grupo">): string {
  const g = f.grupo;
  if (g != null && GRUPO_SET.has(g)) {
    return g;
  }
  return ESPECIAIS_BUCKET;
}

/** Rótulo do header da seção externa (ex.: "Grupo A", "Especiais"). */
export function copaSectionLabel(bucket: string): string {
  if (bucket === ESPECIAIS_BUCKET) {
    return ESPECIAIS_BUCKET;
  }
  return `Grupo ${bucket}`;
}
