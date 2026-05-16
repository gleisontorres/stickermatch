import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AprovadoPageProps {
  searchParams: { nome?: string };
}

/**
 * Feedback visual após aprovação via link do e-mail.
 */
export default function AprovadoPage({ searchParams }: AprovadoPageProps) {
  const nome =
    typeof searchParams.nome === "string" && searchParams.nome.trim() ?
      searchParams.nome.trim()
    : "Usuário";

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6 py-16 text-center"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% -10%,
            rgba(16, 185, 129, 0.14) 0%,
            transparent 70%
          ),
          #0a0a0a
        `,
      }}
    >
      <div className="flex max-w-md flex-col items-center gap-4">
        <span className="text-7xl leading-none sm:text-8xl" aria-hidden>
          ✅
        </span>
        <h1 className="from-primary to-secondary bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          Usuário aprovado!
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
          <span className="text-foreground font-semibold">{nome}</span> já pode
          acessar o CollectHub.
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
