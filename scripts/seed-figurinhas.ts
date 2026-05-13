/**
 * Seed idempotente do catálogo `figurinhas` no Supabase (service role, ignora RLS).
 * Usa apenas HTTP PostgREST (`fetch`) para não depender de WebSocket / Realtime no Node 18.
 * Requer migrations aplicadas, inclusive `002_add_grupo.sql`, antes do primeiro run com `grupo`.
 */

import { readFileSync, existsSync } from "fs";
import path from "path";

const VALID_TIPOS = new Set<string>([
  "jogador",
  "logo",
  "especial",
  "selecao",
]);

/** Entrada bruta do catálogo JSON (inclui `todo`, ignorado no payload do banco). */
interface FigurinhaJson {
  id: string;
  numero?: number | null;
  nome: string;
  selecao?: string | null;
  selecao_codigo?: string | null;
  grupo?: string | null;
  tipo: string;
  posicao?: string | null;
  imagem_url?: string | null;
  todo?: boolean;
}

/** Linha enviada ao Postgres (sem `created_at` para preservar valor em updates). */
interface FigurinhaRow {
  id: string;
  numero: number | null;
  nome: string;
  selecao: string | null;
  selecao_codigo: string | null;
  grupo: string | null;
  tipo: "jogador" | "logo" | "especial" | "selecao";
  posicao: string | null;
  imagem_url: string | null;
}

/**
 * Lê chaves simples de um arquivo .env (sem substituir variáveis).
 */
function loadDotEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!existsSync(filePath)) {
    return env;
  }
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/**
 * Converte um item do JSON na linha de upsert, sem filtrar `todo`.
 */
function toRow(raw: FigurinhaJson): FigurinhaRow {
  if (!raw.id?.trim()) {
    throw new Error("Figurinha sem id.");
  }
  if (!VALID_TIPOS.has(raw.tipo)) {
    throw new Error(`Figurinha ${raw.id}: tipo inválido "${raw.tipo}".`);
  }
  const tipo = raw.tipo as FigurinhaRow["tipo"];

  return {
    id: raw.id.trim(),
    numero: raw.numero ?? null,
    nome: raw.nome,
    selecao: raw.selecao ?? null,
    selecao_codigo: raw.selecao_codigo ?? null,
    grupo: raw.grupo ?? null,
    tipo,
    posicao: raw.posicao ?? null,
    imagem_url: raw.imagem_url ?? null,
  };
}

const BATCH_SIZE = 500;

/**
 * Upsert via PostgREST (merge em conflito na PK `id`).
 * Evita `@supabase/supabase-js` no script CLI (Realtime/WebSocket falham no Node 18 sem `ws`).
 */
async function upsertFigurinhasBatch(
  supabaseUrl: string,
  serviceRoleKey: string,
  batch: FigurinhaRow[],
): Promise<void> {
  const base = supabaseUrl.replace(/\/+$/, "");
  const endpoint = `${base}/rest/v1/figurinhas?on_conflict=id`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(batch),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 800)}`);
  }
}

/**
 * Conta linhas na tabela via PostgREST (`Prefer: count=exact`).
 */
async function countFigurinhasRows(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<number> {
  const base = supabaseUrl.replace(/\/+$/, "");
  const res = await fetch(`${base}/rest/v1/figurinhas?select=id`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  const range = res.headers.get("content-range");
  if (!range) {
    throw new Error("Resposta sem Content-Range ao contar figurinhas.");
  }
  const parts = range.split("/");
  const totalStr = parts.length >= 2 ? parts[1] : "";
  if (!totalStr || totalStr === "*") {
    throw new Error(`Content-Range inesperado: ${range}`);
  }
  return Number.parseInt(totalStr, 10);
}

/**
 * Carrega `data/figurinhas.json` e faz upsert na tabela `figurinhas` com service role.
 */
async function main(): Promise<void> {
  const cwd = process.cwd();
  const env = {
    ...loadDotEnvFile(path.join(cwd, ".env")),
    ...loadDotEnvFile(path.join(cwd, ".env.local")),
  };

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local (seed usa apenas server-side).",
    );
  }

  const jsonPath = path.join(cwd, "data", "figurinhas.json");
  if (!existsSync(jsonPath)) {
    throw new Error(`Arquivo não encontrado: ${jsonPath}`);
  }

  const parsed = JSON.parse(readFileSync(jsonPath, "utf8")) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("figurinhas.json deve ser um array.");
  }

  const rows: FigurinhaRow[] = parsed.map((item, index) => {
    try {
      return toRow(item as FigurinhaJson);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Índice ${index}: ${msg}`);
    }
  });

  let processed = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    try {
      await upsertFigurinhasBatch(supabaseUrl, serviceRoleKey, batch);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      let hint = "";
      if (msg.includes("grupo") || msg.includes("schema cache")) {
        hint =
          " Rode antes o SQL em supabase/migrations/002_add_grupo.sql no SQL Editor (coluna grupo + índice).";
      }
      if (
        msg.includes("figurinhas_tipo_check") ||
        msg.includes("violates check constraint")
      ) {
        hint =
          " Rode supabase/migrations/007_figurinha_tipo_selecao.sql no SQL Editor (tipo selecao).";
      }
      throw new Error(
        `Upsert falhou no lote ${i}-${i + batch.length}: ${msg}.${hint}`,
      );
    }
    processed += batch.length;
    console.log(`Seed: ${processed}/${rows.length} figurinhas sincronizadas.`);
  }

  console.log(
    `Concluído. JSON: ${rows.length} registros enviados (upsert PostgREST ?on_conflict=id + Prefer: resolution=merge-duplicates).`,
  );

  const totalDb = await countFigurinhasRows(supabaseUrl, serviceRoleKey);
  console.log(`Verificação no banco: tabela figurinhas tem ${totalDb} linha(s).`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
