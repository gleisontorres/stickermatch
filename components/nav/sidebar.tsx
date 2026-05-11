"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BookOpen,
  CircleDashed,
  Copy,
  LayoutDashboard,
  MessageCircle,
  PackagePlus,
  Settings,
  Ticket,
} from "lucide-react";
import Link from "next/link";

import { SidebarNavItem } from "@/components/nav/nav-item";
import type { UserMenuUser } from "@/components/nav/user-menu";
import { UserMenu } from "@/components/nav/user-menu";
import { cn } from "@/lib/utils";

interface SidebarNavLinkDef {
  href: string;
  label: string;
  icon: LucideIcon;
  ariaLabel?: string;
}

interface SidebarGroupDef {
  title: string;
  items: SidebarNavLinkDef[];
}

const GROUPS: SidebarGroupDef[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pacote", label: "Pacote", icon: PackagePlus },
      { href: "/album", label: "Álbum", icon: BookOpen },
    ],
  },
  {
    title: "Coleção",
    items: [
      { href: "/repetidas", label: "Repetidas", icon: Copy },
      { href: "/faltas", label: "Faltas", icon: CircleDashed },
      { href: "/matches", label: "Matches", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Assistente",
    items: [
      {
        href: "/chat",
        label: "Chat (Albu AI)",
        icon: MessageCircle,
        ariaLabel: "Chat — Albu AI",
      },
    ],
  },
];

interface SidebarProps {
  user: UserMenuUser;
  className?: string;
}

/**
 * Sidebar fixa à esquerda no desktop (md+).
 */
export function Sidebar({ user, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "border-border bg-background fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r md:flex",
        className,
      )}
    >
      <div className="border-border shrink-0 border-b px-4 py-4">
        <Link
          href="/dashboard"
          className="transition-colors duration-150 flex items-center gap-2 font-semibold tracking-tight hover:text-primary"
          aria-label="Stickermatch — ir para o painel"
        >
          <Ticket className="text-primary size-8 shrink-0" aria-hidden />
          <span>Stickermatch</span>
        </Link>
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto px-2 pt-2 pb-4"
        aria-label="Seções do aplicativo"
      >
        {GROUPS.map((group, index) => (
          <div key={group.title}>
            <p
              className={cn(
                "text-muted-foreground mb-2 px-3 text-xs font-medium tracking-wide uppercase",
                index === 0 ? "mt-0" : "mt-4",
              )}
            >
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  ariaLabel={item.ariaLabel}
                />
              ))}
            </div>
          </div>
        ))}

        {user.isAdmin ?
          <>
            <p className="text-muted-foreground mb-2 mt-4 px-3 text-xs font-medium tracking-wide uppercase">
              Admin
            </p>
            <div className="flex flex-col gap-0.5">
              <SidebarNavItem
                href="/admin"
                label="Painel Admin"
                icon={Settings}
                ariaLabel="Painel administrativo"
              />
            </div>
          </>
        : null}
      </nav>

      <div className="border-border mt-auto shrink-0 border-t">
        <UserMenu user={user} variant="sidebar-footer" />
      </div>
    </aside>
  );
}
