/**
 * Agrega linhas da view `matches` por outro usuário e ordena (mútuas primeiro).
 */

export interface RawMatchRow {
  user_oferta: string;
  user_precisa: string;
  figurinha_id: string;
}

/** Match agregado por parceiro de troca. */
export interface PartnerMatchModel {
  partnerId: string;
  eu_dou: string[];
  eu_recebo: string[];
  scoreMutual: number;
  isMutual: boolean;
}

/**
 * Agrupa oportunidades por `partnerId` e ordena: trocas mútuas antes,
 * depois por `scoreMutual` desc e por volume total.
 */
export function buildPartnerMatches(
  me: string,
  rows: RawMatchRow[],
): PartnerMatchModel[] {
  const map = new Map<
    string,
    { eu_dou: Set<string>; eu_recebo: Set<string> }
  >();

  function bucket(partnerId: string) {
    let b = map.get(partnerId);
    if (!b) {
      b = { eu_dou: new Set(), eu_recebo: new Set() };
      map.set(partnerId, b);
    }
    return b;
  }

  for (const row of rows) {
    // Parceiro tem repetida, você precisa: user_oferta = parceiro, user_precisa = eu.
    if (row.user_precisa === me) {
      bucket(row.user_oferta).eu_recebo.add(row.figurinha_id);
    }
    // Você tem repetida, parceiro precisa: user_oferta = eu, user_precisa = parceiro.
    if (row.user_oferta === me) {
      bucket(row.user_precisa).eu_dou.add(row.figurinha_id);
    }
  }

  const list: PartnerMatchModel[] = [...map.entries()].map(([partnerId, v]) => {
    const eu_dou = [...v.eu_dou];
    const eu_recebo = [...v.eu_recebo];
    const scoreMutual = Math.min(eu_dou.length, eu_recebo.length);
    const isMutual = eu_dou.length > 0 && eu_recebo.length > 0;
    return { partnerId, eu_dou, eu_recebo, scoreMutual, isMutual };
  });

  list.sort((a, b) => {
    if (a.isMutual !== b.isMutual) {
      return a.isMutual ? -1 : 1;
    }
    if (a.isMutual && b.isMutual && b.scoreMutual !== a.scoreMutual) {
      return b.scoreMutual - a.scoreMutual;
    }
    const sumA = a.eu_dou.length + a.eu_recebo.length;
    const sumB = b.eu_dou.length + b.eu_recebo.length;
    if (sumB !== sumA) {
      return sumB - sumA;
    }
    return b.scoreMutual - a.scoreMutual;
  });

  return list;
}
