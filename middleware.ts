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
] as const;

function isProtectedPath(pathname: string): boolean {
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

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return response;
  }

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    forwardAuthCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (pathname === "/login" && user) {
    const nextParam = request.nextUrl.searchParams.get("next");
    let destination =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
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
