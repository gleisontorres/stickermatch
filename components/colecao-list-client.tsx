"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { Figurinha } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ColecaoListItem = Figurinha & { quantidade: number };

interface ColecaoListClientProps {
  variant: "repetidas" | "faltas";
  items: ColecaoListItem[];
}

/**
 * Lista filtrável (busca) de repetidas ou faltas.
 */
export function ColecaoListClient({ variant, items }: ColecaoListClientProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return items;
    }
    return items.filter((row) => {
      const hay = `${row.nome} ${row.id} ${row.selecao ?? ""} ${row.selecao_codigo ?? ""} ${row.grupo ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, search]);

  const title = variant === "repetidas" ? "Repetidas" : "Faltas";
  const subtitle =
    variant === "repetidas"
      ? "Figurinhas com mais de uma cópia (quantidade ≥ 2)."
      : "Figurinhas que ainda não estão na sua coleção (quantidade 0).";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">
            Buscar
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, código, seleção, grupo…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
          />
        </label>
        <Link
          href="/album"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0",
          )}
        >
          Abrir álbum
        </Link>
      </div>

      <p className="text-muted-foreground text-sm">
        {filtered.length === items.length ? (
          <>
            Total:{" "}
            <span className="text-foreground font-medium">{items.length}</span>
          </>
        ) : (
          <>
            Exibindo{" "}
            <span className="text-foreground font-medium">{filtered.length}</span>{" "}
            de{" "}
            <span className="text-foreground font-medium">{items.length}</span>
          </>
        )}
      </p>

      {items.length === 0 ? (
        <EmptyState variant={variant} />
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nenhum resultado para esta busca.
        </p>
      ) : (
        <ul className="border-border divide-border divide-y rounded-xl border">
          {filtered.map((row) => (
            <li key={row.id}>
              <ColecaoListRow variant={variant} row={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ variant }: { variant: "repetidas" | "faltas" }) {
  if (variant === "repetidas") {
    return (
      <div className="border-border bg-muted/30 rounded-xl border border-dashed px-4 py-10 text-center">
        <p className="text-muted-foreground text-sm">
          Você ainda não marcou nenhuma repetida. No álbum, use + até ficar com 2
          ou mais cópias.
        </p>
        <Link
          href="/album"
          className={cn(buttonVariants({ variant: "default" }), "mt-4 inline-flex")}
        >
          Ir para o álbum
        </Link>
      </div>
    );
  }

  return (
    <div className="border-primary/35 bg-primary/[0.10] rounded-xl border px-4 py-10 text-center">
      <p className="text-foreground text-sm font-medium">
        Parabéns — parece que não falta nenhuma figurinha (todas com pelo menos 1
        cópia).
      </p>
      <Link
        href="/album"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "mt-4 inline-flex",
        )}
      >
        Ver álbum
      </Link>
    </div>
  );
}

function ColecaoListRow({
  variant,
  row,
}: {
  variant: "repetidas" | "faltas";
  row: ColecaoListItem;
}) {
  const numLabel = row.numero != null ? `#${row.numero}` : row.id;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-4",
        variant === "repetidas" && "bg-secondary/[0.08]",
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-mono font-medium">{numLabel}</span>
          <span>·</span>
          <span>{row.tipo}</span>
          {row.grupo ? (
            <>
              <span>·</span>
              <span>Grupo {row.grupo}</span>
            </>
          ) : null}
          {row.selecao ? (
            <>
              <span>·</span>
              <span className="truncate">{row.selecao}</span>
            </>
          ) : null}
        </div>
        <p className="text-sm font-medium leading-snug">{row.nome}</p>
      </div>
      {variant === "repetidas" ? (
        <span
          className="brand-badge-gradient shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
          title={`${row.quantidade} cópias`}
        >
          ×{row.quantidade}
        </span>
      ) : null}
    </div>
  );
}
