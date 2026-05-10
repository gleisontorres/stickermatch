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
        "transition-colors duration-150 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium border-l-[3px]",
        active ?
          "bg-primary/10 text-primary border-l-primary"
        : "text-muted-foreground hover:bg-muted border-l-transparent hover:text-foreground",
      )}
    >
      <Icon className="size-6 shrink-0" aria-hidden />
      <span>{label}</span>
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
          "mt-0.5 h-1 w-1 shrink-0 rounded-full transition-colors duration-150",
          active ? "bg-primary" : "bg-transparent",
        )}
        aria-hidden
      />
    </Link>
  );
}
