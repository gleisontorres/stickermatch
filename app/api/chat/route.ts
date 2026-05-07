import { NextResponse } from "next/server";

/**
 * POST /api/chat — Anthropic + contexto Supabase (tarefa 12).
 */
export async function POST() {
  return NextResponse.json(
    { error: "Chat API não implementada ainda (tarefa 12)." },
    { status: 501 },
  );
}
