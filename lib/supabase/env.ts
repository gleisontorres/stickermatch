/**
 * Variáveis públicas do Supabase (URL + anon key) para uso em browser e servidor.
 */

/** Erro quando faltam credenciais públicas do Supabase no ambiente. */
export class SupabaseEnvError extends Error {
  constructor() {
    super(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local",
    );
    this.name = "SupabaseEnvError";
  }
}

/**
 * Retorna URL e anon key se ambas estiverem definidas (após trim).
 */
export function hasSupabasePublicEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anonKey);
}

/**
 * Lê credenciais públicas ou lança erro claro (uso em clientes Supabase).
 */
export function getSupabasePublicEnvOrThrow(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new SupabaseEnvError();
  }
  return { url, anonKey };
}
