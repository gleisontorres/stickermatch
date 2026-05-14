"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { isNavPathActive } from "@/components/nav/nav-utils";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Texto para leitores de tela (ex.: nome completo da funcionalidade). */
  ariaLabel?: string;
}

/**
 * Item da sidebar desktop com ícone, label e estado ativo (borda esquerda + fundo).
 */
export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  ariaLabel,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const active = isNavPathActive(pathname, href);

  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "transition-colors duration-150 flex min-h-10 items-stretch overflow-hidden rounded-md text-sm font-medium",
        !active && "text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "w-[3px] shrink-0 rounded-full",
          active ?
            "bg-gradient-to-b from-[#10b981] to-[#f59e0b]"
          : "bg-transparent",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "flex flex-1 items-center gap-3 px-3 py-2 rounded-r-md",
          active ?
            "bg-[linear-gradient(135deg,rgba(16,185,129,0.15),rgba(245,158,11,0.08))] text-foreground font-medium"
          : "hover:bg-muted border-l-0",
        )}
      >
        <Icon className="size-6 shrink-0" aria-hidden />
        <span>{label}</span>
      </span>
    </Link>
  );
}

interface BottomNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  ariaLabel?: string;
}

/**
 * Item da bottom navigation mobile: ícone + label, alvo de toque ≥44px.
 */
export function BottomNavItem({
  href,
  label,
  icon: Icon,
  ariaLabel,
}: BottomNavItemProps) {
  const pathname = usePathname();
  const active = isNavPathActive(pathname, href);

  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "transition-colors duration-150 flex min-h-12 min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1",
        active ? "text-primary" : "text-muted-foreground active:bg-muted/50",
        !active && "hover:bg-muted/50",
      )}
    >
      <Icon className="size-6 shrink-0" aria-hidden />
      <span className="max-w-full truncate px-0.5 text-xs leading-none">{label}</span>
      <span
        className={cn(
          "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150",
          active ?
            "bg-[linear-gradient(135deg,#10b981,#f59e0b)]"
          : "bg-transparent",
        )}
        aria-hidden
      />
    </Link>
  );
}
