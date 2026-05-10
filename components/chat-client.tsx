"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import { ChatMessageBubble } from "@/components/chat-message";
import { Button } from "@/components/ui/button";

const MAX_MESSAGES_API = 10;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Chat com a IA: histórico local (últimas 10 trocas na API) e POST /api/chat.
 */
export function ChatClient() {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const send = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || loading) {
      return;
    }

    const userTurn: ChatTurn = { role: "user", content: trimmed };
    const payloadHistory = [...messages, userTurn].slice(-MAX_MESSAGES_API);

    setMessages((prev) => [...prev, userTurn]);
    setDraft("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadHistory }),
      });

      const data: unknown = await res.json().catch(() => null);
      const errMsg =
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string" ?
          (data as { error: string }).error
        : null;

      if (!res.ok) {
        throw new Error(errMsg ?? `Erro HTTP ${res.status}`);
      }

      const message =
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string" ?
          (data as { message: string }).message
        : null;

      if (!message?.trim()) {
        throw new Error("Resposta inválida do servidor.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: message.trim() },
      ]);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Não foi possível enviar a mensagem.";
      setError(msg);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [draft, loading, messages]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 md:gap-5">
      <header className="shrink-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Albu-AI</h1>
        <p className="text-muted-foreground text-sm">
          Pergunte sobre sua coleção, faltas, repetidas e trocas. Usamos seus
          dados atuais em cada resposta (até {MAX_MESSAGES_API} mensagens no
          contexto).
        </p>
      </header>

      {error ? (
        <p
          className="border-destructive/40 bg-destructive/10 text-destructive shrink-0 rounded-lg border px-3 py-2 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div
        className="border-border bg-muted/25 flex min-h-[min(420px,55dvh)] flex-1 flex-col overflow-hidden rounded-xl border shadow-inner md:min-h-[min(480px,50dvh)]"
        aria-label="Histórico da conversa"
      >
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-5">
          {messages.length === 0 && !loading ? (
            <div className="text-muted-foreground m-auto max-w-md space-y-3 px-2 text-center text-sm leading-relaxed">
              <p>Experimente perguntar, por exemplo:</p>
              <ul className="space-y-2 text-left text-xs md:text-sm">
                <li className="border-border rounded-lg border bg-background/80 px-3 py-2">
                  “Quantas figurinhas me faltam pra completar o Brasil?”
                </li>
                <li className="border-border rounded-lg border bg-background/80 px-3 py-2">
                  “Quais são os melhores matches pra mim agora?”
                </li>
                <li className="border-border rounded-lg border bg-background/80 px-3 py-2">
                  “Alguém tem repetida da figurinha X?”
                </li>
              </ul>
            </div>
          ) : (
            <ul className="flex flex-col gap-4" aria-live="polite">
              {messages.map((m, i) => (
                <li key={`${i}-${m.role}-${m.content.slice(0, 24)}`}>
                  <ChatMessageBubble role={m.role} content={m.content} />
                </li>
              ))}
            </ul>
          )}

          {loading ? (
            <div className="flex justify-start" aria-busy="true" aria-label="Gerando resposta">
              <div className="border-border bg-card max-w-[85%] rounded-2xl rounded-bl-md border px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="bg-muted-foreground/50 size-2 animate-pulse rounded-full" />
                  <span className="bg-muted-foreground/50 size-2 animate-pulse rounded-full delay-75" />
                  <span className="bg-muted-foreground/50 size-2 animate-pulse rounded-full delay-150" />
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  Pensando…
                </p>
              </div>
            </div>
          ) : null}

          <div ref={scrollAnchorRef} className="h-px shrink-0" aria-hidden />
        </div>
      </div>

      <div className="border-border shrink-0 rounded-xl border bg-card p-3 shadow-sm md:p-4">
        <label className="sr-only" htmlFor="chat-input">
          Sua mensagem
        </label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={draft}
          disabled={loading}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Digite sua pergunta… (Enter envia, Shift+Enter quebra linha)"
          rows={3}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring mb-3 max-h-40 min-h-[5rem] w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:opacity-60"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-[11px] md:text-xs">
            Histórico enviado: últimas {MAX_MESSAGES_API} mensagens.
          </p>
          <Button
            type="button"
            disabled={loading || !draft.trim()}
            onClick={() => void send()}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
