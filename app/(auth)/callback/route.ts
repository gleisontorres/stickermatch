import { NextResponse } from "next/server";

/**
 * Callback OAuth do Supabase — implementação completa na tarefa 4.
 * Redireciona para home até lá.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/", url.origin));
}
