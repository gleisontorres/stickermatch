"use client";

import { useEffect, useState } from "react";

import { FigurinhaCard } from "@/components/figurinha-card";
import { albumGroupTitle } from "@/lib/album/group-title";
import type { Figurinha } from "@/lib/types";

const CHUNK_STEP = 10;

interface AlbumFigurinhaChunkGridProps {
  /** Reinicia pintura incremental quando o catálogo filtrado muda. */
  readonly stableKey: string;
  readonly items: readonly Figurinha[];
  readonly quantities: Readonly<Record<string, number>>;
  readonly busyId: string | null;
  readonly quickPrepLoading: boolean;
  readonly globalBusy: boolean;
  readonly busyGroupTitle: string | null;
  readonly quickRegistrationMode: boolean;
  readonly onQuickTap: (figurinhaId: string) => void;
  readonly onQuantidadeChange: (
    figurinhaId: string,
    next: number,
  ) => void;
}

/**
 * Grid de figurinhas com pintura incremental (menos trabalho síncrono no expand).
 */
export function AlbumFigurinhaChunkGrid({
  stableKey,
  items,
  quantities,
  busyId,
  quickPrepLoading,
  globalBusy,
  busyGroupTitle,
  quickRegistrationMode,
  onQuickTap,
  onQuantidadeChange,
}: AlbumFigurinhaChunkGridProps) {
  const len = items.length;

  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(CHUNK_STEP, len),
  );

  useEffect(() => {
    setVisibleCount(Math.min(CHUNK_STEP, len));
  }, [stableKey, len]);

  useEffect(() => {
    if (visibleCount >= len) {
      return undefined;
    }
    const frame = requestAnimationFrame(() => {
      setVisibleCount((prev) => Math.min(prev + CHUNK_STEP, len));
    });
    return () => cancelAnimationFrame(frame);
  }, [visibleCount, len]);

  const visible = visibleCount <= len ? items.slice(0, visibleCount) : items;

  return (
    <div
      className="border-border grid gap-2 border-t p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "auto 380px",
      }}
    >
      {visible.map((f) => (
        <FigurinhaCard
          key={f.id}
          figurinha={f}
          quantidade={quantities[f.id] ?? 0}
          disabled={
            busyId === f.id ||
            quickPrepLoading ||
            globalBusy ||
            (busyGroupTitle !== null &&
              albumGroupTitle(f) === busyGroupTitle)
          }
          quickTapMode={quickRegistrationMode}
          onQuickTap={() => onQuickTap(f.id)}
          onQuantidadeChange={onQuantidadeChange}
        />
      ))}
    </div>
  );
}