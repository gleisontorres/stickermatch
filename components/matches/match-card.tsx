"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { GradientBorder } from "@/components/ui/gradient-border";
import { formatDistanceKm } from "@/lib/format-distance-km";
import type { MatchPartnerEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Quantidade inicial de figurinhas antes de exigir expansão. */
const INITIAL_STICKER_VISIBLE_LIMIT = 10;

interface MatchPartnerCardProps {
  entry: MatchPartnerEntry;
}

/**
 * Card de um parceiro de match (lista de figurinhas + distância opcional).
 */
export function MatchPartnerCard({ entry }: MatchPartnerCardProps) {
  const totalTrocas = entry.eu_dou.length + entry.eu_recebo.length;
  const wa = whatsappHref(entry.whatsapp);
  const distLabel = formatDistanceKm(entry.distanciaKm ?? null);

  const body = (
    <>
      <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-base font-semibold leading-tight">
              👤 {entry.displayName}
            </h2>
            {distLabel ?
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <MapPin className="size-3 shrink-0" aria-hidden />
                {distLabel}
              </span>
            : null}
          </div>
          {entry.partnerColecaoRowCount < 100 ?
            <p className="text-amber-700 dark:text-amber-400 mt-1 text-xs leading-snug">
              ⚠️ Perfil em construção · {entry.partnerColecaoRowCount} figurinha
              {entry.partnerColecaoRowCount === 1 ? "" : "s"} cadastrada
              {entry.partnerColecaoRowCount === 1 ? "" : "s"}
            </p>
          : null}
          <p className="text-muted-foreground text-sm">
            {entry.isMutual ?
              <>
                Troca mútua · até{" "}
                <span className="text-foreground font-medium">
                  {entry.scoreMutual}
                </span>{" "}
                figurinha
                {entry.scoreMutual === 1 ? "" : "s"} em equilíbrio
              </>
            : (
              <>
                Oportunidade parcial · {totalTrocas} figurinha(s) envolvida(s)
              </>
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
          {wa ?
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              WhatsApp
            </a>
          : (
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
    </>
  );

  if (entry.isMutual) {
    return (
      <GradientBorder radius="xl" innerClassName="shadow-sm overflow-hidden">
        <article>{body}</article>
      </GradientBorder>
    );
  }

  return (
    <article className="border-border rounded-xl border bg-card shadow-sm">
      {body}
    </article>
  );
}

/**
 * Coluna de figurinhas (dá ou recebe) com lista truncada e botão para expandir/recolher.
 */
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
  const [expanded, setExpanded] = useState(false);

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

  const visibleItems =
    expanded ? items : items.slice(0, INITIAL_STICKER_VISIBLE_LIMIT);
  const remaining =
    items.length > INITIAL_STICKER_VISIBLE_LIMIT ?
      items.length - INITIAL_STICKER_VISIBLE_LIMIT
    : 0;
  const showToggle = items.length > INITIAL_STICKER_VISIBLE_LIMIT;

  return (
    <div className={cn("rounded-lg border px-3 py-3", toneClass)}>
      <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
        {title}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {visibleItems.map((it) => (
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
      {showToggle ?
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="text-primary hover:text-primary/90 mt-2 flex items-center gap-1 text-sm underline-offset-4 hover:underline"
        >
          {expanded ?
            <>ver menos ↑</>
          : remaining === 1 ?
            <>e mais 1 figurinha ↓</>
          : (
            <>e mais {remaining} figurinhas ↓</>
          )}
        </button>
      : null}
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
