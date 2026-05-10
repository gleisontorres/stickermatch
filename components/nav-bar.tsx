"use client";

import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/album", label: "Álbum" },
  { href: "/pacote", label: "Pacote" },
  { href: "/repetidas", label: "Repetidas" },
  { href: "/faltas", label: "Faltas" },
  { href: "/matches", label: "Matches" },
  { href: "/chat", label: "Chat" },
  { href: "/perfil", label: "Perfil" },
] as const;

interface NavBarProps {
  /** Nome ou identificador curto exibido ao lado do tema. */
  displayName: string;
}

/**
 * Barra de navegação autenticada com links, nome do usuário e toggle de tema.
 */
export function NavBar({ displayName }: NavBarProps) {
  const label = displayName.trim() || "Conta";

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-border border-b backdrop-blur">
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-sm font-medium">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <span
            className="text-muted-foreground max-w-[min(42vw,12rem)] truncate text-xs sm:max-w-[14rem] md:max-w-[18rem]"
            title={label}
          >
            {label}
          </span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
