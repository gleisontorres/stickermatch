import Link from "next/link";
import { ArrowRight, Layers, RefreshCw, Sparkles } from "lucide-react";

import { LandingHeader } from "@/components/landing-header";
import { LandingQrShare } from "@/components/landing-qr-share";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
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
    description: "Use a IA para achar a melhor troca.",
  },
] as const;

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div
      className="relative flex min-h-[100dvh] flex-1 flex-col overflow-hidden bg-background"
      style={{
        backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16, 185, 129, 0.12) 0%, transparent 70%)`,
      }}
    >
      <LandingHeader />
      <main className="flex flex-1 flex-col px-5 pt-20 pb-12 sm:px-8 sm:pt-24 sm:pb-16 md:pt-28">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-10 md:max-w-2xl md:gap-14">
          <header className="space-y-6 text-center md:text-left">
            <p className="text-muted-foreground inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[11px] font-medium uppercase tracking-[0.22em] md:justify-start">
              <span className="bg-foreground/5 inline-flex items-center rounded-full border border-border/60 px-2.5 py-1">
                Colecionáveis · Grupos Fechados
              </span>
            </p>

            <div className="space-y-4">
              <h1 className="text-balance text-[2rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl sm:leading-[1.05] md:text-[3.25rem]">
                <span className="brand-gradient-text font-bold">CollectHub</span>
                <span className="text-muted-foreground font-normal">
                  {" "}
                  Trocas de colecionáveis sem planilha.
                </span>
              </h1>
              <p className="text-muted-foreground mx-auto max-w-md text-pretty text-base leading-relaxed md:mx-0 md:max-w-lg md:text-lg md:leading-relaxed">
                Cadastre suas repetidas e faltas, encontre matches automáticos e
                converse com a IA pra achar a melhor troca.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "gradient", size: "lg" }),
                  "inline-flex h-11 min-w-[220px] items-center justify-center gap-1 rounded-full px-8 text-[15px] shadow-sm transition-[transform,box-shadow] hover:shadow-md active:scale-[0.98]",
                )}
              >
                Entrar com Google
                <ArrowRight className="size-4 opacity-90" aria-hidden />
              </Link>
              <p className="text-muted-foreground max-w-xs text-center text-xs leading-relaxed sm:text-left md:max-w-none">
                Sem burocracia: um toque e você entra.
              </p>
            </div>

            {!user ?
              <section
                aria-label="Como instalar o app no celular"
                className="border-[#10b981]/45 bg-white/[0.05] dark:bg-zinc-900/45 w-full max-w-xl rounded-2xl border p-4 shadow-sm ring-1 ring-[#10b981]/20 dark:ring-[#10b981]/25 md:max-w-none"
              >
                <h2 className="text-foreground mb-3 text-center text-sm font-semibold sm:text-base md:text-left">
                  <span aria-hidden>📲</span> Instale o app no seu celular
                </h2>
                <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                  <div className="bg-background/45 dark:bg-black/25 space-y-2 rounded-xl p-3">
                    <p className="text-foreground text-sm font-medium">
                      <span aria-hidden>🤖</span> Android
                    </p>
                    <ol className="text-muted-foreground list-decimal space-y-1.5 pl-4 text-xs leading-snug sm:text-sm">
                      <li>Abra no Chrome</li>
                      <li>
                        Menu (⋮) → &quot;Adicionar à tela inicial&quot;
                      </li>
                    </ol>
                  </div>
                  <div className="bg-background/45 dark:bg-black/25 space-y-2 rounded-xl p-3">
                    <p className="text-foreground text-sm font-medium">
                      <span aria-hidden>🍎</span> iPhone
                    </p>
                    <ol className="text-muted-foreground list-decimal space-y-1.5 pl-4 text-xs leading-snug sm:text-sm">
                      <li>Abra no Safari</li>
                      <li>
                        Compartilhar (⬆️) → &quot;Adicionar à Tela de
                        Início&quot;
                      </li>
                    </ol>
                  </div>
                </div>
                <p className="text-[#10b981] dark:text-emerald-400 mt-4 border-t border-[#10b981]/35 pt-3 text-center text-xs font-medium sm:text-sm">
                  ✅ Quem já conectou com o Google entra direto, sem tela de
                  login!
                </p>
              </section>
            : null}
          </header>

          <section
            aria-label="Destaques"
            className="grid gap-3 sm:grid-cols-3 sm:gap-4"
          >
            {highlights.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-background/70 flex gap-3 rounded-2xl border border-border/70 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-border"
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

          <LandingQrShare />
        </div>

        <footer className="text-muted-foreground mt-auto pt-10 text-center text-[11px] md:text-left">
          CollectHub · MVP em produção
        </footer>
      </main>
    </div>
  );
}
