import type { SupabaseClient } from "@supabase/supabase-js";

import { displayNameForAiPrompt } from "@/lib/display-name-for-ai-prompt";
import {
  buildPartnerMatches,
  type RawMatchRow,
} from "@/lib/partner-matches";
import type { MatchPartnerEntry } from "@/lib/types";

function dedupeMatchRows(rows: RawMatchRow[]): RawMatchRow[] {
  const seen = new Set<string>();
  const out: RawMatchRow[] = [];
  for (const r of rows) {
    const key = `${r.user_oferta}\0${r.user_precisa}\0${r.figurinha_id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(r);
  }
  return out;
}

function figLabel(id: string, nomePorId: Map<string, string>): string {
  const nome = nomePorId.get(id);
  return nome ? `${id} · ${nome}` : id;
}

interface RpcPartnerRow {
  id: string;
  nome: string | null;
  email: string | null;
  whatsapp: string | null;
  distancia_km: number | string | null;
}

function coerceKm(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Busca linhas da view `matches`, agrega por parceiro e enriquece nomes + distância (RPC segura).
 *
 * Usa duas queries com `.eq()` em vez de `.or(...)` na URL: UUIDs com hífens quebram o parser do
 * PostgREST no filtro OR embutido, e assim garantimos os dois sentidos (você precisa / você oferta).
 */
export async function fetchMatchPartnerEntries(
  supabase: SupabaseClient,
  uid: string,
): Promise<MatchPartnerEntry[]> {
  const selectCols = "user_oferta, user_precisa, figurinha_id";

  const [{ data: rowsEuPreciso, error: errPreciso }, { data: rowsEuDou, error: errDou }] =
    await Promise.all([
      supabase.from("matches").select(selectCols).eq("user_precisa", uid),
      supabase.from("matches").select(selectCols).eq("user_oferta", uid),
    ]);

  if (errPreciso) {
    throw new Error(errPreciso.message);
  }
  if (errDou) {
    throw new Error(errDou.message);
  }

  const matchRows = dedupeMatchRows([
    ...((rowsEuPreciso ?? []) as RawMatchRow[]),
    ...((rowsEuDou ?? []) as RawMatchRow[]),
  ]);

  const aggregated = buildPartnerMatches(uid, matchRows);

  const partnerIds = aggregated.map((m) => m.partnerId);
  const allFigIds = new Set<string>();
  for (const m of aggregated) {
    m.eu_dou.forEach((id) => allFigIds.add(id));
    m.eu_recebo.forEach((id) => allFigIds.add(id));
  }

  const figIdsArr = [...allFigIds];

  const [{ data: rpcRows, error: rpcError }, { data: figurinhasRows }, { data: colecaoCountRows }] =
    await Promise.all([
      partnerIds.length > 0
        ? supabase.rpc("partner_profiles_for_matches", {
            partner_ids: partnerIds,
          })
        : Promise.resolve({ data: [] as RpcPartnerRow[], error: null }),
      figIdsArr.length > 0
        ? supabase.from("figurinhas").select("id, nome").in("id", figIdsArr)
        : Promise.resolve({ data: [] as const }),
      partnerIds.length > 0
        ? supabase
            .from("colecao")
            .select("user_id")
            .in("user_id", partnerIds)
        : Promise.resolve({ data: [] as const }),
    ]);

  if (rpcError) {
    throw new Error(
      `${rpcError.message} — rode a migration de localização (006_localizacao.sql) e conceda execute em partner_profiles_for_matches.`,
    );
  }

  const partnerRowCounts = new Map<string, number>();
  for (const row of colecaoCountRows ?? []) {
    const id = row.user_id as string;
    partnerRowCounts.set(id, (partnerRowCounts.get(id) ?? 0) + 1);
  }

  const perfilById = new Map(
    ((rpcRows ?? []) as RpcPartnerRow[]).map((p) => [
      p.id,
      {
        nome: p.nome,
        email: p.email,
        whatsapp: p.whatsapp,
        distanciaKm: coerceKm(p.distancia_km),
      },
    ]),
  );

  const nomePorId = new Map(
    (figurinhasRows ?? []).map((f) => [f.id, f.nome]),
  );

  return aggregated.map((m) => {
    const perfil = perfilById.get(m.partnerId);
    const displayName = displayNameForAiPrompt(perfil?.nome, perfil?.email);

    return {
      partnerId: m.partnerId,
      displayName,
      whatsapp: perfil?.whatsapp ?? null,
      distanciaKm: perfil?.distanciaKm ?? null,
      partnerColecaoRowCount: partnerRowCounts.get(m.partnerId) ?? 0,
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
