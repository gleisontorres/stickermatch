import type { Content } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { GEMINI_CHAT_MODEL, hasGeminiApiKey } from "@/lib/gemini";
import { buildChatDataBlock } from "@/lib/chat-context";
import { CHAT_SYSTEM_PROMPT_BASE } from "@/lib/chat-prompt";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

/** Histórico máximo por requisição. */
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

interface ChatMessageInput {
  role: unknown;
  content: unknown;
}

function isChatRole(role: unknown): role is "user" | "assistant" {
  return role === "user" || role === "assistant";
}

/**
 * Converte histórico interno para o formato Gemini e garante:
 * - começa com `user`;
 * - não há duas mensagens consecutivas do mesmo papel (fundindo texto).
 */
function toGeminiHistoryContent(
  messages: { role: "user" | "assistant"; content: string }[],
): Content[] {
  const mapped: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let start = 0;
  while (start < mapped.length && mapped[start].role !== "user") {
    start += 1;
  }

  const merged: Content[] = [];
  for (let i = start; i < mapped.length; i += 1) {
    const turn = mapped[i];
    const prev = merged[merged.length - 1];
    const text = turn.parts?.[0]?.text ?? "";
    if (prev && prev.role === turn.role && prev.parts?.[0]) {
      prev.parts[0].text = `${prev.parts[0].text}\n\n${text}`;
    } else {
      merged.push({
        role: turn.role,
        parts: [{ text }],
      });
    }
  }

  return merged;
}

/**
 * Se o histórico terminaria com mensagem `user`, remove esses turns finais e
 * prefixa o texto na última mensagem enviada via `sendMessage` (exigência do
 * fluxo user → model alternado).
 */
function finalizeHistoryAndLastUserText(
  tail: { role: "user" | "assistant"; content: string }[],
): { history: Content[]; lastUserText: string } {
  const lastUserText = tail[tail.length - 1].content;
  const history = toGeminiHistoryContent(tail.slice(0, -1));

  let prefix = "";
  while (
    history.length > 0 &&
    history[history.length - 1].role === "user"
  ) {
    const popped = history.pop();
    const t = popped?.parts?.[0]?.text ?? "";
    prefix = prefix ? `${t}\n\n${prefix}` : t;
  }

  const combinedLast = prefix ? `${prefix}\n\n${lastUserText}` : lastUserText;

  return { history, lastUserText: combinedLast };
}

function describeGeminiFailure(error: unknown): { status: number; message: string } {
  const raw =
    error instanceof Error ?
      `${error.message}\n${String(error.cause ?? "")}`
    : typeof error === "string" ?
      error
    : JSON.stringify(error);
  const low = raw.toLowerCase();

  if (
    low.includes("resource_exhausted") ||
    low.includes("quota") ||
    low.includes("rate limit") ||
    low.includes("too many requests") ||
    low.includes(" 429 ")
  ) {
    return {
      status: 429,
      message:
        "Limite diário do Albu AI atingido. Tente novamente amanhã.",
    };
  }

  if (
    low.includes("api key") ||
    low.includes("api_key") ||
    low.includes("permission_denied") ||
    low.includes("unauthenticated") ||
    low.includes("invalid api")
  ) {
    return {
      status: 500,
      message: "Erro de configuração do Gemini. Avise o admin.",
    };
  }

  console.error("[api/chat] Gemini:", error);
  return {
    status: 500,
    message: "Erro ao consultar o Albu AI. Tente novamente.",
  };
}

/**
 * POST /api/chat — Gemini 2.5 Flash + contexto Supabase do usuário autenticado.
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

  if (!hasGeminiApiKey()) {
    const err = NextResponse.json(
      {
        error:
          "Serviço de IA indisponível: configure GOOGLE_GEMINI_API_KEY no servidor.",
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

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY!.trim();
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: GEMINI_CHAT_MODEL,
    systemInstruction: fullSystem,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  const { history, lastUserText } = finalizeHistoryAndLastUserText(tail);

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastUserText);
    const assistantText = result.response.text();

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
    const { status, message } = describeGeminiFailure(e);
    const err = NextResponse.json({ error: message }, { status });
    copyAuthCookies(sessionHolder, err);
    return err;
  }
}
