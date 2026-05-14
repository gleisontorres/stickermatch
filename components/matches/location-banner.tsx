"use client";

import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hide_location_banner";

interface MatchesLocationBannerProps {
  /** True quando o servidor indica que o usuário ainda não salvou lat/lng no perfil. */
  show: boolean;
}

function isDismissedInStorage(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "true" || v === "1";
  } catch {
    return false;
  }
}

/**
 * Card destacado convidando ativar localização nos Matches (sem sair da página).
 */
export function MatchesLocationBanner({ show }: MatchesLocationBannerProps) {
  const router = useRouter();
  const [storageRead, setStorageRead] = useState(false);
  const [storageDismissed, setStorageDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);
  const [geoPending, setGeoPending] = useState(false);

  useEffect(() => {
    setStorageDismissed(isDismissedInStorage());
    setStorageRead(true);
  }, []);

  const finishExit = useCallback(() => {
    setExiting(true);
    window.setTimeout(() => {
      setGone(true);
    }, 300);
  }, []);

  const handleAgoraNao = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    finishExit();
  }, [finishExit]);

  const handleAtivarLocalizacao = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }

    setGeoPending(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch("/api/perfil/localizacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (response.ok) {
            toast.success(
              "📍 Localização ativada! Distâncias aparecem nos matches.",
            );
            finishExit();
            window.setTimeout(() => {
              void router.refresh();
            }, 280);
          } else {
            const body = (await response.json().catch(() => null)) as {
              error?: string;
            } | null;
            toast.error(
              body?.error ?? "Erro ao salvar localização. Tente novamente.",
            );
          }
        } catch {
          toast.error("Erro ao salvar localização. Tente novamente.");
        } finally {
          setGeoPending(false);
        }
      },
      (error) => {
        setGeoPending(false);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error(
            "Permissão de localização negada. Nas configurações do seu navegador ou celular, permita o acesso à localização para o CollectHub.",
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error(
            "Não foi possível obter sua localização. Tente novamente.",
          );
        } else {
          toast.error(
            "Erro ao obter localização. Verifique suas configurações.",
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }, [finishExit, router]);

  if (!show || gone) {
    return null;
  }

  if (!storageRead) {
    return null;
  }

  if (storageDismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-primary/30 bg-primary/10 rounded-xl border p-4 transition-opacity duration-300 ease-out md:p-5",
        exiting ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      role="region"
      aria-label="Ativar localização para ver distâncias nos matches"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <MapPin
          className="text-primary size-5 shrink-0 sm:mt-0.5"
          aria-hidden
          strokeWidth={2}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-foreground text-base font-semibold tracking-tight">
            Encontre quem está mais perto de você
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ative a localização e veja a distância até cada colecionador nos seus
            matches.
          </p>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              variant="gradient"
              size="default"
              disabled={geoPending || exiting}
              className="w-full sm:w-auto"
              onClick={() => void handleAtivarLocalizacao()}
            >
              {geoPending ? "Aguardando GPS…" : "Ativar localização agora"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="default"
              disabled={geoPending || exiting}
              className="text-muted-foreground w-full sm:w-auto"
              onClick={handleAgoraNao}
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
