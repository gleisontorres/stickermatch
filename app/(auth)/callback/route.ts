import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

/**
 * Valida `next` para evitar open redirect (apenas paths relativos internos).
 */
function safeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}

/**
 * OAuth callback do Supabase: troca `code` por sessão e redireciona para `next`.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const description =
      url.searchParams.get("error_description") ?? oauthError;
    const login = new URL("/login", url.origin);
    login.searchParams.set("error", "oauth");
    login.searchParams.set(
      "detail",
      description.slice(0, 200),
    );
    return NextResponse.redirect(login);
  }

  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("error", "missing_code");
    return NextResponse.redirect(login);
  }

  const redirectTarget = new URL(next, url.origin);
  const response = NextResponse.redirect(redirectTarget);

  const supabase = createRouteHandlerSupabase(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("error", "exchange_failed");
    return NextResponse.redirect(login);
  }

  return response;
}
