import { APIError } from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ANTHROPIC_MODEL,
  getAnthropicClient,
  hasAnthropicApiKey,
} from "@/lib/anthropic";
import { buildChatDataBlock } from "@/lib/chat-context";
import { CHAT_SYSTEM_PROMPT_BASE } from "@/lib/chat-prompt";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

/** Histórico máximo por requisição (custo / PROMPT_CURSOR.md). */
const MAX_MESSAGES = 10;

/** Limite de caracteres por mensagem (sanidade / abuso). */
const MAX_MESSAGE_CHARS = 12_000;

/** Copia cookies da resposta de sessão para a resposta JSON final. */
function copyAuthCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
  const cacheControl = from.headers.get("cache-control");
  if (cacheControl) {
    to.headers.set("cache-control", cacheControl);
  }
}

/** Extrai `message` aninhada do JSON de erro da Anthropic. */
function extractAnthropicErrorDetail(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.message === "string" && o.message.trim()) {
    return o.message.trim();
  }
  if (o.error !== undefined) {
    return extractAnthropicErrorDetail(o.error);
  }
  return null;
}

/** Mensagem amigável em pt-BR para erros comuns da API. */
function localizeAnthropicMessageForUser(english: string): string {
  const low = english.toLowerCase();
  if (low.includes("credit balance is too low")) {
    return (
      "Saldo de créditos da Anthropic insuficiente para usar a API. " +
      "Compre créditos ou faça upgrade em Plans & Billing no console da Anthropic."
    );
  }
  if (
    low.includes("invalid api key") ||
    low.includes("invalid x-api-key") ||
    low.includes("authentication")
  ) {
    return "Chave da API Anthropic inválida ou sem permissão. Verifique ANTHROPIC_API_KEY.";
  }
  if (low.includes("rate_limit")) {
    return "Limite de uso da API Anthropic atingido. Tente de novo em alguns instantes.";
  }
  return english.trim();
}

function anthropicFailureUserMessage(error: unknown): string {
  if (error instanceof APIError) {
    const fromBody = extractAnthropicErrorDetail(error.error);
    const base = fromBody ?? error.message ?? "";
    if (base.trim()) {
      return localizeAnthropicMessageForUser(base);
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return localizeAnthropicMessageForUser(error.message);
  }
  return "Falha ao chamar o modelo de IA.";
}

interface ChatMessageInput {
  role: unknown;
  content: unknown;
}

function isChatRole(role: unknown): role is "user" | "assistant" {
  return role === "user" || role === "assistant";
}

/**
 * POST /api/chat — Claude Haiku + contexto Supabase do usuário autenticado.
 */
export async function POST(request: NextRequest) {
  const sessionHolder = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createRouteHandlerSupabase(request, sessionHolder);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const denied = NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    copyAuthCookies(sessionHolder, denied);
    return denied;
  }

  if (!hasAnthropicApiKey()) {
    const err = NextResponse.json(
      {
        error:
          "Serviço de IA indisponível: configure ANTHROPIC_API_KEY no servidor.",
      },
      { status: 503 },
    );
    copyAuthCookies(sessionHolder, err);
    return err;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const err = NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    copyAuthCookies(sessionHolder, err);
    return err;
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("messages" in body) ||
    !Array.isArray((body as { messages: unknown }).messages)
  ) {
    const err = NextResponse.json(
      { error: 'Corpo deve incluir "messages" (array).' },
      { status: 400 },
    );
    copyAuthCookies(sessionHolder, err);
    return err;
  }

  const rawMessages = (body as { messages: ChatMessageInput[] }).messages;

  const normalized: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of rawMessages) {
    if (!isChatRole(m.role)) {
      continue;
    }
    if (typeof m.content !== "string") {
      continue;
    }
    const text = m.content.trim();
    if (!text) {
      continue;
    }
    if (text.length > MAX_MESSAGE_CHARS) {
      const err = NextResponse.json(
        { error: `Mensagem excede ${MAX_MESSAGE_CHARS} caracteres.` },
        { status: 400 },
      );
      copyAuthCookies(sessionHolder, err);
      return err;
    }
    normalized.push({ role: m.role, content: text });
  }

  const tail = normalized.slice(-MAX_MESSAGES);

  if (tail.length === 0) {
    const err = NextResponse.json(
      { error: "Envie ao menos uma mensagem de usuário válida." },
      { status: 400 },
    );
    copyAuthCookies(sessionHolder, err);
    return err;
  }

  if (tail[tail.length - 1].role !== "user") {
    const err = NextResponse.json(
      { error: "A última mensagem do histórico deve ser do usuário." },
      { status: 400 },
    );
    copyAuthCookies(sessionHolder, err);
    return err;
  }

  let dataBlock: string;
  try {
    dataBlock = await buildChatDataBlock(supabase, user.id);
  } catch (e) {
    console.error("[api/chat] buildChatDataBlock:", e);
    const err = NextResponse.json(
      { error: "Falha ao montar contexto da coleção." },
      { status: 500 },
    );
    copyAuthCookies(sessionHolder, err);
    return err;
  }

  const fullSystem = `${CHAT_SYSTEM_PROMPT_BASE}

---

## Dados em tempo real (não invente fora daqui)

${dataBlock}`;

  const anthropicMessages = tail.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const client = getAnthropicClient();
    const completion = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: fullSystem,
      messages: anthropicMessages,
    });

    const textBlock = completion.content.find((b) => b.type === "text");
    const assistantText =
      textBlock && textBlock.type === "text" ? textBlock.text : "";

    if (!assistantText.trim()) {
      const err = NextResponse.json(
        { error: "Resposta vazia do modelo." },
        { status: 502 },
      );
      copyAuthCookies(sessionHolder, err);
      return err;
    }

    const ok = NextResponse.json({ message: assistantText.trim() });
    copyAuthCookies(sessionHolder, ok);
    return ok;
  } catch (e) {
    console.error("[api/chat] Anthropic:", e);
    const err = NextResponse.json(
      { error: anthropicFailureUserMessage(e) },
      { status: 502 },
    );
    copyAuthCookies(sessionHolder, err);
    return err;
  }
}
