import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFICATION_EMAIL = Deno.env.get("NOTIFICATION_EMAIL") ?? "";
const APPROVE_SECRET = Deno.env.get("APPROVE_SECRET") ?? "";

/**
 * Escapa texto para uso seguro dentro de HTML (evita XSS no corpo do e-mail).
 */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Base64url da assinatura HMAC-SHA256(secret, perfilId), alinhado ao validador Next.js.
 */
async function signApproveToken(
  perfilId: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(perfilId),
  );
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

serve(async (req) => {
  if (!RESEND_API_KEY || !NOTIFICATION_EMAIL) {
    console.error("Missing RESEND_API_KEY or NOTIFICATION_EMAIL");
    return new Response(
      JSON.stringify({ error: "Server misconfigured: missing secrets" }),
      { status: 500 },
    );
  }

  if (!APPROVE_SECRET) {
    console.error("Missing APPROVE_SECRET");
    return new Response(
      JSON.stringify({
        error: "Server misconfigured: APPROVE_SECRET required for approve links",
      }),
      { status: 500 },
    );
  }

  try {
    const payload: { record?: Record<string, unknown> } = await req.json();
    const record = payload.record ?? {};
    const perfilId =
      typeof record.id === "string" && record.id.trim() ? record.id.trim()
      : null;

    if (!perfilId) {
      console.error("notify-new-user: record.id ausente");
      return new Response(
        JSON.stringify({ error: "Missing perfil id in payload" }),
        { status: 400 },
      );
    }

    const nome = typeof record.nome === "string" && record.nome.trim() ?
        record.nome.trim()
      : "Sem nome";
    const email = typeof record.email === "string" && record.email.trim() ?
        record.email.trim()
      : "Sem email";
    const createdRaw = record.created_at;
    const createdAt =
      typeof createdRaw === "string" ?
        new Date(createdRaw)
      : createdRaw instanceof Date ? createdRaw
      : new Date();
    const created_at = Number.isFinite(createdAt.getTime()) ?
        createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : "—";

    const nomeSafe = escapeHtml(nome);
    const emailSafe = escapeHtml(email);
    const timeSafe = escapeHtml(created_at);

    const token = await signApproveToken(perfilId, APPROVE_SECRET);
    const approveUrl =
      `https://collecthub.app/api/approve-user?token=${encodeURIComponent(token)}&perfil_id=${encodeURIComponent(perfilId)}`;
    const adminUrl = "https://collecthub.app/admin";

    const emailBody = {
      from: "CollectHub <noreply@collecthub.app>",
      to: [NOTIFICATION_EMAIL],
      subject: `🎴 Novo usuário no CollectHub: ${nome}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #0a0a0a; padding: 32px; border-radius: 12px;">
            <h2 style="color: #10b981; margin: 0 0 8px;">🎴 Novo usuário no CollectHub</h2>
            <p style="color: #999; margin: 0 0 24px; font-size: 14px;">
              Alguém acabou de fazer login e está aguardando aprovação.
            </p>
            <div style="background: #171717; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #fff; margin: 0 0 8px;"><strong>Nome:</strong> ${nomeSafe}</p>
              <p style="color: #fff; margin: 0 0 8px;"><strong>Email:</strong> ${emailSafe}</p>
              <p style="color: #999; margin: 0; font-size: 13px;"><strong>Horário:</strong> ${timeSafe}</p>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
              <tr>
                <td style="padding: 8px 0; text-align: center;">
                  <a href="${approveUrl}"
                     style="display: inline-block; background: linear-gradient(135deg, #10b981, #f59e0b);
                            color: #0a0a0a; font-weight: 700; padding: 12px 24px;
                            border-radius: 8px; text-decoration: none;">
                    ✅ Aprovar agora
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; text-align: center;">
                  <a href="${adminUrl}"
                     style="display: inline-block; background: transparent;
                            color: #e5e5e5; font-weight: 600; padding: 12px 24px;
                            border-radius: 8px; text-decoration: none;
                            border: 1px solid rgba(255,255,255,0.35);">
                    Abrir painel admin →
                  </a>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
