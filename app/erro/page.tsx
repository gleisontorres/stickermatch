import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MSG_FALLBACK: Record<string, string> = {
  "token-invalido":
    "Este link não é válido ou não corresponde ao usuário indicado.",
  "falha-aprovacao":
    "Não foi possível concluir a aprovação. Tente pelo painel admin.",
};

interface ErroPageProps {
  searchParams: { msg?: string };
}

function subtitleFromMsg(raw: string | undefined): string {
  if (!raw?.trim()) {
    return MSG_FALLBACK["token-invalido"];
  }
  try {
    const key = decodeURIComponent(raw.trim());
    return MSG_FALLBACK[key] ?? key;
  } catch {
    return MSG_FALLBACK["token-invalido"];
  }
}

/**
 * Feedback quando o link de aprovação é inválido ou falha no servidor.
 */
export default function ErroLinkPage({ searchParams }: ErroPageProps) {
  const subtitle = subtitleFromMsg(searchParams.msg);

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6 py-16 text-center"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% -10%,
            rgba(245, 158, 11, 0.12) 0%,
            transparent 70%
          ),
          #0a0a0a
        `,
      }}
    >
      <div className="flex max-w-md flex-col items-center gap-4">
        <span className="text-7xl leading-none sm:text-8xl" aria-hidden>
          ❌
        </span>
        <h1 className="from-primary to-secondary bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          Link inválido
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
          {subtitle}
        </p>
      </div>

      <Link
        href="/admin"
        className={cn(
          buttonVariants({ variant: "gradient", size: "lg" }),
          "min-w-[240px]",
        )}
      >
        Ir para o painel admin
      </Link>
    </div>
  );
}
