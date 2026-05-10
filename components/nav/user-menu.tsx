"use client";

import Link from "next/link";
import {
  LogOut,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface UserMenuUser {
  displayName: string;
  email: string;
  avatarUrl: string;
}

interface UserMenuProps {
  user: UserMenuUser;
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
 * Menu da conta com DropdownMenu (Radix): perfil, tema e logout.
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

  const triggerClass =
    variant === "header" ?
      "size-10 shrink-0 justify-center rounded-lg p-0 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    : "hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(triggerClass, className)}
        aria-label="Menu da conta"
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
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        align={variant === "header" ? "end" : "start"}
        side={variant === "sidebar-footer" ? "top" : "bottom"}
        sideOffset={variant === "sidebar-footer" ? 8 : 6}
      >
        <DropdownMenuItem asChild>
          <Link href="/perfil" className="flex cursor-pointer items-center gap-2">
            <UserRound className="size-4 shrink-0 opacity-80" aria-hidden />
            Ver perfil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {mounted ?
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <span>Tema</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuRadioGroup
                value={theme ?? "dark"}
                onValueChange={(v) => setTheme(v)}
              >
                <DropdownMenuRadioItem value="light">
                  Claro ☀️
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  Escuro 🌙
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  Sistema 💻
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        : (
          <DropdownMenuItem disabled>Carregando tema…</DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2"
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
