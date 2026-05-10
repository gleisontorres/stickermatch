import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSupabasePublicEnvOrThrow } from "@/lib/supabase/env";

/**
 * Cliente Supabase para Route Handlers onde os cookies de sessão devem ser
 * gravados na própria `NextResponse` (ex.: `exchangeCodeForSession`).
 */
export function createRouteHandlerSupabase(
  request: NextRequest,
  response: NextResponse,
) {
  const { url, anonKey } = getSupabasePublicEnvOrThrow();

  return createServerClient(url, anonKey, {
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
}
