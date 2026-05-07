import Link from "next/link";
import { ArrowRight, Layers, RefreshCw, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const highlights = [
  {
    icon: Layers,
    title: "Seu álbum",
    description: "Marque faltas e repetidas em segundos.",
  },
  {
    icon: RefreshCw,
    title: "Matches",
    description: "Veja quem do grupo encaixa na troca.",
  },
  {
    icon: Sparkles,
    title: "Assistente",
    description: "Pergunte em português o que precisar.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col overflow-hidden bg-zinc-50/80">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_70%_at_50%_-15%,oklch(0.94_0.04_240_/_0.55),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl sm:-left-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-80 w-80 rounded-full bg-red-500/10 blur-3xl sm:-right-12"
        aria-hidden
      />

      <main className="flex flex-1 flex-col px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20 md:pt-24">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-10 md:max-w-2xl md:gap-14">
          <header className="space-y-6 text-center md:text-left">
            <p className="text-muted-foreground inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[11px] font-medium uppercase tracking-[0.22em] md:justify-start">
              <span className="bg-foreground/5 inline-flex items-center rounded-full border border-border/60 px-2.5 py-1">
                Copa 2026
              </span>
              <span className="text-border hidden h-px w-8 shrink-0 bg-current md:inline-block" />
              <span className="hidden md:inline">Panini · grupo fechado</span>
            </p>

            <div className="space-y-4">
              <h1 className="text-balance text-[2rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl sm:leading-[1.05] md:text-[3.25rem]">
                Stickermatch
                <span className="text-muted-foreground font-normal">
                  {" "}
                  trocas sem planilha.
                </span>
              </h1>
              <p className="text-muted-foreground mx-auto max-w-md text-pretty text-base leading-relaxed md:mx-0 md:max-w-lg md:text-lg md:leading-relaxed">
                Cadastre repetidas e faltas do álbum e encontre matches com
                amigos. Rápido no celular, pensado para grupos pequenos.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "inline-flex h-11 min-w-[220px] items-center justify-center gap-1 rounded-full px-8 text-[15px] shadow-sm transition-[transform,box-shadow] hover:shadow-md active:scale-[0.98]",
                )}
              >
                Entrar com Google
                <ArrowRight className="size-4 opacity-90" aria-hidden />
              </Link>
              <p className="text-muted-foreground max-w-xs text-center text-xs leading-relaxed sm:text-left md:max-w-none">
                Sem cadastro manual: um toque e você entra.
              </p>
            </div>
          </header>

          <section
            aria-label="Destaques"
            className="grid gap-3 sm:grid-cols-3 sm:gap-4"
          >
            {highlights.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-background/70 flex gap-3 rounded-2xl border border-border/70 p-4 shadow-[0_1px_0_0_oklch(0_0_0_/_0.03)] backdrop-blur-sm transition-colors hover:border-border"
              >
                <span className="bg-primary/8 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/10">
                  <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 space-y-0.5 pt-0.5">
                  <h2 className="text-sm font-medium tracking-tight">{title}</h2>
                  <p className="text-muted-foreground text-xs leading-snug">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </section>
        </div>

        <footer className="text-muted-foreground mt-auto pt-10 text-center text-[11px] md:text-left">
          Álbum oficial · 980 figurinhas · MVP em construção
        </footer>
      </main>
    </div>
  );
}
