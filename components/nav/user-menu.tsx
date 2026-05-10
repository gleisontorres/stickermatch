"use client";

import {
  LogOut,
  Monitor,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface UserMenuUser {
  displayName: string;
  email: string;
  avatarUrl: string;
}

interface UserMenuProps {
  user: UserMenuUser;
  /** `header`: só avatar. `sidebar-footer`: avatar + nome + email. */
  variant: "header" | "sidebar-footer";
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
 * Menu do usuário: perfil, tema (3 opções) e logout.
 */
export function UserMenu({ user, variant, className }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const themeItems = [
    { id: "light" as const, label: "Claro", glyph: Sun },
    { id: "dark" as const, label: "Escuro", glyph: Moon },
    { id: "system" as const, label: "Sistema", glyph: Monitor },
  ];

  const menuPosition =
    variant === "header" ?
      "right-0 top-full mt-1 min-w-[13rem]"
    : "bottom-full left-2 right-2 mb-2 min-w-0";

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        type="button"
        className={cn(
          "transition-colors duration-150 flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
          variant === "header" ?
            "size-10 shrink-0 justify-center hover:bg-muted/80"
          : "hover:bg-muted w-full px-3 py-3 text-left",
        )}
        aria-label="Menu da conta"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {variant === "header" ? (
          <AvatarImage
            avatarUrl={user.avatarUrl}
            name={user.displayName}
            sizeClass="size-10"
          />
        ) : (
          <>
            <AvatarImage
              avatarUrl={user.avatarUrl}
              name={user.displayName}
              sizeClass="size-10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.displayName}</p>
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            </div>
          </>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          aria-orientation="vertical"
          className={cn(
            "border-border bg-popover text-popover-foreground absolute z-[60] overflow-hidden rounded-lg border py-1 shadow-md",
            menuPosition,
          )}
        >
          <Link
            href="/perfil"
            role="menuitem"
            className="hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            <UserRound className="size-4 shrink-0 opacity-80" aria-hidden />
            Ver perfil
          </Link>

          <div className="border-border my-1 border-t" role="separator" />

          <p className="text-muted-foreground px-3 py-1 text-xs font-medium tracking-wide uppercase">
            Tema
          </p>
          {mounted ?
            themeItems.map(({ id, label, glyph: Glyph }) => (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={theme === id}
                className={cn(
                  "hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none",
                  theme === id && "bg-muted/80",
                )}
                onClick={() => {
                  setTheme(id);
                }}
              >
                <Glyph className="size-4 shrink-0 opacity-80" aria-hidden />
                <span>{label}</span>
              </button>
            ))
          : (
            <p className="text-muted-foreground px-3 py-2 text-xs">
              Carregando tema…
            </p>
          )}

          <div className="border-border my-1 border-t" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
