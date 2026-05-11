"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface PerfilLocalizacaoSectionProps {
  /** Indica se há latitude/longitude salvas no perfil (servidor). */
  initialTemLocalizacao: boolean;
  /** ISO timestamp `localizacao_atualizada_em` quando aplicável. */
  initialAtualizadaEm: string | null;
}

/**
 * Bloco opcional de geolocalização no perfil (somente sob demanda do usuário).
 */
export function PerfilLocalizacaoSection({
  initialTemLocalizacao,
  initialAtualizadaEm,
}: PerfilLocalizacaoSectionProps) {
  const router = useRouter();
  const [temLocalizacao, setTemLocalizacao] = useState(initialTemLocalizacao);
  const [atualizadaEm, setAtualizadaEm] = useState<string | null>(
    initialAtualizadaEm,
  );
  const [loadingLocalizacao, setLoadingLocalizacao] = useState(false);

  useEffect(() => {
    setTemLocalizacao(initialTemLocalizacao);
    setAtualizadaEm(initialAtualizadaEm);
  }, [initialAtualizadaEm, initialTemLocalizacao]);

  const handleCompartilharOuAtualizar = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }

    setLoadingLocalizacao(true);

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
            const nowIso = new Date().toISOString();
            setTemLocalizacao(true);
            setAtualizadaEm(nowIso);
            toast.success("Localização atualizada!");
            router.refresh();
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
          setLoadingLocalizacao(false);
        }
      },
      (error) => {
        setLoadingLocalizacao(false);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error(
            "Permissão de localização negada. Nas configurações do seu navegador ou celular, permita o acesso à localização para o Stickermatch.",
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
  }, [router]);

  const handleRemover = useCallback(async () => {
    setLoadingLocalizacao(true);
    try {
      const response = await fetch("/api/perfil/localizacao", {
        method: "DELETE",
      });
      if (response.ok) {
        setTemLocalizacao(false);
        setAtualizadaEm(null);
        toast.success("Localização removida.");
        router.refresh();
      } else {
        toast.error("Não foi possível remover a localização.");
      }
    } catch {
      toast.error("Não foi possível remover a localização.");
    } finally {
      setLoadingLocalizacao(false);
    }
  }, [router]);

  let atualizadaTexto = "";
  if (temLocalizacao && atualizadaEm) {
    try {
      atualizadaTexto = formatDistanceToNow(new Date(atualizadaEm), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      atualizadaTexto = "recentemente";
    }
  }

  return (
    <div className="border-border space-y-5 rounded-xl border bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        <MapPin className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-tight">
            Localização
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Usada para mostrar a distância entre você e outros colecionadores nos
            Matches. Opcional e apenas você controla.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-border border-t pt-4">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Status atual
        </p>

        {temLocalizacao ?
          <div className="space-y-1">
            <p className="text-sm font-medium">● Localização salva</p>
            <p className="text-muted-foreground text-xs">
              Atualizada {atualizadaTexto || "recentemente"}
            </p>
          </div>
        : <p className="text-muted-foreground text-sm">
            ○ Sem localização cadastrada
          </p>
        }
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={loadingLocalizacao}
          onClick={() => void handleCompartilharOuAtualizar()}
          className="gap-1.5"
        >
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {temLocalizacao ?
            "Atualizar minha localização"
          : "Compartilhar minha localização"}
        </Button>
        {temLocalizacao ?
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingLocalizacao}
            onClick={() => void handleRemover()}
            className="gap-1.5"
          >
            <Trash2 className="size-3.5 shrink-0" aria-hidden />
            Remover localização
          </Button>
        : null}
      </div>

      <p className="text-muted-foreground border-border border-t pt-4 text-xs leading-relaxed">
        🔒 Só a distância aproximada é compartilhada com outros usuários. Suas
        coordenadas exatas nunca são exibidas.
      </p>
    </div>
  );
}
