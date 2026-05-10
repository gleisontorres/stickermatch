"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { FigurinhaCard } from "@/components/figurinha-card";
import { Button, buttonVariants } from "@/components/ui/button";
import type { AlbumFilterMode, Figurinha } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AlbumViewProps {
  figurinhas: Figurinha[];
  /** Mapa figurinha_id → quantidade já persistida no servidor. */
  initialQuantities: Record<string, number>;
}

function groupTitle(figurinha: Figurinha): string {
  if (figurinha.tipo === "especial") {
    return "Especiais";
  }
  return figurinha.selecao ?? "Outros";
}

function minNumero(items: Figurinha[]): number {
  return Math.min(...items.map((i) => i.numero ?? 999999));
}

/**
 * Álbum completo: filtros, busca e acordeão por seleção / especiais.
 */
export function AlbumView({ figurinhas, initialQuantities }: AlbumViewProps) {
  const [quantities, setQuantities] =
    useState<Record<string, number>>(initialQuantities);
  const qtyRef = useRef<Record<string, number>>(initialQuantities);
  const [filterMode, setFilterMode] = useState<AlbumFilterMode>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setQuantities(initialQuantities);
    qtyRef.current = initialQuantities;
  }, [initialQuantities]);

  useEffect(() => {
    qtyRef.current = quantities;
  }, [quantities]);

  const persistQty = useCallback(
    async (figurinhaId: string, oldVal: number, newVal: number) => {
      setBusyId(figurinhaId);
      setSaveError(null);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setQuantities((p) => ({ ...p, [figurinhaId]: oldVal }));
        qtyRef.current = { ...qtyRef.current, [figurinhaId]: oldVal };
        setSaveError("Sessão expirada. Entre novamente.");
        setBusyId(null);
        return;
      }

      const { error } = await supabase.from("colecao").upsert(
        {
          user_id: user.id,
          figurinha_id: figurinhaId,
          quantidade: newVal,
        },
        { onConflict: "user_id,figurinha_id" },
      );

      if (error) {
        setQuantities((p) => ({ ...p, [figurinhaId]: oldVal }));
        qtyRef.current = { ...qtyRef.current, [figurinhaId]: oldVal };
        setSaveError(error.message);
      }

      setBusyId(null);
    },
    [],
  );

  const handleQtyChange = useCallback(
    (figurinhaId: string, rawNext: number) => {
      const next = Math.max(0, Math.min(99, rawNext));
      const oldVal = qtyRef.current[figurinhaId] ?? 0;
      if (next === oldVal) {
        return;
      }

      setQuantities((p) => ({ ...p, [figurinhaId]: next }));
      qtyRef.current = { ...qtyRef.current, [figurinhaId]: next };

      void persistQty(figurinhaId, oldVal, next);
    },
    [persistQty],
  );

  const filteredFigurinhas = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return figurinhas.filter((f) => {
      const qty = quantities[f.id] ?? 0;

      if (needle) {
        const hay = `${f.nome} ${f.id} ${f.selecao ?? ""} ${f.selecao_codigo ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) {
          return false;
        }
      }

      switch (filterMode) {
        case "faltas":
          return qty === 0;
        case "repetidas":
          return qty > 1;
        case "tenho":
          return qty >= 1;
        default:
          return true;
      }
    });
  }, [figurinhas, quantities, search, filterMode]);

  const grouped = useMemo(() => {
    const map = new Map<string, Figurinha[]>();
    for (const f of filteredFigurinhas) {
      const key = groupTitle(f);
      const list = map.get(key) ?? [];
      list.push(f);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
    }
    const entries = [...map.entries()].sort((a, b) => {
      if (a[0] === "Especiais") return 1;
      if (b[0] === "Especiais") return -1;
      return minNumero(a[1]) - minNumero(b[1]);
    });
    return entries;
  }, [filteredFigurinhas]);

  const filterButtons: { mode: AlbumFilterMode; label: string }[] = [
    { mode: "all", label: "Todas" },
    { mode: "faltas", label: "Só faltas" },
    { mode: "tenho", label: "Só tenho" },
    { mode: "repetidas", label: "Só repetidas" },
  ];

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearch("");
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Álbum</h1>
          <p className="text-muted-foreground text-sm">
            Toque em + ou − para atualizar a coleção (salvo automaticamente).
          </p>
        </div>
        <Link
          href="/pacote"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0 self-start",
          )}
        >
          Modo pacote rápido
        </Link>
      </header>

      {saveError ? (
        <p
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
          role="alert"
        >
          {saveError}
        </p>
      ) : null}

      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-10 flex flex-col gap-3 border-b pb-4 pt-1 backdrop-blur-md md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(({ mode, label }) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={filterMode === mode ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setFilterMode(mode)}
            >
              {label}
            </Button>
          ))}
        </div>
        <label className="flex min-w-[min(100%,20rem)] flex-1 flex-col gap-1 md:max-w-sm">
          <span className="text-muted-foreground text-xs font-medium">
            Buscar por nome ou código
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Nome, código ou seleção…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
          />
        </label>
      </div>

      <p className="text-muted-foreground text-sm">
        Mostrando{" "}
        <span className="text-foreground font-medium">
          {filteredFigurinhas.length}
        </span>{" "}
        de {figurinhas.length} figurinhas
      </p>

      {grouped.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Nenhuma figurinha neste filtro. Ajuste a busca ou os filtros acima.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([title, items]) => (
            <details key={title} className="group border-border rounded-xl border">
              <summary
                className={cn(
                  "cursor-pointer list-none px-4 py-3 font-medium outline-none",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{title}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {items.length} figurinha{items.length === 1 ? "" : "s"}
                  </span>
                </span>
              </summary>
              <div className="border-border grid gap-2 border-t p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((f) => (
                  <FigurinhaCard
                    key={f.id}
                    figurinha={f}
                    quantidade={quantities[f.id] ?? 0}
                    disabled={busyId === f.id}
                    onQuantidadeChange={handleQtyChange}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
