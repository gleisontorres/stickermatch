import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFICATION_EMAIL = Deno.env.get("NOTIFICATION_EMAIL") ?? "";

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

serve(async (req) => {
  if (!RESEND_API_KEY || !NOTIFICATION_EMAIL) {
    console.error("Missing RESEND_API_KEY or NOTIFICATION_EMAIL");
    return new Response(
      JSON.stringify({ error: "Server misconfigured: missing secrets" }),
      { status: 500 },
    );
  }

  try {
    const payload: { record?: Record<string, unknown> } = await req.json();
    const record = payload.record ?? {};
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
            <a
              href="https://collecthub.app/admin"
              style="display: inline-block; background: linear-gradient(135deg, #10b981, #f59e0b);
                     color: #0a0a0a; font-weight: 600; padding: 12px 24px;
                     border-radius: 8px; text-decoration: none;"
            >
              Aprovar no Painel Admin →
            </a>
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
