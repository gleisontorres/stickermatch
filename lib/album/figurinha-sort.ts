import type { Figurinha } from "@/lib/types";

import {
  COPA_ESPECIAIS_BUCKET_ORDER,
  copaBucketForFigurinha,
  GRUPOS_ORDEM,
} from "@/lib/album/copa-groups";
import {
  albumGroupTitle,
  ESPECIAIS_SELECTION_TITLE_CC,
  ESPECIAIS_SELECTION_TITLE_FWC,
} from "@/lib/album/group-title";

function bucketSortRank(bucket: string): number {
  const letterIdx = (GRUPOS_ORDEM as readonly string[]).indexOf(bucket);
  if (letterIdx >= 0) {
    return letterIdx;
  }
  const espIdx = (COPA_ESPECIAIS_BUCKET_ORDER as readonly string[]).indexOf(
    bucket,
  );
  if (espIdx >= 0) {
    return GRUPOS_ORDEM.length + espIdx;
  }
  return GRUPOS_ORDEM.length + COPA_ESPECIAIS_BUCKET_ORDER.length;
}

/** Mesma prioridade de sub‑seções que `buildSelectionGroups` no álbum. */
function selectionSortRank(title: string): number {
  if (title === ESPECIAIS_SELECTION_TITLE_FWC) {
    return 1;
  }
  if (title === ESPECIAIS_SELECTION_TITLE_CC) {
    return 2;
  }
  if (title === "Especiais") {
    return 3;
  }
  return 0;
}

/**
 * Ordena figurinhas como no álbum: grupo Copa (A–L, especiais) → seleção → número.
 */
export function compareFigurinhasAlbumOrder(a: Figurinha, b: Figurinha): number {
  const bucketA = copaBucketForFigurinha(a);
  const bucketB = copaBucketForFigurinha(b);
  const rankA = bucketSortRank(bucketA);
  const rankB = bucketSortRank(bucketB);
  if (rankA !== rankB) {
    return rankA - rankB;
  }

  const titleA = albumGroupTitle(a);
  const titleB = albumGroupTitle(b);
  const selRankA = selectionSortRank(titleA);
  const selRankB = selectionSortRank(titleB);
  if (selRankA !== selRankB) {
    return selRankA - selRankB;
  }
  if (titleA !== titleB) {
    return titleA.localeCompare(titleB, "pt-BR");
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
