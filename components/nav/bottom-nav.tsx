"use client";

import {
  ArrowLeftRight,
  BookOpen,
  LayoutDashboard,
  MessageCircle,
  PackagePlus,
} from "lucide-react";

import { BottomNavItem } from "@/components/nav/nav-item";
import { cn } from "@/lib/utils";

const BOTTOM_LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    ariaLabel: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/pacote",
    label: "Pacote",
    ariaLabel: "Pacote",
    icon: PackagePlus,
  },
  {
    href: "/album",
    label: "Álbum",
    ariaLabel: "Álbum",
    icon: BookOpen,
  },
  {
    href: "/matches",
    label: "Matches",
    ariaLabel: "Matches",
    icon: ArrowLeftRight,
  },
  {
    href: "/chat",
    label: "Chat",
    ariaLabel: "Chat Albu AI",
    icon: MessageCircle,
  },
] as const;

interface BottomNavProps {
  className?: string;
}

/**
 * Barra inferior fixa no mobile com os 5 destinos principais.
 */
export function BottomNav({ className }: BottomNavProps) {
  return (
    <nav
      role="navigation"
      aria-label="Navegação principal"
      className={cn(
        "border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <div className="flex h-16 max-w-full items-stretch justify-around px-1 pt-1">
        {BOTTOM_LINKS.map((item) => (
          <BottomNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            ariaLabel={item.ariaLabel}
          />
        ))}
      </div>
    </nav>
  );
}
