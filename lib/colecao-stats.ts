/**
 * Métricas derivadas do catálogo e da coleção do usuário.
 */

/** Contagens agregadas para dashboard e relatórios. */
export interface ColecaoAggregates {
  /** Figurinhas com pelo menos uma cópia (quantidade ≥ 1). */
  ownedCount: number;
  /** Figurinhas sem cópia cadastrada (quantidade 0 ou ausente em `colecao`). */
  faltasCount: number;
  /** Quantidade de tipos diferentes com repetida (quantidade > 1). */
  repetidasTypes: number;
  /** Soma das cópias extras (quantidade − 1 para cada tipo com q > 1). */
  surplusCopies: number;
}

/**
 * Calcula métricas percorrendo todos os IDs do catálogo e o mapa de quantidades.
 */
export function computeColecaoAggregates(
  catalogFigurinhaIds: readonly string[],
  qtyByFigurinhaId: ReadonlyMap<string, number>,
): ColecaoAggregates {
  let ownedCount = 0;
  let faltasCount = 0;
  let repetidasTypes = 0;
  let surplusCopies = 0;

  for (const id of catalogFigurinhaIds) {
    const q = qtyByFigurinhaId.get(id) ?? 0;
    if (q === 0) {
      faltasCount += 1;
    } else {
      ownedCount += 1;
      if (q > 1) {
        repetidasTypes += 1;
        surplusCopies += q - 1;
      }
    }
  }

  return { ownedCount, faltasCount, repetidasTypes, surplusCopies };
}
