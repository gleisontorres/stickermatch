import type { SupabaseClient } from "@supabase/supabase-js";

/** Tamanho máximo de linhas por upsert para evitar payload grande. */
const DEFAULT_CHUNK = 250;

export interface ColecaoUpsertRow {
  figurinha_id: string;
  quantidade: number;
}

/**
 * Aplica upserts na tabela `colecao` em lotes.
 */
export async function chunkedColecaoUpsert(
  supabase: SupabaseClient,
  userId: string,
  rows: ColecaoUpsertRow[],
  options?: {
    chunkSize?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<void> {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK;
  const payload = rows.map((r) => ({
    user_id: userId,
    figurinha_id: r.figurinha_id,
    quantidade: r.quantidade,
  }));

  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from("colecao").upsert(chunk, {
      onConflict: "user_id,figurinha_id",
    });
    if (error) {
      throw new Error(error.message);
    }
    options?.onProgress?.(
      Math.min(i + chunk.length, payload.length),
      payload.length,
    );
  }
}

/**
 * Remove linhas da coleção do usuário para os IDs informados (em lotes).
 */
export async function chunkedColecaoDelete(
  supabase: SupabaseClient,
  userId: string,
  figurinhaIds: string[],
  chunkSize = 500,
): Promise<void> {
  for (let i = 0; i < figurinhaIds.length; i += chunkSize) {
    const chunk = figurinhaIds.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("colecao")
      .delete()
      .eq("user_id", userId)
      .in("figurinha_id", chunk);
    if (error) {
      throw new Error(error.message);
    }
  }
}
