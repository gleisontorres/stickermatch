import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** Prefixos da área autenticada (route group `(app)` na URL). */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/album",
  "/pacote",
  "/repetidas",
  "/faltas",
  "/matches",
  "/chat",
  "/perfil",
  "/admin",
  "/onboarding",
] as const;

function requiresAuth(pathname: string): boolean {
  if (
    pathname === "/aguardando-aprovacao" ||
    pathname === "/acesso-negado"
  ) {
    return true;
  }
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Copia cookies da resposta da sessão para redirects (refresh não se perde).
 */
function forwardAuthCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
  const cacheControl = from.headers.get("cache-control");
  if (cacheControl) {
    to.headers.set("cache-control", cacheControl);
  }
}

function redirectWithSessionCookies(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.searchParams.delete("next");
  const redirectResponse = NextResponse.redirect(url);
  forwardAuthCookies(sessionResponse, redirectResponse);
  return redirectResponse;
}

type MiddlewarePerfilRow = {
  status: string;
  is_admin: boolean;
  whatsapp: string | null;
};

/** Sem linha em public.perfis (maybeSingle sem erro) vs erro de rede/RLS. */
type FetchPerfilAccessResult =
  | { outcome: "ok"; row: MiddlewarePerfilRow }
  | { outcome: "missing_row" }
  | { outcome: "db_error" };

async function fetchPerfilAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<FetchPerfilAccessResult> {
  const { data, error } = await supabase
    .from("perfis")
    .select("status, is_admin, whatsapp")
    .eq("id", userId)
    .maybeSingle();

  if (process.env.NODE_ENV === "development") {
    if (error) {
      console.warn(
        "[collecthub] middleware perfis:",
        error.code ?? "",
        error.message,
      );
    } else if (!data) {
      console.warn(
        "[collecthub] middleware perfis: nenhuma linha para auth.uid (verifique se perfis.id = auth.users.id)",
        userId,
      );
    }
  }

  if (error) {
    return { outcome: "db_error" };
  }
  if (!data) {
    return { outcome: "missing_row" };
  }

  const rawStatus =
    typeof data.status === "string" ? data.status.trim() : "pendente";

  const wa =
    typeof data.whatsapp === "string" && data.whatsapp.trim() ?
      data.whatsapp.trim()
    : null;

  return {
    outcome: "ok",
    row: {
      status: rawStatus || "pendente",
      is_admin: Boolean(data.is_admin),
      whatsapp: wa,
    },
  };
}

/** Rotas onde o fluxo de auth não deve ser bloqueado por ausência de perfil no catálogo. */
function bypassesPerfilLookup(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/callback");
}

/** Home do app já usada após login aprovado (next padrão). */
const APP_HOME_PATH = "/dashboard";

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return response;
  }

  // Troca OAuth precisa rodar sem bloqueio de status (cookies da sessão).
  if (pathname === "/callback" || pathname.startsWith("/callback/")) {
    return response;
  }

  if (requiresAuth(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    forwardAuthCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (!user || !supabase) {
    return response;
  }

  const pf = await fetchPerfilAccess(supabase, user.id);

  if (pf.outcome === "missing_row") {
    if (bypassesPerfilLookup(pathname)) {
      return response;
    }
    return redirectWithSessionCookies(request, response, "/login");
  }

  const access = pf.outcome === "ok" ? pf.row : null;
  const isAdmin = access?.is_admin ?? false;
  const rawStatus =
    typeof access?.status === "string" ? access.status.trim() : "";
  const normalizedStatus = rawStatus || "pendente";
  // Admin deve entrar mesmo se só `is_admin` foi atualizado no SQL e `status` ficou pendente.
  const effectiveStatus = isAdmin && access ? "aprovado" : normalizedStatus;

  // Landing: usuário logado segue o mesmo status que o restante do app.
  if (pathname === "/") {
    if (effectiveStatus === "rejeitado") {
      return redirectWithSessionCookies(request, response, "/acesso-negado");
    }
    if (effectiveStatus === "pendente") {
      return redirectWithSessionCookies(
        request,
        response,
        "/aguardando-aprovacao",
      );
    }
    if (effectiveStatus === "aprovado") {
      return redirectWithSessionCookies(request, response, APP_HOME_PATH);
    }
    return response;
  }

  if (pathname === "/login") {
    if (effectiveStatus === "rejeitado") {
      return redirectWithSessionCookies(request, response, "/acesso-negado");
    }
    if (effectiveStatus === "pendente") {
      return redirectWithSessionCookies(
        request,
        response,
        "/aguardando-aprovacao",
      );
    }

    const nextParam = request.nextUrl.searchParams.get("next");
    let destination =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ?
        nextParam
      : "/dashboard";
    if (destination === "/login") {
      destination = "/dashboard";
    }

    const destUrl = request.nextUrl.clone();
    destUrl.pathname = destination;
    destUrl.searchParams.delete("next");
    const redirectResponse = NextResponse.redirect(destUrl);
    forwardAuthCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (effectiveStatus === "rejeitado") {
    if (pathname === "/acesso-negado") {
      return response;
    }
    return redirectWithSessionCookies(request, response, "/acesso-negado");
  }

  if (effectiveStatus === "pendente") {
    if (pathname === "/aguardando-aprovacao") {
      return response;
    }
    return redirectWithSessionCookies(
      request,
      response,
      "/aguardando-aprovacao",
    );
  }

  if (
    pathname === "/aguardando-aprovacao" ||
    pathname === "/acesso-negado"
  ) {
    return redirectWithSessionCookies(request, response, "/dashboard");
  }

  const hasWhatsapp = Boolean(access?.whatsapp?.trim());

  const isOnboardingExempt = (path: string): boolean => {
    const prefixes = [
      "/onboarding",
      "/perfil",
      "/acesso-negado",
      "/aguardando-aprovacao",
    ];
    return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
  };

  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    if (hasWhatsapp) {
      return redirectWithSessionCookies(request, response, "/dashboard");
    }
    return response;
  }

  if (!isOnboardingExempt(pathname) && !hasWhatsapp) {
    return redirectWithSessionCookies(request, response, "/onboarding");
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAdmin) {
      return redirectWithSessionCookies(request, response, "/dashboard");
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Ignora estáticos do Next e assets comuns; todo o resto passa pelo refresh de sessão.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
