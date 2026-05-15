"use client";

import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PerfilPartnerPublicViewProps {
  displayName: string;
  avatarUrl: string | null;
  /** Ex.: "Membro desde maio de 2026". */
  memberSinceLabel: string;
  ownedCount: number;
  albumTotal: number;
  /** Trecho antes do % (dashboard). */
  completionPercentDisplay: string;
  surplusCopies: number;
  whatsappHref: string | null;
}

/**
 * Layout público do perfil do parceiro (nav Voltar só no cliente para router.back).
 */
export function PerfilPartnerPublicView({
  displayName,
  avatarUrl,
  memberSinceLabel,
  ownedCount,
  albumTotal,
  completionPercentDisplay,
  surplusCopies,
  whatsappHref,
}: PerfilPartnerPublicViewProps) {
  const router = useRouter();

  return (
    <div className="p-4 pb-16 pt-6 md:p-6">
      <div className="mx-auto max-w-lg space-y-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer gap-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          ← Voltar
        </button>

        <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          {avatarUrl ?
            /* eslint-disable-next-line @next/next/no-img-element -- URLs externas arbitrárias (OAuth). */
            <img
              src={avatarUrl}
              alt=""
              width={96}
              height={96}
              className="bg-muted shrink-0 rounded-3xl border border-border object-cover"
            />
          : (
            <div
              aria-hidden
              className="bg-muted text-muted-foreground flex size-[96px] shrink-0 items-center justify-center rounded-3xl border border-border text-4xl font-semibold"
            >
              {displayName.trim().slice(0, 1).toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0 space-y-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {displayName || "Coletor"}
            </h1>
            <p className="text-muted-foreground text-sm">{memberSinceLabel}</p>
          </div>
        </section>

        <section className="border-border rounded-xl border bg-card/40 p-4 shadow-sm backdrop-blur-sm">
          <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            📊 Coleção
          </h2>
          <p className="text-base font-semibold tracking-tight">
            {ownedCount} figurinha{ownedCount === 1 ? "" : "s"} ·{" "}
            {completionPercentDisplay}% completo
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {surplusCopies} repetida{surplusCopies === 1 ? "" : "s"}
          </p>
          {albumTotal === 0 ?
            <p className="text-muted-foreground mt-2 text-xs">
              Catálogo indisponível para calcular o total.
            </p>
          : null}
        </section>

        {whatsappHref ?
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full py-3 text-sm font-semibold sm:w-auto",
            )}
          >
            WhatsApp
          </a>
        : null}
      </div>
    </div>
  );
}
