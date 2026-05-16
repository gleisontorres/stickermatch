import { NextResponse, type NextRequest } from "next/server";

import { verifyApproveToken } from "@/lib/approve-token-verify";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const UUID_REGEX =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function redirectErro(req: NextRequest, msg: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/erro";
  url.searchParams.set("msg", msg);
  return NextResponse.redirect(url);
}

function redirectAprovado(req: NextRequest, nome: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/aprovado";
  url.searchParams.set("nome", nome);
  return NextResponse.redirect(url);
}

/**
 * GET — link mágico do e-mail: valida token HMAC e aprova perfil pendente (service role).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const perfilId = request.nextUrl.searchParams.get("perfil_id")?.trim();
  const approveSecret = process.env.APPROVE_SECRET?.trim();

  if (!token || !perfilId || !approveSecret) {
    return redirectErro(request, "token-invalido");
  }

  if (!UUID_REGEX.test(perfilId)) {
    return redirectErro(request, "token-invalido");
  }

  if (!verifyApproveToken(token, perfilId, approveSecret)) {
    return redirectErro(request, "token-invalido");
  }

  try {
    const supabase = createServiceRoleClient();
    const reviewedAt = new Date().toISOString();
    const { data: row, error } = await supabase
      .from("perfis")
      .update({
        status: "aprovado",
        reviewed_at: reviewedAt,
      })
      .eq("id", perfilId)
      .select("nome")
      .maybeSingle();

    if (error) {
      console.error("[approve-user]", error.message);
      return redirectErro(request, "falha-aprovacao");
    }

    const nomeRaw =
      typeof row?.nome === "string" && row.nome.trim() ? row.nome.trim() : "";
    const nome = nomeRaw || "Usuário";
    return redirectAprovado(request, nome);
  } catch (e) {
    console.error("[approve-user]", e);
    return redirectErro(request, "falha-aprovacao");
  }
}
