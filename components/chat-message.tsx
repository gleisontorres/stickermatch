import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

/**
 * Corpo da mensagem do assistente: Markdown (GFM) com tipografia alinhada ao tema.
 */
function AssistantMessageBody({ content }: { content: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "text-card-foreground prose-headings:text-card-foreground prose-strong:text-card-foreground",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            />
          ),
          ul: ({ ...props }) => (
            <ul {...props} className="list-disc space-y-1 pl-5" />
          ),
          ol: ({ ...props }) => (
            <ol {...props} className="list-decimal space-y-1 pl-5" />
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  {...props}
                  className="bg-muted rounded px-1 py-0.5 font-mono text-sm"
                >
                  {children}
                </code>
              );
            }
            return (
              <code {...props} className={className}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre
              {...props}
              className="bg-muted overflow-x-auto rounded-lg border border-border p-3 text-sm"
            >
              {children}
            </pre>
          ),
          p: ({ ...props }) => (
            <p {...props} className="mb-2 last:mb-0" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Bolha de mensagem (usuário em texto plano; assistente em Markdown).
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
        {isUser ? (
          <div className="break-words whitespace-pre-wrap">{content}</div>
        ) : (
          <AssistantMessageBody content={content} />
        )}
      </div>
    </div>
  );
}
