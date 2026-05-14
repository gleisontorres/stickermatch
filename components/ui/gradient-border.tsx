import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const radiusOuter = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
} as const;

const radiusInner = {
  xl: "rounded-[calc(var(--radius-xl)-1px)]",
  "2xl": "rounded-[calc(var(--radius-2xl)-1px)]",
} as const;

interface GradientBorderProps {
  children: ReactNode;
  /** Raio da moldura (alinhar ao card vizinho). */
  radius?: keyof typeof radiusOuter;
  className?: string;
  innerClassName?: string;
}

/**
 * Moldura com gradiente verde → dourado e conteúdo em fundo de card.
 */
export function GradientBorder({
  children,
  radius = "2xl",
  className,
  innerClassName,
}: GradientBorderProps) {
  return (
    <div
      className={cn("p-px", radiusOuter[radius], className)}
      style={{
        background: "linear-gradient(135deg, #10b981, #f59e0b)",
      }}
    >
      <div className={cn("bg-card h-full", radiusInner[radius], innerClassName)}>
        {children}
      </div>
    </div>
  );
}
