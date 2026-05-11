import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import {
  getSupabasePublicEnvOrThrow,
  hasSupabasePublicEnv,
} from "@/lib/supabase/env";

export type UpdateSessionResult = {
  response: NextResponse;
  supabase: SupabaseClient | null;
  user: User | null;
};

/**
 * Atualiza a sessão Auth (cookies + headers de cache) antes das rotas.
 * Sem variáveis de ambiente, devolve resposta neutra e usuário nulo.
 */
export async function updateSession(
  request: NextRequest,
): Promise<UpdateSessionResult> {
  if (!hasSupabasePublicEnv()) {
    return {
      response: NextResponse.next({ request }),
      supabase: null,
      user: null,
    };
  }

  const response = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnvOrThrow();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToApply) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headersToApply).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
