import Link from "next/link";

import { MessageSquareText, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { GradientBorder } from "@/components/ui/gradient-border";
import { DashboardMatchesTipBanner } from "@/components/dashboard-matches-tip-banner";
import type { MatchPartnerEntry } from "@/lib/types";
import { brandProgressBarStyle } from "@/lib/brand-progress";
import { cn } from "@/lib/utils";

interface DashboardViewProps {
  /** Trecho antes do símbolo % (ex.: 99,9 ou 100). */
  completionPercentDisplay: string;
  /** Largura da barra (0–100, valor cru). */
  completionBarPercent: number;
  /** Álbum completo no catálogo (owned ≥ denom). */
  albumComplete: boolean;
  ownedCount: number;
  /** Total de figurinhas no catálogo usado no denominador. */
  albumTotal: number;
  surplusCopies: number;
  repetidasTypes: number;
  faltasCount: number;
  matchPartnersCount: number;
  topMatches: MatchPartnerEntry[];
  /** Mostra banner de dica de matches (servidor + localStorage). */
  showMatchesOnboardingTip?: boolean;
}

/**
 * Painel principal do dashboard: progresso, KPIs, preview de matches e atalho ao chat.
 */
export function DashboardView({
  completionPercentDisplay,
  completionBarPercent,
  albumComplete,
  ownedCount,
  albumTotal,
  surplusCopies,
  repetidasTypes,
  faltasCount,
  matchPartnersCount,
  topMatches,
  showMatchesOnboardingTip = false,
}: DashboardViewProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 pb-12">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Resumo da sua coleção e dos melhores matches do grupo.
        </p>
      </header>

      {showMatchesOnboardingTip ?
        <DashboardMatchesTipBanner />
      : null}

      <GradientBorder
        radius="2xl"
        innerClassName="relative overflow-hidden shadow-sm"
      >
        <section
          className="relative p-6"
          aria-labelledby="dash-progress-heading"
        >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.14] via-transparent to-accent/[0.08]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
              <p
                id="dash-progress-heading"
                className="text-muted-foreground text-xs font-semibold uppercase tracking-wide"
              >
                Álbum
              </p>
              <p
                className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl"
              >
                <span
                  className={cn(
                    albumComplete ?
                      "text-amber-600 dark:text-amber-400"
                    : "text-foreground",
                  )}
                >
                  {completionPercentDisplay}
                </span>
                <span className="text-muted-foreground text-2xl font-normal sm:text-3xl">
                  %
                </span>
                {albumComplete ?
                  <span className="text-2xl sm:text-3xl" aria-hidden>
                    🏆
                  </span>
                : null}
              </p>
              <p className="text-muted-foreground text-sm">
                <span className="text-foreground font-medium">{ownedCount}</span>{" "}
                de {albumTotal} figurinhas com pelo menos uma cópia cadastrada.
              </p>
              {albumComplete ?
                <p className="text-amber-700 dark:text-amber-400 text-sm font-medium">
                  Álbum completo! Parabéns!
                </p>
              : null}
          </div>
          <div className="bg-muted/80 h-3 w-full max-w-xs shrink-0 overflow-hidden rounded-full sm:w-48">
            <div
              className="h-full rounded-full transition-[width]"
              style={brandProgressBarStyle(
                albumComplete ? 100 : completionBarPercent,
              )}
              role="progressbar"
              aria-valuenow={Math.round(completionBarPercent * 10) / 10}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Percentual de conclusão do álbum"
            />
          </div>
        </div>
        </section>
      </GradientBorder>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Repetidas"
          value={surplusCopies}
          hint={
            repetidasTypes > 0
              ? `${repetidasTypes} tipo${repetidasTypes === 1 ? "" : "s"} com extra`
              : "Nenhuma repetida"
          }
          href="/repetidas"
          hrefLabel="Ver lista"
          accent="secondary"
        />
        <StatCard
          title="Faltas"
          value={faltasCount}
          hint={faltasCount === 1 ? "1 buraco no álbum" : "ainda sem cópia"}
          href="/faltas"
          hrefLabel="Ver lista"
          accent="zinc"
        />
        <StatCard
          title="Matches"
          value={matchPartnersCount}
          hint={
            matchPartnersCount === 1
              ? "1 parceiro encaixa troca"
              : "parceiros com oportunidade"
          }
          href="/matches"
          hrefLabel="Abrir matches"
          accent="primary"
        />
      </section>

      <GradientBorder radius="2xl" innerClassName="shadow-sm">
        <section className="flex flex-col gap-3 bg-gradient-to-br from-primary/[0.06] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-base font-semibold leading-tight">
              Assistente Albu-AI
            </h2>
            <p className="text-muted-foreground text-sm">
              Pergunte em português quem tem determinada figurinha, melhores
              trocas e mais.
            </p>
          </div>
        </div>
        <Link
          href="/chat"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "inline-flex shrink-0 gap-2 sm:self-center",
          )}
        >
          <MessageSquareText className="size-4" aria-hidden />
          Abrir chat
        </Link>
        </section>
      </GradientBorder>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Melhores matches
            </h2>
            <p className="text-muted-foreground text-sm">
              Mesma ordenação da página Matches (mútuos primeiro).
            </p>
          </div>
          <Link
            href="/matches"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-primary",
            )}
          >
            Ver todos
          </Link>
        </div>

        {topMatches.length === 0 ? (
          <div className="border-border bg-muted/20 rounded-xl border border-dashed px-4 py-10 text-center">
            <p className="text-muted-foreground text-sm">
              Cadastre repetidas e faltas no álbum para aparecerem sugestões
              aqui.
            </p>
            <Link
              href="/album"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 inline-flex",
              )}
            >
              Ir ao álbum
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {topMatches.map((entry) => (
              <li key={entry.partnerId}>
                <TopMatchRow entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  href,
  hrefLabel,
  accent,
}: {
  title: string;
  value: number;
  hint: string;
  href: string;
  hrefLabel: string;
  accent: "secondary" | "zinc" | "primary";
}) {
  const ring =
    accent === "secondary"
      ? "ring-secondary/20"
      : accent === "primary"
        ? "ring-primary/20"
        : "ring-border";

  return (
    <div
      className={cn(
        "border-border flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-inset",
        ring,
      )}
    >
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        {title}
      </p>
      <p className="text-foreground text-2xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="text-muted-foreground line-clamp-2 min-h-10 text-xs leading-snug">
        {hint}
      </p>
      <Link
        href={href}
        className="text-primary mt-auto pt-1 text-xs font-medium hover:underline"
      >
        {hrefLabel} →
      </Link>
    </div>
  );
}

function TopMatchRow({ entry }: { entry: MatchPartnerEntry }) {
  const previewDou = entry.eu_dou.slice(0, 4).map((x) => x.id);
  const previewRec = entry.eu_recebo.slice(0, 4).map((x) => x.id);
  const extraDou = Math.max(0, entry.eu_dou.length - previewDou.length);
  const extraRec = Math.max(0, entry.eu_recebo.length - previewRec.length);

  const digits = entry.whatsapp?.replace(/\D/g, "") ?? "";
  const waHref =
    digits.length > 0 ? `https://wa.me/${digits}` : null;

  const inner = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium leading-tight">
            {entry.displayName}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {entry.isMutual ? (
              <>
                Troca mútua · até{" "}
                <span className="text-foreground font-medium">
                  {entry.scoreMutual}
                </span>{" "}
                em equilíbrio
              </>
            ) : (
              <>Oportunidade parcial</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "xs" }),
                "h-7 px-2 text-[0.7rem]",
              )}
            >
              WhatsApp
            </a>
          ) : null}
          <Link
            href="/matches"
            className={cn(
              buttonVariants({ variant: "secondary", size: "xs" }),
              "h-7 px-2 text-[0.7rem]",
            )}
          >
            Detalhes
          </Link>
        </div>
      </div>
      <div className="text-muted-foreground mt-2 grid gap-1 font-mono text-[11px] leading-relaxed sm:grid-cols-2">
        <p>
          <span className="text-primary font-medium">
            Você dá:
          </span>{" "}
          {previewDou.join(", ")}
          {extraDou > 0 ? ` +${extraDou}` : ""}
        </p>
        <p>
          <span className="text-primary font-medium">
            Você recebe:
          </span>{" "}
          {previewRec.join(", ")}
          {extraRec > 0 ? ` +${extraRec}` : ""}
        </p>
      </div>
    </>
  );

  if (entry.isMutual) {
    return (
      <GradientBorder radius="xl" innerClassName="shadow-sm">
        <article className="px-4 py-3">{inner}</article>
      </GradientBorder>
    );
  }

  return (
    <article className="border-border rounded-xl border bg-card px-4 py-3 shadow-sm">
      {inner}
    </article>
  );
}
