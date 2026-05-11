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
}

/**
 * Lista de matches agrupada por outro colecionador.
 */
export function MatchesGroupedList({
  entries,
  viewerHasLocation,
}: MatchesGroupedListProps) {
  return (
    <div className="flex flex-col gap-5">
      <MatchesLocationBanner show={!viewerHasLocation} />
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
