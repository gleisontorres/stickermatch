import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Persiste latitude/longitude do usuário autenticado (opcional, sob demanda).
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("latitude" in body) ||
    !("longitude" in body)
  ) {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { latitude, longitude } = body as Record<string, unknown>;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const { error } = await supabase
    .from("perfis")
    .update({
      latitude,
      longitude,
      localizacao_atualizada_em: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * Remove localização armazenada (opt-out).
 */
export async function DELETE() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { error } = await supabase
    .from("perfis")
    .update({
      latitude: null,
      longitude: null,
      localizacao_atualizada_em: null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
