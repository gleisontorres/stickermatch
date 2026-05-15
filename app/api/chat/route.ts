import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildChatDataBlock } from "@/lib/chat-context";
import { CHAT_SYSTEM_PROMPT_BASE } from "@/lib/chat-prompt";
import { hasOpenAiApiKey, OPENAI_CHAT_MODEL } from "@/lib/openai-chat";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

/** Histórico máximo por requisição. */
const MAX_MESSAGES = 10;

/** Limite de caracteres por mensagem (sanidade / abuso). */
const MAX_MESSAGE_CHARS = 12_000;

/** Copia cookies da resposta de sessão para a resposta final. */
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
 * Funde mensagens consecutivas do mesmo papel (esperado pela API da OpenAI).
 */
function toOpenAiChatMessages(
  tail: { role: "user" | "assistant"; content: string }[],
): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = [];
  for (const m of tail) {
    const last = out[out.length - 1];
    if (
      last &&
      last.role === m.role &&
      typeof last.content === "string"
    ) {
      last.content = `${last.content}\n\n${m.content}`;
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  return out;
}

function jsonError(
  sessionHolder: NextResponse,
  message: string,
  status: number,
): NextResponse {
  const err = NextResponse.json({ error: message }, { status });
  copyAuthCookies(sessionHolder, err);
  return err;
}

/**
 * POST /api/chat — OpenAI (streaming) + contexto Supabase do usuário autenticado.
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
    return jsonError(sessionHolder, "Não autenticado.", 401);
  }

  if (!hasOpenAiApiKey()) {
    return jsonError(
      sessionHolder,
      "Serviço de IA indisponível: configure OPENAI_API_KEY no servidor.",
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(sessionHolder, "JSON inválido.", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("messages" in body) ||
    !Array.isArray((body as { messages: unknown }).messages)
  ) {
    return jsonError(
      sessionHolder,
      'Corpo deve incluir "messages" (array).',
      400,
    );
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
      return jsonError(
        sessionHolder,
        `Mensagem excede ${MAX_MESSAGE_CHARS} caracteres.`,
        400,
      );
    }
    normalized.push({ role: m.role, content: text });
  }

  const tail = normalized.slice(-MAX_MESSAGES);

  if (tail.length === 0) {
    return jsonError(
      sessionHolder,
      "Envie ao menos uma mensagem de usuário válida.",
      400,
    );
  }

  if (tail[tail.length - 1].role !== "user") {
    return jsonError(
      sessionHolder,
      "A última mensagem do histórico deve ser do usuário.",
      400,
    );
  }

  let dataBlock: string;
  try {
    dataBlock = await buildChatDataBlock(supabase, user.id);
  } catch (e) {
    console.error("[api/chat] buildChatDataBlock:", e);
    return jsonError(
      sessionHolder,
      "Falha ao montar contexto da coleção.",
      500,
    );
  }

  const fullSystem = `${CHAT_SYSTEM_PROMPT_BASE}

---

## Dados em tempo real (não invente fora daqui)

${dataBlock}`;

  const openaiMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: fullSystem },
    ...toOpenAiChatMessages(tail),
  ];

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const stream = await openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: openaiMessages,
      max_completion_tokens: 1024,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content ?? "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (e) {
          controller.error(e);
        } finally {
          try {
            controller.close();
          } catch {
            /* já fechado */
          }
        }
      },
    });

    const res = new NextResponse(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
    copyAuthCookies(sessionHolder, res);
    return res;
  } catch (error: unknown) {
    const status =
      error instanceof OpenAI.APIError ? error.status : undefined;

    if (status === 429) {
      return jsonError(
        sessionHolder,
        "Limite de requisições atingido. Tente novamente em alguns segundos.",
        429,
      );
    }
    if (status === 401) {
      return jsonError(
        sessionHolder,
        "Erro de configuração da IA. Avise o administrador.",
        500,
      );
    }
    if (status === 402) {
      return jsonError(
        sessionHolder,
        "Créditos da IA esgotados. Avise o administrador.",
        500,
      );
    }

    console.error("[api/chat] OpenAI:", error);
    return jsonError(
      sessionHolder,
      "Erro ao consultar o Albu AI. Tente novamente.",
      500,
    );
  }
}
