import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnvOrThrow } from "@/lib/supabase/env";

/**
 * Cliente Supabase no servidor (Server Components, Server Actions, Route Handlers).
 * Recria por requisição; não compartilhe entre requests.
 */
export function createClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabasePublicEnvOrThrow();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headersToApply) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Em Server Components o cookie store pode ser somente leitura;
          // o middleware deve atualizar a sessão quando possível.
        }
        void headersToApply;
      },
    },
  });
}
