import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import type { MatchPartnerEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MatchesGroupedListProps {
  entries: MatchPartnerEntry[];
}

const MAX_IDS_SHOW = 14;

/**
 * Lista de matches agrupada por outro colecionador.
 */
export function MatchesGroupedList({ entries }: MatchesGroupedListProps) {
  if (entries.length === 0) {
    return (
      <div className="border-border bg-muted/25 rounded-xl border border-dashed px-4 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          Ainda não há combinações na view de matches. Cadastre repetidas e faltas no
          álbum para aparecerem sugestões aqui.
        </p>
        <Link
          href="/album"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "mt-4 inline-flex",
          )}
        >
          Ir ao álbum
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-5">
      {entries.map((entry) => (
        <li key={entry.partnerId}>
          <PartnerCard entry={entry} />
        </li>
      ))}
    </ul>
  );
}

function PartnerCard({ entry }: { entry: MatchPartnerEntry }) {
  const totalTrocas = entry.eu_dou.length + entry.eu_recebo.length;
  const wa = whatsappHref(entry.whatsapp);

  return (
    <article className="border-border rounded-xl border bg-card shadow-sm">
      <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold leading-tight">
            {entry.displayName}
          </h2>
          {entry.partnerColecaoRowCount < 100 ?
            <p className="text-amber-700 dark:text-amber-400 mt-1 text-xs leading-snug">
              ⚠️ Perfil em construção · {entry.partnerColecaoRowCount} figurinha
              {entry.partnerColecaoRowCount === 1 ? "" : "s"} cadastrada
              {entry.partnerColecaoRowCount === 1 ? "" : "s"}
            </p>
          : null}
          <p className="text-muted-foreground text-sm">
            {entry.isMutual ? (
              <>
                Troca mútua · até{" "}
                <span className="text-foreground font-medium">
                  {entry.scoreMutual}
                </span>{" "}
                figurinha
                {entry.scoreMutual === 1 ? "" : "s"} em equilíbrio
              </>
            ) : (
              <>Oportunidade parcial · {totalTrocas} figurinha(s) envolvida(s)</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title="Perfil público do parceiro será adicionado em breve"
          >
            Ver perfil
          </Button>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              WhatsApp
            </a>
          ) : (
            <span
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "pointer-events-none opacity-60",
              )}
              title="Parceiro não cadastrou WhatsApp"
            >
              WhatsApp
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <MatchColumn
          title="Você dá (tem repetida / parceiro precisa)"
          items={entry.eu_dou}
          empty="Nenhuma neste sentido"
          tone="give"
        />
        <MatchColumn
          title="Você recebe (parceiro tem repetida / você precisa)"
          items={entry.eu_recebo}
          empty="Nenhuma neste sentido"
          tone="receive"
        />
      </div>
    </article>
  );
}

function MatchColumn({
  title,
  items,
  empty,
  tone,
}: {
  title: string;
  items: { id: string; label: string }[];
  empty: string;
  tone: "give" | "receive";
}) {
  const toneClass =
    tone === "give"
      ? "border-secondary/30 bg-secondary/[0.10]"
      : "border-primary/30 bg-primary/[0.10]";

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed px-3 py-4 text-sm",
          toneClass,
        )}
      >
        <p className="text-muted-foreground mb-1 font-medium">{title}</p>
        <p className="text-muted-foreground/80">{empty}</p>
      </div>
    );
  }

  const show = items.slice(0, MAX_IDS_SHOW);
  const rest = items.length - show.length;

  return (
    <div className={cn("rounded-lg border px-3 py-3", toneClass)}>
      <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
        {title}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {show.map((it) => (
          <li key={it.id}>
            <span
              className="bg-background/80 inline-block max-w-full truncate rounded-md border px-2 py-1 font-mono text-xs"
              title={it.label}
            >
              {it.label}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p className="text-muted-foreground mt-2 text-xs">e mais {rest}…</p>
      ) : null}
    </div>
  );
}

function whatsappHref(raw: string | null): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  return `https://wa.me/${digits}`;
}
