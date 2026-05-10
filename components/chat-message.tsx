import { cn } from "@/lib/utils";

export interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

/**
 * Bolha de mensagem (usuário ou assistente).
 */
export function ChatMessageBubble({ role, content }: ChatMessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[min(100%,36rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser ?
            "bg-primary text-primary-foreground rounded-br-md"
          : "border-border bg-card text-card-foreground rounded-bl-md border",
        )}
      >
        {!isUser ? (
          <p className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase tracking-wide">
            Assistente
          </p>
        ) : (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-80">
            Você
          </p>
        )}
        <div className="break-words whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
