import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnvOrThrow } from "@/lib/supabase/env";

/**
 * Cliente Supabase para uso no navegador (Client Components).
 * Usa cookies geridos pelo `@supabase/ssr` em conjunto com o middleware.
 */
export function createClient() {
  const { url, anonKey } = getSupabasePublicEnvOrThrow();
  return createBrowserClient(url, anonKey);
}
