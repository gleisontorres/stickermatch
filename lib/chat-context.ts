import type { SupabaseClient } from "@supabase/supabase-js";

import { computeColecaoAggregates } from "@/lib/colecao-stats";
import { fetchMatchPartnerEntries } from "@/lib/fetch-match-partner-entries";
import type { MatchPartnerEntry } from "@/lib/types";

const MAX_MATCH_PARTNERS_IN_PROMPT = 35;
const MAX_OTHERS_REPETIDAS_ROWS = 1200;

/**
 * Monta o bloco de dados injetados no system prompt do chat (tempo real).
 */
export async function buildChatDataBlock(
  supabase: SupabaseClient,
  uid: string,
): Promise<string> {
  const [perfilRes, figRes, colRes, outrosRepRes] = await Promise.all([
    supabase
      .from("perfis")
      .select("nome, email, whatsapp")
      .eq("id", uid)
      .maybeSingle(),
    supabase
      .from("figurinhas")
      .select("id, nome, selecao, selecao_codigo, tipo, numero")
      .order("numero", { ascending: true, nullsFirst: false }),
    supabase
      .from("colecao")
      .select("figurinha_id, quantidade")
      .eq("user_id", uid),
    supabase
      .from("colecao")
      .select("user_id, figurinha_id, quantidade")
      .neq("user_id", uid)
      .gt("quantidade", 1)
      .limit(MAX_OTHERS_REPETIDAS_ROWS),
  ]);

  if (figRes.error) {
    throw new Error(figRes.error.message);
  }
  if (colRes.error) {
    throw new Error(colRes.error.message);
  }
  if (outrosRepRes.error) {
    throw new Error(outrosRepRes.error.message);
  }
  if (perfilRes.error) {
    console.error("[chat-context] perfil:", perfilRes.error.message);
  }

  let matchEntries: MatchPartnerEntry[] = [];
  try {
    matchEntries = await fetchMatchPartnerEntries(supabase, uid);
  } catch (err) {
    console.error("[chat-context] fetchMatchPartnerEntries failed:", err);
  }

  const figurinhasRows = figRes.data ?? [];
  const catalogIds = figurinhasRows.map((r) => r.id);
  const qtyByFigurinhaId = new Map(
    (colRes.data ?? []).map((r) => [r.figurinha_id, r.quantidade]),
  );

  const aggregates = computeColecaoAggregates(catalogIds, qtyByFigurinhaId);
  const nomePorFig = new Map(figurinhasRows.map((r) => [r.id, r.nome]));

  const repetidasUsuario = figurinhasRows
    .filter((f) => (qtyByFigurinhaId.get(f.id) ?? 0) > 1)
    .map((f) => ({
      id: f.id,
      nome: f.nome,
      q: qtyByFigurinhaId.get(f.id) ?? 0,
    }));

  const blocoRepetidasUsuario =
    repetidasUsuario.length === 0 ?
      "_Nenhuma figurinha com quantidade > 1._"
    : repetidasUsuario
        .map((r) => `${r.q}× ${r.nome} (${r.id})`)
        .join("\n");

  const colecaoCompact = figurinhasRows.map((f) => ({
    id: f.id,
    nome: f.nome,
    selecao: f.selecao ?? "",
    tipo: f.tipo,
    q: qtyByFigurinhaId.get(f.id) ?? 0,
  }));

  const perfil = perfilRes.data;
  const nomeUsuario =
    perfil?.nome?.trim() ||
    perfil?.email?.trim() ||
    "colecionador(a)";

  const outrosRows = outrosRepRes.data ?? [];
  const outrosUserIds = [...new Set(outrosRows.map((r) => r.user_id))];

  let outrosPerfisRows: { id: string; nome: string | null; email: string | null }[] =
    [];
  if (outrosUserIds.length > 0) {
    const { data: perfisBatch, error: perfisBatchError } = await supabase
      .from("perfis")
      .select("id, nome, email")
      .in("id", outrosUserIds);

    if (perfisBatchError) {
      console.error("[chat-context] perfis batch:", perfisBatchError.message);
    } else {
      outrosPerfisRows = perfisBatch ?? [];
    }
  }

  const nomePorUsuario = new Map(
    outrosPerfisRows.map((p) => [
      p.id,
      p.nome?.trim() || p.email?.trim() || p.id.slice(0, 8),
    ]),
  );

  const outrosLinhas = outrosRows.map((row) => {
    const nomeFig = nomePorFig.get(row.figurinha_id) ?? row.figurinha_id;
    const nomeUser =
      nomePorUsuario.get(row.user_id) ?? `${row.user_id.slice(0, 8)}…`;
    return `${nomeUser}\t${row.figurinha_id}\t${nomeFig}\tqty ${row.quantidade}`;
  });

  const matchesSlice = matchEntries.slice(0, MAX_MATCH_PARTNERS_IN_PROMPT);
  const blocoMatches = matchesSlice
    .map((m, i) => {
      const wa =
        m.whatsapp?.replace(/\D/g, "") ?
          `https://wa.me/${m.whatsapp.replace(/\D/g, "")}`
        : null;
      const dou = m.eu_dou.map((x) => x.label).join("; ");
      const rec = m.eu_recebo.map((x) => x.label).join("; ");
      return [
        `${i + 1}. ${m.displayName}${wa ? ` · WhatsApp: ${wa}` : ""}`,
        `   Mútua: ${m.isMutual ? `sim (até ${m.scoreMutual} em equilíbrio)` : "não"}`,
        `   Você dá: ${dou || "—"}`,
        `   Você recebe: ${rec || "—"}`,
      ].join("\n");
    })
    .join("\n\n");

  const payloadResumo = {
    usuarioId: uid,
    nomeExibicao: nomeUsuario,
    whatsappUsuario: perfil?.whatsapp ?? null,
    catalogoTotal: catalogIds.length,
    metricas: aggregates,
  };

  return [
    "### Perfil do usuário autenticado",
    JSON.stringify(payloadResumo),
    "",
    "### Repetidas do usuário (lista fechada — obedeça ao listar repetidas)",
    `Tipos com quantidade > 1 no cadastro: **${repetidasUsuario.length}** (igual a metricas.repetidasTypes).`,
    blocoRepetidasUsuario,
    "Cada linha acima deve aparecer na sua resposta quando o usuário pedir repetidas (nomes e ids como estão); não omita linhas nem substitua por resumos.",
    "",
    "### Coleção no catálogo (uma linha JSON por figurinha: id, nome, selecao, tipo, q)",
    "Use `q` como quantidade cadastrada (0 = falta).",
    JSON.stringify(colecaoCompact),
    "",
    "### Matches agregados (prioridade: mútuos primeiro; até "
      + String(MAX_MATCH_PARTNERS_IN_PROMPT)
      + " parceiros)",
    matchEntries.length === 0 ?
      "_Nenhum match na view ou falha ao carregar._"
    : blocoMatches || "_Lista vazia._",
    "",
    "### Repetidas de outras pessoas (amostra até "
      + String(MAX_OTHERS_REPETIDAS_ROWS)
      + " linhas)",
    "Formato por linha: NomeOuId\tFIG_ID\tNome figurinha\tqty N",
    outrosLinhas.length ?
      outrosLinhas.join("\n")
    : "_Nenhuma repetida de outros usuários nesta amostra._",
    "",
    "### Notas",
    `- Total de parceiros com match (lista completa truncada no prompt): ${matchEntries.length}.`,
    `- Linhas de repetidas de terceiros neste bloco: ${outrosLinhas.length}.`,
  ].join("\n");
}
