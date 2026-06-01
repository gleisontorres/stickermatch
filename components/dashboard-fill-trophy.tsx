import { cn } from "@/lib/utils";

interface DashboardFillTrophyProps {
  /** Progresso do álbum (0–100); em 100 exibe estado dourado. */
  fillPercent: number;
  className?: string;
}

/**
 * Troféu do Dashboard: prata com shimmer abaixo de 100%, dourado com glow em 100%.
 */
export function DashboardFillTrophy({
  fillPercent,
  className,
}: DashboardFillTrophyProps) {
  const isComplete = fillPercent >= 100;

  return (
    <span
      className={cn(
        "inline-block shrink-0 leading-none select-none",
        isComplete ? "dashboard-trophy-gold" : "dashboard-trophy-silver",
        className,
      )}
      aria-hidden
    >
      🏆
    </span>
  );
}
