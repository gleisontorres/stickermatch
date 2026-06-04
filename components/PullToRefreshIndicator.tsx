"use client";

import { ArrowDown, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

const BRAND_GREEN = "#10b981";

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  pullProgress: number;
  isRefreshing?: boolean;
}

/**
 * Indicador visual fixo no topo durante pull-to-refresh (mobile/PWA).
 */
export function PullToRefreshIndicator({
  isPulling,
  pullProgress,
  isRefreshing = false,
}: PullToRefreshIndicatorProps) {
  const isReady = pullProgress >= 1;
  const visible = isPulling || isRefreshing;

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-14 z-40 flex justify-center md:hidden"
      aria-hidden="true"
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur-sm",
          "transition-all duration-200 ease-out",
        )}
        style={{
          opacity: isRefreshing ? 1 : Math.max(pullProgress, 0.3),
          transform: `translateY(${isRefreshing ? 0 : pullProgress * 12}px)`,
        }}
      >
        {isRefreshing ? (
          <RefreshCw
            className="size-5 animate-spin"
            style={{ color: BRAND_GREEN }}
            aria-hidden="true"
          />
        ) : (
          <ArrowDown
            className="size-5 transition-all duration-200 ease-out"
            style={{
              color: isReady ? BRAND_GREEN : "var(--muted-foreground)",
              transform: `rotate(${isReady ? 180 : pullProgress * 180}deg)`,
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
