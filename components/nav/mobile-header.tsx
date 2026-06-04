"use client";

import Image from "next/image";
import Link from "next/link";

import type { UserMenuUser } from "@/components/nav/user-menu";
import { UserMenu } from "@/components/nav/user-menu";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  user: UserMenuUser;
  className?: string;
}

/**
 * Cabeçalho fixo no mobile: marca CollectHub e menu do usuário (avatar).
 */
export function MobileHeader({ user, className }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "border-border bg-background fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-50 flex h-14 items-center justify-between border-b px-4 md:hidden",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className="transition-colors duration-150 flex min-w-0 items-center gap-2 font-semibold tracking-tight hover:text-primary"
        aria-label="CollectHub — ir para o painel"
      >
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={28}
          height={28}
          className="shrink-0"
        />
        <span className="brand-gradient-text truncate font-bold text-lg leading-none">
          CollectHub
        </span>
      </Link>
      <UserMenu user={user} variant="mobile" />
    </header>
  );
}
