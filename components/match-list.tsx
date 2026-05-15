import Link from "next/link";

import { MatchesLocationBanner } from "@/components/matches/location-banner";
import { MatchPartnerCard } from "@/components/matches/match-card";
import { buttonVariants } from "@/components/ui/button";
import type { MatchPartnerEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MatchesGroupedListProps {
  entries: MatchPartnerEntry[];
  /** Se o usuário logado não cadastrou localização, exibe banner (respeita localStorage). */
  viewerHasLocation: boolean;
  /** Perfil com WhatsApp preenchido — esconde banner de lembrete. */
  viewerHasWhatsapp: boolean;
}

/**
 * Lista de matches agrupada por outro colecionador.
 */
export function MatchesGroupedList({
  entries,
  viewerHasLocation,
  viewerHasWhatsapp,
}: MatchesGroupedListProps) {
  return (
    <div className="flex flex-col gap-5">
      <MatchesLocationBanner show={!viewerHasLocation} />
      {!viewerHasWhatsapp ?
        <div
          className="flex items-start gap-3 rounded-xl p-4"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <span className="text-xl">📱</span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-medium">
              Adicione seu WhatsApp ao perfil
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Seus parceiros de troca precisam de um jeito de te contatar. Sem
              WhatsApp cadastrado, eles não conseguem te chamar.
            </p>
          </div>
          <Link
            href="/perfil"
            className="self-center rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #10b981, #f59e0b)",
              color: "#0a0a0a",
            }}
          >
            Ir ao Perfil →
          </Link>
        </div>
      : null}
      {entries.length === 0 ?
        <div className="border-border bg-muted/25 rounded-xl border border-dashed px-4 py-12 text-center">
          <p className="text-muted-foreground text-sm">
            Ainda não há combinações na view de matches. Cadastre repetidas e
            faltas no álbum para aparecerem sugestões aqui.
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
      : (
        <ul className="flex flex-col gap-5">
          {entries.map((entry) => (
            <li key={entry.partnerId}>
              <MatchPartnerCard entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
