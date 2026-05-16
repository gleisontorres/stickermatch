import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnvOrThrow } from "@/lib/supabase/env";

/**
 * Cliente Supabase com **service role** (ignora RLS). Use só em Route Handlers server-side.
 */
export function createServiceRoleClient() {
  const { url } = getSupabasePublicEnvOrThrow();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    throw new Error(
      "Defina SUPABASE_SERVICE_ROLE_KEY no ambiente para operações privilegiadas.",
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
