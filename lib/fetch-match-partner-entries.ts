import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildPartnerMatches,
  type RawMatchRow,
} from "@/lib/partner-matches";
import type { MatchPartnerEntry } from "@/lib/types";

function figLabel(id: string, nomePorId: Map<string, string>): string {
  const nome = nomePorId.get(id);
  return nome ? `${id} · ${nome}` : id;
}

/**
 * Busca linhas da view `matches`, agrega por parceiro e enriquece nomes.
 */
export async function fetchMatchPartnerEntries(
  supabase: SupabaseClient,
  uid: string,
): Promise<MatchPartnerEntry[]> {
  const { data: matchRows, error: matchError } = await supabase
    .from("matches")
    .select("user_oferta, user_precisa, figurinha_id")
    .or(`user_precisa.eq.${uid},user_oferta.eq.${uid}`);

  if (matchError) {
    throw new Error(matchError.message);
  }

  const aggregated = buildPartnerMatches(
    uid,
    (matchRows ?? []) as RawMatchRow[],
  );

  const partnerIds = aggregated.map((m) => m.partnerId);
  const allFigIds = new Set<string>();
  for (const m of aggregated) {
    m.eu_dou.forEach((id) => allFigIds.add(id));
    m.eu_recebo.forEach((id) => allFigIds.add(id));
  }

  const figIdsArr = [...allFigIds];

  const [{ data: perfisRows }, { data: figurinhasRows }] = await Promise.all([
    partnerIds.length > 0
      ? supabase
          .from("perfis")
          .select("id, nome, email, whatsapp")
          .in("id", partnerIds)
      : Promise.resolve({ data: [] as const }),
    figIdsArr.length > 0
      ? supabase.from("figurinhas").select("id, nome").in("id", figIdsArr)
      : Promise.resolve({ data: [] as const }),
  ]);

  const perfilById = new Map(
    (perfisRows ?? []).map((p) => [
      p.id,
      {
        nome: p.nome,
        email: p.email,
        whatsapp: p.whatsapp,
      },
    ]),
  );

  const nomePorId = new Map(
    (figurinhasRows ?? []).map((f) => [f.id, f.nome]),
  );

  return aggregated.map((m) => {
    const perfil = perfilById.get(m.partnerId);
    const displayName =
      perfil?.nome?.trim() ||
      perfil?.email?.trim() ||
      `Usuário ${m.partnerId.slice(0, 8)}…`;

    return {
      partnerId: m.partnerId,
      displayName,
      whatsapp: perfil?.whatsapp ?? null,
      eu_dou: m.eu_dou.map((id) => ({
        id,
        label: figLabel(id, nomePorId),
      })),
      eu_recebo: m.eu_recebo.map((id) => ({
        id,
        label: figLabel(id, nomePorId),
      })),
      scoreMutual: m.scoreMutual,
      isMutual: m.isMutual,
    };
  });
}
