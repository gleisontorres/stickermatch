import type { Figurinha } from "@/lib/types";

export type FigurinhaTipo = Figurinha["tipo"];

/**
 * Valor canônico de `figurinhas.tipo` no Postgres / seed: `selecao` (sem acento).
 * Aceita variantes com acento ou caixa diferente vindas de dados legados.
 */
export function normalizeFigurinhaTipo(
  raw: string | null | undefined,
): FigurinhaTipo | null {
  const t = (raw ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

  if (t === "selecao") {
    return "selecao";
  }
  if (t === "jogador") {
    return "jogador";
  }
  if (t === "logo") {
    return "logo";
  }
  if (t === "especial") {
    return "especial";
  }
  return null;
}

export function isFigurinhaTipoSelecao(
  figurinha: Pick<Figurinha, "tipo">,
): boolean {
  return normalizeFigurinhaTipo(figurinha.tipo) === "selecao";
}

export function isFigurinhaTipoLogo(
  figurinha: Pick<Figurinha, "tipo">,
): boolean {
  return normalizeFigurinhaTipo(figurinha.tipo) === "logo";
}
