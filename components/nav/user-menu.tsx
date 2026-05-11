"use client";

import Link from "next/link";
import {
  Check,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface UserMenuUser {
  displayName: string;
  email: string;
  avatarUrl: string;
  /** Quando verdadeiro, exibe atalho para o painel `/admin`. */
  isAdmin?: boolean;
}

interface UserMenuProps {
  user: UserMenuUser;
  /** Rodapé da sidebar (desktop) ou só avatar no header (mobile). */
  variant: "sidebar-footer" | "mobile";
  className?: string;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function AvatarImage({
  avatarUrl,
  name,
  sizeClass,
}: {
  avatarUrl: string;
  name: string;
  sizeClass: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL externa do perfil
      <img
        src={avatarUrl}
        alt=""
        className={cn("rounded-full object-cover", sizeClass)}
      />
    );
  }
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground flex items-center justify-center rounded-full text-xs font-medium",
        sizeClass,
      )}
      aria-hidden
    >
      {initialsFromName(name)}
    </span>
  );
}

/**
 * Menu da conta: cabeçalho com usuário, perfil, tema (lista com check) e sair.
 * Opções de tema só renderizam após mount para evitar mismatch de hidratação.
 */
export function UserMenu({ user, variant, className }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isMobile = variant === "mobile";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            isMobile ?
              "border-border hover:bg-muted/80 flex size-10 shrink-0 items-center justify-center rounded-full border border-transparent p-0"
            : "border-border hover:bg-muted flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-left",
            className,
          )}
          aria-label="Menu da conta"
        >
          <AvatarImage
            avatarUrl={user.avatarUrl}
            name={user.displayName}
            sizeClass={cn(isMobile ? "size-10" : "size-10 shrink-0")}
          />
          {!isMobile ?
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.displayName}</p>
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            </div>
          : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        align={isMobile ? "end" : "start"}
        side={isMobile ? "bottom" : "top"}
        sideOffset={isMobile ? 8 : 10}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-start gap-2">
            <AvatarImage
              avatarUrl={user.avatarUrl}
              name={user.displayName}
              sizeClass="size-9 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm leading-tight font-semibold">
                {user.displayName}
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/perfil" className="flex cursor-pointer items-center gap-2">
            <User className="size-4 shrink-0 opacity-80" aria-hidden />
            Ver perfil
          </Link>
        </DropdownMenuItem>

        {user.isAdmin ?
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/admin"
                className="flex cursor-pointer items-center gap-2"
              >
                <Settings className="size-4 shrink-0 opacity-80" aria-hidden />
                Painel Admin
              </Link>
            </DropdownMenuItem>
          </>
        : null}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          Tema
        </DropdownMenuLabel>

        {mounted ?
          <>
            <DropdownMenuItem
              className="gap-2"
              onSelect={(e) => {
                e.preventDefault();
                setTheme("light");
              }}
            >
              <Sun className="size-4 shrink-0 opacity-80" aria-hidden />
              <span className="flex-1">Claro</span>
              {theme === "light" ?
                <Check className="text-primary size-4 shrink-0" aria-hidden />
              : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onSelect={(e) => {
                e.preventDefault();
                setTheme("dark");
              }}
            >
              <Moon className="size-4 shrink-0 opacity-80" aria-hidden />
              <span className="flex-1">Escuro</span>
              {theme === "dark" ?
                <Check className="text-primary size-4 shrink-0" aria-hidden />
              : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onSelect={(e) => {
                e.preventDefault();
                setTheme("system");
              }}
            >
              <Monitor className="size-4 shrink-0 opacity-80" aria-hidden />
              <span className="flex-1">Sistema</span>
              {theme === "system" ?
                <Check className="text-primary size-4 shrink-0" aria-hidden />
              : null}
            </DropdownMenuItem>
          </>
        : (
          <DropdownMenuItem disabled>Carregando tema…</DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive gap-2"
          onSelect={(e) => {
            e.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
