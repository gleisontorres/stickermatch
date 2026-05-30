import type { Figurinha } from "@/lib/types";

import {
  COPA_ESPECIAIS_BUCKET_ORDER,
  copaBucketForFigurinha,
  grupoOrdemIndex,
  isAlbumTeamFigurinha,
  selecaoCodigoOrdemNoGrupo,
} from "@/lib/album/copa-groups";

function especialBucketSortRank(bucket: string): number {
  const espIdx = (COPA_ESPECIAIS_BUCKET_ORDER as readonly string[]).indexOf(
    bucket,
  );
  if (espIdx >= 0) {
    return espIdx;
  }
  return COPA_ESPECIAIS_BUCKET_ORDER.length;
}

/**
 * Ordena figurinhas da página Faltas: grupo Copa (A–L) → seleção oficial → número;
 * especiais (tipo ∉ jogador/logo/selecao) após todos os grupos.
 */
export function compareFigurinhasAlbumOrder(a: Figurinha, b: Figurinha): number {
  const tierA = isAlbumTeamFigurinha(a) ? 0 : 1;
  const tierB = isAlbumTeamFigurinha(b) ? 0 : 1;
  if (tierA !== tierB) {
    return tierA - tierB;
  }

  if (tierA === 0) {
    const grupoA = grupoOrdemIndex(a.grupo);
    const grupoB = grupoOrdemIndex(b.grupo);
    if (grupoA !== grupoB) {
      return grupoA - grupoB;
    }

    const selA = selecaoCodigoOrdemNoGrupo(a);
    const selB = selecaoCodigoOrdemNoGrupo(b);
    if (selA !== selB) {
      return selA - selB;
    }
  } else {
    const bucketA = copaBucketForFigurinha(a);
    const bucketB = copaBucketForFigurinha(b);
    const rankA = especialBucketSortRank(bucketA);
    const rankB = especialBucketSortRank(bucketB);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
  }

  const numA = a.numero ?? 999_999;
  const numB = b.numero ?? 999_999;
  if (numA !== numB) {
    return numA - numB;
  }

  return a.id.localeCompare(b.id);
}

/** Retorna cópia ordenada por `compareFigurinhasAlbumOrder`. */
export function sortFigurinhasAlbumOrder<T extends Figurinha>(items: T[]): T[] {
  return [...items].sort(compareFigurinhasAlbumOrder);
}
